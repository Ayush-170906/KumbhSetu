// Provider interfaces for the Setu AI Field Companion.
//
// Nothing in this app talks to an external AI service directly. Every model,
// speech and translation capability is reached through one of these interfaces,
// and a working mock implementation of each ships in this folder so the whole
// experience is demonstrable offline (§57/§58). A real deployment swaps the
// mock for an HTTP-backed implementation with the SAME shape — see
// src/ai/providers/index.ts and docs/AI_FIELD_COMPANION.md.

import type { LanguageCode } from "@/lib/types";
import type { SetuTurn, SetuTurnRequest } from "@/ai/schemas";

export interface ProviderInfo {
  /** Human-readable name shown in the UI's provenance line. */
  name: string;
  /** True when this is a local/simulated implementation, not a hosted model. */
  simulated: boolean;
}

// ---------------------------------------------------------------------------
// LLM / reasoning provider
// ---------------------------------------------------------------------------

export interface AIProvider {
  readonly info: ProviderInfo;
  /**
   * Runs one turn of the companion: given the conversation so far plus grounded
   * context (live store snapshot, retrieved knowledge), returns a *structured*
   * result — never free-form text the caller has to parse (§44). The provider
   * proposes a tool call; it never executes one.
   */
  planTurn(request: SetuTurnRequest): Promise<SetuTurn>;
}

// ---------------------------------------------------------------------------
// Speech provider (STT + TTS)
// ---------------------------------------------------------------------------

export interface SpeechRecognitionHandle {
  stop: () => void;
  abort: () => void;
}

export interface SpeechListenCallbacks {
  onPartial?: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (reason: string) => void;
  onEnd?: () => void;
}

export interface SpeechProvider {
  readonly info: ProviderInfo;
  /** True if real device speech recognition is available right now. */
  isRecognitionAvailable: () => boolean;
  /** True if speech synthesis is available right now. */
  isSpeechAvailable: () => boolean;
  /** Begin listening. Returns a handle to stop/abort. */
  listen: (language: LanguageCode, cb: SpeechListenCallbacks) => SpeechRecognitionHandle;
  /** Speak a string aloud. Resolves when finished (or immediately if muted). */
  speak: (text: string, language: LanguageCode) => Promise<void>;
  /** Stop any in-progress speech immediately. */
  cancelSpeech: () => void;
}

// ---------------------------------------------------------------------------
// Translation provider
// ---------------------------------------------------------------------------

export interface TranslationResult {
  text: string;
  detectedSource: LanguageCode;
  /** 0-1 — how confident the provider is in the translation. */
  confidence: number;
  /** True when the result came from a fixed phrasebook rather than free translation. */
  fromPhrasebook: boolean;
}

export interface TranslationProvider {
  readonly info: ProviderInfo;
  getSupportedLanguages: () => LanguageCode[];
  detectLanguage: (text: string) => Promise<LanguageCode>;
  translate: (
    text: string,
    to: LanguageCode,
    from?: LanguageCode
  ) => Promise<TranslationResult>;
}

// ---------------------------------------------------------------------------
// Vision provider (photo → structured observation)
// ---------------------------------------------------------------------------

export interface VisionObservation {
  label: string;
  categoryHint: string;
  potentialImpact: string;
  confidence: number; // 0-1
}

export interface VisionProvider {
  readonly info: ProviderInfo;
  describe: (dataUrl: string, hint?: string) => Promise<VisionObservation>;
}
