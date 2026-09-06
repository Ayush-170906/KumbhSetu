"use client";

// React binding for the Setu companion.
//
// Owns the visible state machine (§27), the transcript, live speech, the
// confirm-before-act gate and live-translation mode. Components read
// `messages` / `status` / `pending` and call `sendText` / `startListening` /
// `confirm` / `cancel`. All model + tool work goes through the orchestrator.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LanguageCode } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { getProviders } from "@/ai/providers";
import { SetuMemory } from "@/ai/memory";
import {
  runTurn,
  runPhotoTurn,
  confirmPending,
  type PendingConfirmation,
  type TurnResult,
} from "@/ai/orchestrator";
import type { SetuStatus, ConversationTurn, GroundReportDraft, Urgency } from "@/ai/schemas";
import type { SetuIntent } from "@/ai/intents";
import type { ToolContext } from "@/ai/tools";

export interface SetuMessage {
  id: string;
  role: "user" | "setu" | "pilgrim";
  text: string;
  at: string;
  /** Data URL of a photo the volunteer sent with this message (§18). */
  imageUrl?: string;
  provenance?: string;
  intent?: SetuIntent;
  urgency?: Urgency;
  toolName?: string;
  isFollowUp?: boolean;
  translation?: {
    to: LanguageCode;
    detectedSource: LanguageCode;
    confidence: number;
    fromPhrasebook: boolean;
  };
}

export interface UseSetuOptions {
  volunteerId: string;
  /** Called when a turn creates/opens something the surrounding app can show. */
  onCreated?: (kind: "incident" | "groundReport" | "task", id: string) => void;
}

let msgSeq = 0;
const mkId = () => `m${Date.now()}-${msgSeq++}`;

