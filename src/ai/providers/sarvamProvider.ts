"use client";

// Real Sarvam AI adapters (§4). Each one wraps the corresponding Mock* provider
// and delegates to it on ANY failure, so the companion never hard-breaks:
//
//   Sarvam  →  browser capability / phrasebook  →  mock
//
// The key lives only on the server; these adapters call /api/setu/* routes that
// hold it. If the route says "not_configured" we fall straight through.

import type { LanguageCode } from "@/lib/types";
import type { SetuTurn, SetuTurnRequest } from "@/ai/schemas";
import { validateTurn } from "@/ai/schemas";
import { PERSONAS } from "@/ai/persona";
import { openAiToolSchemas, intentForTool } from "@/ai/tools/toolSchemas";
import type {
  AIProvider,
  ProviderInfo,
  SpeechListenCallbacks,
  SpeechProvider,
  SpeechRecognitionHandle,
  TranslationProvider,
  TranslationResult,
} from "./types";
import { MockLLMProvider } from "./mockLLMProvider";
import { MockSpeechProvider } from "./mockSpeechProvider";
import { MockTranslationProvider } from "./mockTranslationProvider";

/** Which capabilities actually reached Sarvam last time, for the status dot. */
export const sarvamRuntime = {
  chat: false,
  translation: false,
  stt: false,
  tts: false,
  lastError: "" as string,
};

// ---------------------------------------------------------------------------
// LLM
// ---------------------------------------------------------------------------

export class SarvamLLMProvider implements AIProvider {
  readonly info: ProviderInfo = { name: "Sarvam AI (server)", simulated: false };
  private fallback = new MockLLMProvider();

  async planTurn(req: SetuTurnRequest): Promise<SetuTurn> {
    const allowed = PERSONAS[req.persona]?.allowedTools ?? [];
    const tools = openAiToolSchemas(allowed as readonly string[]);
    // Reasoning model for the control room; conversational model for voice-first
    // pilgrim / volunteer turns.
    const conversational = req.persona !== "management";

    try {
      const res = await fetch("/api/setu/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: req.message,
          persona: req.persona,
          language: req.volunteerLanguage,
          conversational,
          offline: req.offline,
          operational: req.context.operational,
          knowledge: req.context.knowledge.map((k) => ({ title: k.title, body: k.body })),
          history: req.history.map((h) => ({ role: h.role, text: h.text })),
          tools,
        }),
      });
      if (!res.ok) {
        let reason = `chat_${res.status}`;
        try {
          const j = await res.json();
          if (j?.reason) reason = j.reason;
        } catch {}
        throw new Error(reason);
      }
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.reason || "chat_failed");

      const content: string = typeof data.content === "string" ? data.content.trim() : "";
      const call: { name: string; arguments: Record<string, unknown> } | null = data.tool ?? null;

      const replyText =
        content ||
        (call
          ? "Let me check that for you."
          : "I didn't quite get that — try again, or type it.");

      const candidate: SetuTurn = {
        intent: intentForTool(call?.name) as SetuTurn["intent"],
        urgency: "routine",
        reply: { [req.volunteerLanguage]: replyText, en: replyText },
        tool: call ? { name: call.name as never, arguments: call.arguments || {} } : undefined,
        // The orchestrator applies the registry's own risk/confirmation gate
        // (needsConfirmation(toolName)) regardless — we don't set it true here
        // because validateTurn then also requires a confirmationPrompt.
        requiresConfirmation: false,
        provenance: `Sarvam ${data.model || ""}`.trim(),
      };

      const turn = validateTurn(candidate);
      if (!turn) throw new Error("invalid_turn");
      sarvamRuntime.chat = true;
      sarvamRuntime.lastError = "";
      return turn;
    } catch (e) {
      sarvamRuntime.chat = false;
      sarvamRuntime.lastError = e instanceof Error ? e.message : "chat_failed";
      return this.fallback.planTurn(req);
    }
  }
}

// ---------------------------------------------------------------------------
// Translation
// ---------------------------------------------------------------------------

export class SarvamTranslationProvider implements TranslationProvider {
  readonly info: ProviderInfo = { name: "Sarvam AI translation (server)", simulated: false };
  private fallback = new MockTranslationProvider();

