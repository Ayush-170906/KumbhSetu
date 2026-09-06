// Provider registry — the one place real providers get swapped in.
//
// Default (no env): every capability is the local/simulated implementation, so
// the whole experience runs offline with zero credentials.
//
// Opt in to the real path by setting BOTH:
//   - NEXT_PUBLIC_SETU_LIVE=1        (public, non-secret — just flips the wiring)
//   - SARVAM_API_KEY=...             (server only — held by /api/setu/* routes)
//   - AI_PROVIDER / SPEECH_PROVIDER / TRANSLATION_PROVIDER / TTS_PROVIDER = sarvam
//
// Even when live, every Sarvam adapter falls back to its Mock* sibling on any
// error, so the companion never hard-breaks. See docs/AI_FIELD_COMPANION.md.

import type {
  AIProvider,
  SpeechProvider,
  TranslationProvider,
  VisionProvider,
} from "./types";
import { MockLLMProvider } from "./mockLLMProvider";
import { MockSpeechProvider } from "./mockSpeechProvider";
import { MockTranslationProvider } from "./mockTranslationProvider";
import { MockVisionProvider } from "./mockVisionProvider";
import {
  SarvamLLMProvider,
  SarvamSpeechProvider,
  SarvamTranslationProvider,
} from "./sarvamProvider";

export interface ProviderBundle {
  llm: AIProvider;
  speech: SpeechProvider;
  translation: TranslationProvider;
  vision: VisionProvider;
  /** True when every provider is a local/simulated implementation. */
  allSimulated: boolean;
  /** "live" when the Sarvam adapters are wired in, "simulation" otherwise. */
  mode: "live" | "simulation";
}

// Client wiring: use the Sarvam adapters unless explicitly disabled. Each
// adapter probes /api/setu/* per call and falls straight back to its Mock*
// sibling when the server has no key (503) or a call fails — so wiring them in
// by default is safe even with no credentials. Set NEXT_PUBLIC_SETU_LIVE=0 to
// force pure-simulation wiring.
const LIVE =
  typeof process === "undefined" || process.env.NEXT_PUBLIC_SETU_LIVE !== "0";

let bundle: ProviderBundle | null = null;

export function getProviders(): ProviderBundle {
  if (bundle) return bundle;

  const llm: AIProvider = LIVE ? new SarvamLLMProvider() : new MockLLMProvider();
  const speech: SpeechProvider = LIVE ? new SarvamSpeechProvider() : new MockSpeechProvider();
  const translation: TranslationProvider = LIVE
    ? new SarvamTranslationProvider()
    : new MockTranslationProvider();
  const vision: VisionProvider = new MockVisionProvider();

  bundle = {
    llm,
    speech,
    translation,
    vision,
    allSimulated:
      llm.info.simulated && translation.info.simulated && vision.info.simulated,
    mode: LIVE ? "live" : "simulation",
  };
  return bundle;
}

export interface SetuCapabilityStatus {
  keyPresent: boolean;
  chat: boolean;
  translation: boolean;
  stt: boolean;
  tts: boolean;
}

let statusCache: { at: number; value: SetuCapabilityStatus } | null = null;

/** Asks the server which capabilities have a live Sarvam path. Cached 30s.
 * Returns an all-false result if the check fails. */
export async function probeSetuStatus(): Promise<SetuCapabilityStatus> {
  const OFF: SetuCapabilityStatus = {
    keyPresent: false,
    chat: false,
    translation: false,
    stt: false,
    tts: false,
  };
  if (typeof window === "undefined") return OFF;
  if (statusCache && Date.now() - statusCache.at < 30_000) return statusCache.value;
  try {
    const res = await fetch("/api/setu/status", { cache: "no-store" });
    if (!res.ok) return OFF;
    const value = (await res.json()) as SetuCapabilityStatus;
    statusCache = { at: Date.now(), value };
    return value;
  } catch {
    return OFF;
  }
}

/** For tests: force a fresh bundle (e.g. after swapping an env var). */
export function resetProviders() {
  bundle = null;
  statusCache = null;
}

export type {
  AIProvider,
  SpeechProvider,
  TranslationProvider,
  VisionProvider,
} from "./types";
