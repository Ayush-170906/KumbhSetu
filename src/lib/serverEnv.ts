// Server-only configuration. NEVER import this from a "use client" file.
// The Sarvam key is read here and used only inside src/app/api/setu/* route
// handlers — it is never sent to the browser and never logged.

import "server-only";

export const SARVAM_API_BASE = process.env.SARVAM_API_BASE || "https://api.sarvam.ai";
export const SARVAM_API_KEY = process.env.SARVAM_API_KEY || "";

// Model IDs are configurable so the deployment can track Sarvam's catalogue
// without a code change. Defaults are current, widely-available models.
export const SARVAM_CHAT_MODEL = process.env.SARVAM_CHAT_MODEL || "sarvam-m";
export const SARVAM_TRANSLATE_MODEL = process.env.SARVAM_TRANSLATE_MODEL || "sarvam-translate:v1";
export const SARVAM_STT_MODEL = process.env.SARVAM_STT_MODEL || "saarika:v2.5";
export const SARVAM_TTS_MODEL = process.env.SARVAM_TTS_MODEL || "bulbul:v2";

// Per-capability opt-in. "sarvam" enables the real path; anything else keeps
// the local/mock provider for that capability.
type Cap = "chat" | "translation" | "stt" | "tts";
const flag = (name: string) => (process.env[name] || "").toLowerCase() === "sarvam";

export function sarvamEnabled(cap: Cap): boolean {
  if (!SARVAM_API_KEY) return false;
  switch (cap) {
    case "chat":
      return flag("AI_PROVIDER");
    case "translation":
      return flag("TRANSLATION_PROVIDER");
    case "stt":
      return flag("SPEECH_PROVIDER");
    case "tts":
      return flag("TTS_PROVIDER");
  }
}

/** Shape returned by GET /api/setu/status — booleans only, no secrets. */
export function setuStatus() {
  return {
    keyPresent: SARVAM_API_KEY.length > 0,
    chat: sarvamEnabled("chat"),
    translation: sarvamEnabled("translation"),
    stt: sarvamEnabled("stt"),
    tts: sarvamEnabled("tts"),
  };
}

/** fetch() with a hard timeout so a slow Sarvam call can't wedge a request. */
export async function sarvamFetch(
  path: string,
  init: RequestInit,
  timeoutMs = 15_000
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(`${SARVAM_API_BASE}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: {
        "api-subscription-key": SARVAM_API_KEY,
        ...(init.headers || {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}
