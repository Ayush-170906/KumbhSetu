// Provider registry — the one place real providers get swapped in (§57/§58).
//
// Everything else imports `getProviders()`, never a concrete provider. To use a
// hosted model / speech / translation service later:
//   1. add an implementation of the interface (e.g. anthropicProvider.ts)
//   2. read a key from process.env (server) or a config endpoint (never inline)
//   3. return it here instead of the Mock* one, keeping the interface identical
// See docs/AI_FIELD_COMPANION.md for the full checklist.

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

export interface ProviderBundle {
  llm: AIProvider;
  speech: SpeechProvider;
  translation: TranslationProvider;
  vision: VisionProvider;
  /** True when every provider is a local/simulated implementation. */
  allSimulated: boolean;
}

let bundle: ProviderBundle | null = null;

export function getProviders(): ProviderBundle {
  if (bundle) return bundle;

  const llm: AIProvider = new MockLLMProvider();
  const speech: SpeechProvider = new MockSpeechProvider();
  const translation: TranslationProvider = new MockTranslationProvider();
  const vision: VisionProvider = new MockVisionProvider();

  bundle = {
    llm,
    speech,
    translation,
    vision,
    allSimulated:
      llm.info.simulated && translation.info.simulated && vision.info.simulated,
  };
  return bundle;
}

/** For tests: force a fresh bundle (e.g. after swapping an env var). */
export function resetProviders() {
  bundle = null;
}

export type {
  AIProvider,
  SpeechProvider,
  TranslationProvider,
  VisionProvider,
} from "./types";
