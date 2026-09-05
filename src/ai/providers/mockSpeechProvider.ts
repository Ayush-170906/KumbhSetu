// Speech provider (§6/§26).
//
// Uses the browser's built-in Web Speech API when the device offers it
// (Chrome/Edge/Android). When it doesn't, `listen()` still returns a valid
// handle but reports `unavailable` immediately so the UI falls back to the
// text field — voice never hard-blocks the companion. `speak()` uses
// SpeechSynthesis when present and is a no-op otherwise.

import type { LanguageCode } from "@/lib/types";
import type {
  SpeechProvider,
  SpeechListenCallbacks,
  SpeechRecognitionHandle,
  ProviderInfo,
} from "./types";

const BCP47: Record<LanguageCode, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
  ta: "ta-IN",
};

/* Minimal typings for the vendor-prefixed Web Speech API. */
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export class MockSpeechProvider implements SpeechProvider {
  readonly info: ProviderInfo;
  private muted = false;

  constructor() {
    const hasRecognition = getRecognitionCtor() !== null;
    this.info = {
      name: hasRecognition ? "Browser speech (Web Speech API)" : "Text-only (no device speech)",
      simulated: !hasRecognition,
    };
  }

  isRecognitionAvailable(): boolean {
    return getRecognitionCtor() !== null;
  }

  isSpeechAvailable(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) this.cancelSpeech();
  }

  listen(language: LanguageCode, cb: SpeechListenCallbacks): SpeechRecognitionHandle {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      // Defer so the caller can wire up state first, then tell it to fall back.
      setTimeout(() => cb.onError("unavailable"), 0);
      return { stop: () => {}, abort: () => {} };
    }

    const rec = new Ctor();
    rec.lang = BCP47[language];
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    let finalText = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (interim) cb.onPartial?.(finalText + interim);
    };
    rec.onerror = (e) => cb.onError(e.error || "speech_error");
    rec.onend = () => {
      if (finalText.trim()) cb.onFinal(finalText.trim());
      cb.onEnd?.();
    };

    try {
      rec.start();
    } catch {
      setTimeout(() => cb.onError("start_failed"), 0);
    }

    return {
      stop: () => {
        try {
          rec.stop();
        } catch {
          /* already stopped */
        }
      },
      abort: () => {
        try {
          rec.abort();
        } catch {
          /* already aborted */
        }
      },
    };
  }

  speak(text: string, language: LanguageCode): Promise<void> {
    if (this.muted || !this.isSpeechAvailable() || !text.trim()) return Promise.resolve();
    return new Promise((resolve) => {
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = BCP47[language];
        u.rate = 1.02;
        u.onend = () => resolve();
        u.onerror = () => resolve();
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
        // Safety timeout so a stuck utterance never wedges the UI state.
        setTimeout(resolve, Math.min(12000, 1500 + text.length * 55));
      } catch {
        resolve();
      }
    });
  }

  cancelSpeech(): void {
    if (this.isSpeechAvailable()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* noop */
      }
    }
  }
}