  getSupportedLanguages(): LanguageCode[] {
    return this.fallback.getSupportedLanguages();
  }

  async detectLanguage(text: string): Promise<LanguageCode> {
    return this.fallback.detectLanguage(text);
  }

  async translate(text: string, to: LanguageCode, from?: LanguageCode): Promise<TranslationResult> {
    try {
      const res = await fetch("/api/setu/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, to, from }),
      });
      if (!res.ok) throw new Error(`translate ${res.status}`);
      const data = await res.json();
      if (!data?.ok || typeof data.text !== "string" || !data.text) throw new Error("empty");
      sarvamRuntime.translation = true;
      return {
        text: data.text,
        detectedSource: (data.detectedSource as LanguageCode) || from || "en",
        confidence: 0.9,
        fromPhrasebook: false,
      };
    } catch (e) {
      sarvamRuntime.translation = false;
      sarvamRuntime.lastError = e instanceof Error ? e.message : "translate_failed";
      return this.fallback.translate(text, to, from);
    }
  }
}

// ---------------------------------------------------------------------------
// Speech (STT live via browser; TTS via Sarvam with browser fallback;
// batch STT via Sarvam when the browser has no Web Speech API)
// ---------------------------------------------------------------------------

export class SarvamSpeechProvider implements SpeechProvider {
  readonly info: ProviderInfo;
  private browser = new MockSpeechProvider();

  constructor() {
    this.info = {
      name: this.browser.isRecognitionAvailable()
        ? "Browser speech + Sarvam TTS"
        : "Sarvam speech (server)",
      simulated: false,
    };
  }

  isRecognitionAvailable() {
    return true; // browser SR or the Sarvam batch fallback below
  }
  isSpeechAvailable() {
    return true;
  }

  listen(language: LanguageCode, cb: SpeechListenCallbacks): SpeechRecognitionHandle {
    if (this.browser.isRecognitionAvailable()) {
      return this.browser.listen(language, cb);
    }
    // No Web Speech API — record a short clip and batch-transcribe via Sarvam.
    let recorder: MediaRecorder | null = null;
    let stopped = false;
    const chunks: BlobPart[] = [];

    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((stream) => {
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          try {
            const blob = new Blob(chunks, { type: "audio/webm" });
            const fd = new FormData();
            fd.append("audio", blob, "clip.webm");
            const res = await fetch("/api/setu/stt", { method: "POST", body: fd });
            const data = await res.json();
            if (res.ok && data?.ok && data.transcript) {
              sarvamRuntime.stt = true;
              cb.onFinal(String(data.transcript).trim());
            } else {
              throw new Error(data?.reason || "stt_failed");
            }
          } catch (e) {
            sarvamRuntime.stt = false;
            sarvamRuntime.lastError = e instanceof Error ? e.message : "stt_failed";
            cb.onError("unavailable");
          } finally {
            cb.onEnd?.();
          }
        };
        recorder.start();
      })
      .catch(() => {
        setTimeout(() => cb.onError("unavailable"), 0);
      });

    return {
      stop: () => {
        stopped = true;
        try {
          if (recorder && recorder.state === "recording") recorder.stop();
        } catch {}
      },
      abort: () => {
        stopped = true;
        try {
          if (recorder && recorder.state === "recording") recorder.stop();
        } catch {}
      },
    };
  }

  async speak(text: string, language: LanguageCode): Promise<void> {
    if (!text.trim()) return;
    try {
      const res = await fetch("/api/setu/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, lang: language }),
      });
      if (!res.ok) throw new Error(`tts ${res.status}`);
      const data = await res.json();
      if (!data?.ok || !data.audioBase64) throw new Error("empty");
      sarvamRuntime.tts = true;
      await new Promise<void>((resolve) => {
        const audio = new Audio(`data:${data.mime || "audio/wav"};base64,${data.audioBase64}`);
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        void audio.play().catch(() => resolve());
        setTimeout(resolve, Math.min(15000, 1500 + text.length * 55));
      });
    } catch (e) {
      sarvamRuntime.tts = false;
      sarvamRuntime.lastError = e instanceof Error ? e.message : "tts_failed";
      await this.browser.speak(text, language);
    }
  }

  cancelSpeech() {
    this.browser.cancelSpeech();
  }
}