export function useSetu({ volunteerId, onCreated }: UseSetuOptions) {
  const providers = useMemo(() => getProviders(), []);
  const memoryRef = useRef<SetuMemory>(new SetuMemory());
  const listenRef = useRef<{ stop: () => void; abort: () => void } | null>(null);
  const photoRef = useRef<string | null>(null);

  const store = useAppStore();
  const volunteer = store.volunteers.find((v) => v.id === volunteerId) ?? store.volunteers[0];
  const zone = store.zones.find((z) => z.id === volunteer.zoneId);
  const offline = store.systemStatus.connectivity !== "nominal";

  const [volunteerLanguage, setVolunteerLanguage] = useState<LanguageCode>(
    volunteer.languages[0] ?? "en"
  );
  const [status, setStatus] = useState<SetuStatus>("idle");
  const [messages, setMessages] = useState<SetuMessage[]>([]);
  const [partial, setPartial] = useState("");
  const [pending, setPending] = useState<PendingConfirmation | null>(null);
  const [reportDraft, setReportDraft] = useState<GroundReportDraft | null>(null);
  const [translationOther, setTranslationOther] = useState<LanguageCode | null>(null);
  const [voiceReplies, setVoiceReplies] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);
  /** Set once the device speech API is present but unusable (mic blocked, no
   *  mic, or the recognition service is unreachable). Flips the companion to
   *  text-first for the rest of the session so the orb never errors on tap. */
  const [voiceBlocked, setVoiceBlocked] = useState(false);
  const networkFailsRef = useRef(0);

  const voiceInputAvailable = providers.speech.isRecognitionAvailable() && !voiceBlocked;
  const voiceOutputAvailable = providers.speech.isSpeechAvailable();

  // Field errors shouldn't sit on screen — clear them after a few seconds.
  useEffect(() => {
    if (!lastError) return;
    const t = setTimeout(() => setLastError(null), 6000);
    return () => clearTimeout(t);
  }, [lastError]);

  useEffect(() => {
    return () => {
      listenRef.current?.abort();
      providers.speech.cancelSpeech();
    };
  }, [providers]);

  const buildToolContext = useCallback((): ToolContext => {
    const s = useAppStore.getState();
    const v = s.volunteers.find((x) => x.id === volunteerId) ?? s.volunteers[0];
    return {
      store: s,
      getStore: () => useAppStore.getState(),
      actor: { role: "volunteer", id: v.id, label: `${v.name} · ${v.id}` },
      zoneId: v.zoneId,
      position: v.position,
      offline: s.systemStatus.connectivity !== "nominal",
      photo: photoRef.current,
      translation: providers.translation,
    };
  }, [volunteerId, providers]);

  const history = useCallback(
    (): ConversationTurn[] =>
      messages
        .filter((m) => m.role !== "pilgrim")
        .map((m) => ({ role: m.role === "user" ? "user" : "setu", text: m.text, at: m.at })),
    [messages]
  );

  const push = useCallback((m: Omit<SetuMessage, "id" | "at"> & { at?: string }) => {
    setMessages((prev) => [...prev, { id: mkId(), at: m.at ?? new Date().toISOString(), ...m }]);
  }, []);

  const speakOut = useCallback(
    async (text: string, lang?: LanguageCode) => {
      if (!voiceReplies || !voiceOutputAvailable || !text.trim()) {
        setStatus((s) => (s === "speaking" || s === "thinking" || s === "taking_action" ? "idle" : s));
        return;
      }
      setStatus("speaking");
      await providers.speech.speak(text, lang ?? volunteerLanguage);
      setStatus((s) => (s === "speaking" ? "idle" : s));
    },
    [providers, voiceReplies, voiceOutputAvailable, volunteerLanguage]
  );

  /** Explicit "read this aloud" — ignores the voiceReplies preference so a
   *  volunteer can replay a translation for a pilgrim on demand (§26). */
  const speakAloud = useCallback(
    async (text: string, lang?: LanguageCode) => {
      if (!voiceOutputAvailable || !text.trim()) return;
      providers.speech.cancelSpeech();
      setStatus("speaking");
      await providers.speech.speak(text, lang ?? volunteerLanguage);
      setStatus((s) => (s === "speaking" ? "idle" : s));
    },
    [providers, voiceOutputAvailable, volunteerLanguage]
  );

  const applyResult = useCallback(
    (res: TurnResult) => {
      setReportDraft(res.reportDraft ?? null);
      if (res.enteredTranslationMode) setTranslationOther(res.enteredTranslationMode.other);
      if (res.exitedTranslationMode) setTranslationOther(null);

      if (res.pendingConfirmation) {
        setPending(res.pendingConfirmation);
        push({
          role: "setu",
          text: res.text,
          provenance: res.provenance,
          intent: res.intent,
          urgency: res.urgency,
        });
        setStatus("waiting_for_confirmation");
        void speakOut(res.pendingConfirmation.lead || res.text);
        return;
      }

      setPending(null);
      push({
        role: "setu",
        text: res.text,
        provenance: res.provenance,
        intent: res.intent,
        urgency: res.urgency,
        toolName: res.toolResult ? res.turn.tool?.name : undefined,
        translation: res.translationRelay
          ? {
              to: res.translationRelay.to,
              detectedSource: res.translationRelay.detectedSource,
              confidence: res.translationRelay.confidence,
              fromPhrasebook: res.translationRelay.fromPhrasebook,
            }
          : undefined,
      });

      const created = res.toolResult?.createdId;
      if (created && onCreated) {
        if (res.turn.tool?.name === "create_incident") onCreated("incident", created);
        else if (res.turn.tool?.name?.includes("ground_report") || res.turn.tool?.name === "report_resource_issue")
          onCreated("groundReport", created);
      }
      // Photo is consumed once attached to a submitted report.
      if (res.toolResult?.ok && res.turn.tool?.name === "create_ground_report") photoRef.current = null;

      // A translation result is spoken in the TARGET language so the volunteer
      // can hold the phone out to the pilgrim.
      void speakOut(res.text, res.translationRelay?.to);
    },
    [push, speakOut, onCreated]
  );

  const handleUserMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setLastError(null);
      push({ role: "user", text: trimmed });
      setStatus(translationOther ? "translating" : "thinking");
      try {
        const res = await runTurn({
          message: trimmed,
          history: history(),
          volunteerLanguage,
          offline: useAppStore.getState().systemStatus.connectivity !== "nominal",
          memory: memoryRef.current,
          buildToolContext,
        });
        applyResult(res);
      } catch (err) {
        setStatus("error");
        setLastError(err instanceof Error ? err.message : "Something went wrong");
        push({
          role: "setu",
          text: "Something went wrong on my side. Try again, or use the manual screens.",
        });
      }
    },
    [push, history, volunteerLanguage, buildToolContext, applyResult, translationOther]
  );

  const startListening = useCallback(() => {
    if (status === "listening") return;
    if (!providers.speech.isRecognitionAvailable() || voiceBlocked) {
      setLastError("Voice input isn't available here — type your message below.");
      return;
    }
    setLastError(null);
    setPartial("");
    providers.speech.cancelSpeech();
    setStatus("listening");
    listenRef.current = providers.speech.listen(
      translationOther ?? volunteerLanguage,
      {
        onPartial: (t) => setPartial(t),
        onFinal: (t) => {
          setPartial("");
          listenRef.current = null;
          void handleUserMessage(t);
        },
        onError: (reason) => {
          listenRef.current = null;
          setPartial("");
          setStatus("idle");
          if (reason === "aborted") return;
          if (reason === "no-speech") {
            // Harmless — user tapped and said nothing. Soft, self-clearing hint.
            setLastError("I didn't catch anything — tap the mic and try again, or type below.");
          } else if (reason === "not-allowed" || reason === "service-not-allowed") {
            setVoiceBlocked(true);
            setLastError("Microphone is blocked — I'll use text. Re-enable it in your browser's site settings if you want voice.");
          } else if (reason === "audio-capture") {
            setVoiceBlocked(true);
            setLastError("No microphone found — using text instead.");
          } else if (reason === "network" || reason === "unavailable") {
            networkFailsRef.current += 1;
            if (networkFailsRef.current >= 2) {
              setVoiceBlocked(true);
              setLastError("Voice recognition isn't reachable here — switched to text.");
            } else {
              setLastError("Voice service didn't respond — type instead, or try the mic again.");
            }
          } else {
            setLastError("Voice had a problem — type your message below.");
          }
        },
        onEnd: () => {
          // If recognition ended with no final result, don't leave the orb stuck.
          setStatus((s) => (s === "listening" ? "idle" : s));
        },
      }
    );
  }, [providers, status, volunteerLanguage, translationOther, handleUserMessage, voiceBlocked]);

  /** Let the volunteer re-try voice after a block (e.g. they just granted the mic). */
  const retryVoice = useCallback(() => {
    networkFailsRef.current = 0;
    setVoiceBlocked(false);
    setLastError(null);
  }, []);

  const stopListening = useCallback(() => {
    listenRef.current?.stop();
    listenRef.current = null;
    if (status === "listening") setStatus("idle");
  }, [status]);

  const sendText = useCallback((text: string) => void handleUserMessage(text), [handleUserMessage]);

  /** Camera / gallery image sent into the conversation (§18). Setu runs it
   *  through the vision provider and structures a ground-report draft. */
  const sendPhoto = useCallback(
    async (dataUrl: string, note = "") => {
      setLastError(null);
      photoRef.current = dataUrl;
      push({ role: "user", text: note.trim() || "Sent a photo", imageUrl: dataUrl });
      setStatus("thinking");
      try {
        const res = await runPhotoTurn({
          dataUrl,
          note,
          history: history(),
          volunteerLanguage,
          offline: useAppStore.getState().systemStatus.connectivity !== "nominal",
          memory: memoryRef.current,
          buildToolContext,
        });
        applyResult(res);
      } catch (err) {
        setStatus("error");
        setLastError(err instanceof Error ? err.message : "Couldn't read that image");
        push({ role: "setu", text: "I couldn't process that photo. Try another, or describe what you see." });
      }
    },
    [push, history, volunteerLanguage, buildToolContext, applyResult]
  );

  const confirm = useCallback(async () => {
    if (!pending) return;
    setStatus("taking_action");
    const p = pending;
    setPending(null);
    try {
      const res = await confirmPending(p, {
        volunteerLanguage,
        memory: memoryRef.current,
        buildToolContext,
      });
      push({
        role: "setu",
        text: res.text,
        provenance: res.provenance,
        toolName: p.tool.name,
      });
      const created = res.toolResult?.createdId;
      if (created && onCreated) {
        if (p.tool.name === "create_incident") onCreated("incident", created);
        else if (p.tool.name.includes("ground_report") || p.tool.name === "report_resource_issue")
          onCreated("groundReport", created);
      }
      if (res.toolResult?.ok && p.tool.name === "create_ground_report") {
        photoRef.current = null;
        setReportDraft(null);
      }
      void speakOut(res.text);
    } catch {
      setStatus("error");
      push({ role: "setu", text: "That action failed — nothing was changed." });
    }
  }, [pending, volunteerLanguage, buildToolContext, push, speakOut, onCreated]);

  const cancel = useCallback(() => {
    setPending(null);
    setStatus("idle");
    push({ role: "setu", text: "Cancelled — nothing was sent." });
  }, [push]);

  /** In translation mode: relay something the pilgrim said back to the volunteer. */
  const relayFromPilgrim = useCallback(
    async (text: string) => {
      if (!translationOther || !text.trim()) return;
      push({ role: "pilgrim", text: text.trim() });
      setStatus("translating");
      const res = await providers.translation.translate(text.trim(), volunteerLanguage, translationOther);
      push({
        role: "setu",
        text: res.text,
        provenance: res.fromPhrasebook
          ? `Field phrasebook · confidence ${(res.confidence * 100) | 0}%`
          : `Offline translation · low confidence`,
        translation: {
          to: volunteerLanguage,
          detectedSource: res.detectedSource,
          confidence: res.confidence,
          fromPhrasebook: res.fromPhrasebook,
        },
      });
      void speakOut(res.text, volunteerLanguage);
    },
    [translationOther, providers, volunteerLanguage, push, speakOut]
  );

  const endTranslation = useCallback(() => {
    memoryRef.current.endTranslation();
    setTranslationOther(null);
    push({ role: "setu", text: "Live translation ended." });
    setStatus("idle");
  }, [push]);

  const swapTranslation = useCallback((other: LanguageCode) => {
    memoryRef.current.startTranslation(volunteerLanguage, other);
    setTranslationOther(other);
  }, [volunteerLanguage]);

  const stopSpeaking = useCallback(() => {
    providers.speech.cancelSpeech();
    setStatus("idle");
  }, [providers]);

  const attachPhoto = useCallback((dataUrl: string) => {
    photoRef.current = dataUrl;
  }, []);

  const clearPhoto = useCallback(() => {
    photoRef.current = null;
  }, []);

  const endSession = useCallback(() => {
    listenRef.current?.abort();
    providers.speech.cancelSpeech();
    memoryRef.current.clear();
    setMessages([]);
    setPending(null);
    setReportDraft(null);
    setTranslationOther(null);
    setPartial("");
    setStatus("idle");
    setLastError(null);
  }, [providers]);

  return {
    // state
    status,
    messages,
    partial,
    pending,
    reportDraft,
    translationOther,
    volunteer,
    zone,
    offline,
    volunteerLanguage,
    voiceReplies,
    voiceInputAvailable,
    voiceOutputAvailable,
    voiceBlocked,
    lastError,
    providerInfo: {
      llm: providers.llm.info,
      speech: providers.speech.info,
      translation: providers.translation.info,
      allSimulated: providers.allSimulated,
    },
    hasPhoto: () => photoRef.current !== null,
    // actions
    setVolunteerLanguage,
    setVoiceReplies,
    startListening,
    stopListening,
    retryVoice,
    sendText,
    sendPhoto,
    confirm,
    cancel,
    relayFromPilgrim,
    endTranslation,
    swapTranslation,
    stopSpeaking,
    speakAloud,
    attachPhoto,
    clearPhoto,
    endSession,
  };
}

export type UseSetuReturn = ReturnType<typeof useSetu>;
