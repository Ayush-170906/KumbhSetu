// Server-only configuration. NEVER import this from a "use client" file.
// The Sarvam key is read here and used only inside src/app/api/setu/* route
// handlers — it is never sent to the browser and never logged.

import "server-only";

export const SARVAM_API_BASE = process.env.SARVAM_API_BASE || "https://api.sarvam.ai";
export const SARVAM_API_KEY = process.env.SARVAM_API_KEY || "";

// Model IDs are configurable so the deployment can track Sarvam's catalogue
// without a code change.
//   - reasoning / agentic tool-calling  -> sarvam-105b
//   - conversational voice turns         -> sarvam-105b-conversations
export const SARVAM_CHAT_MODEL = process.env.SARVAM_CHAT_MODEL || "sarvam-105b";
export const SARVAM_CONV_MODEL = process.env.SARVAM_CONV_MODEL || "sarvam-105b-conversations";
// mayura:v1 supports source_language_code:"auto" (needed for live detection);
// sarvam-translate:v1 rejects "auto".
export const SARVAM_TRANSLATE_MODEL = process.env.SARVAM_TRANSLATE_MODEL || "mayura:v1";
// Batch REST STT (/speech-to-text). Supported: saarika:v2.5, saaras:v3/v4.
// Realtime streaming STT over WebSocket is NOT wired in this build.
export const SARVAM_STT_MODEL = process.env.SARVAM_STT_MODEL || "saarika:v2.5";
export const SARVAM_TTS_MODEL = process.env.SARVAM_TTS_MODEL || "bulbul:v3";

// Per-capability switch. Default: if a SARVAM_API_KEY is present, the real path
// is ON for every capability. Set the matching *_PROVIDER var to "mock" / "off"
// / "local" to force that one capability back to the local provider.
type Cap = "chat" | "translation" | "stt" | "tts";
const CAP_VAR: Record<Cap, string> = {
  chat: "AI_PROVIDER",
  translation: "TRANSLATION_PROVIDER",
  stt: "SPEECH_PROVIDER",
  tts: "TTS_PROVIDER",
};
const OFF = new Set(["mock", "off", "local", "none", "disabled", "false", "0"]);

export function sarvamEnabled(cap: Cap): boolean {
  if (!SARVAM_API_KEY) return false;
  const v = (process.env[CAP_VAR[cap]] || "").toLowerCase().trim();
  return !OFF.has(v);
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

/** Map an upstream Sarvam HTTP status to a stable, client-safe reason string.
 * Never includes any response body (could echo the request / account info). */
export function sarvamErrorReason(status: number): { reason: string; status: number } {
  if (status === 429) return { reason: "rate_limited", status: 429 };
  if (status === 402 || status === 403) return { reason: "quota_exhausted", status: 402 };
  if (status === 401) return { reason: "auth", status: 502 };
  if (status >= 500) return { reason: "sarvam_unavailable", status: 502 };
  return { reason: `sarvam_${status}`, status: 502 };
}
