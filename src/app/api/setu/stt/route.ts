import { NextResponse } from "next/server";
import { sarvamEnabled, sarvamFetch, SARVAM_STT_MODEL } from "@/lib/serverEnv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAG_TO_LANG: Record<string, string> = {
  "en-IN": "en",
  "hi-IN": "hi",
  "mr-IN": "mr",
  "ta-IN": "ta",
};

/**
 * Batch speech-to-text. The client records a short clip (MediaRecorder) and
 * posts it as multipart/form-data when the browser has no live Web Speech API.
 * Live streaming STT over WebSocket is the production path; this covers the
 * no-Web-Speech fallback without one.
 */
export async function POST(req: Request) {
  if (!sarvamEnabled("stt")) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }

  let audio: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("audio");
    if (f instanceof File) audio = f;
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }
  if (!audio) return NextResponse.json({ ok: false, reason: "no_audio" }, { status: 400 });

  try {
    const upstream = new FormData();
    upstream.append("file", audio, audio.name || "clip.webm");
    upstream.append("model", SARVAM_STT_MODEL);

    const res = await sarvamFetch("/speech-to-text", { method: "POST", body: upstream }, 20_000);
    if (!res.ok) {
      return NextResponse.json({ ok: false, reason: `sarvam_${res.status}` }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json({
      ok: true,
      transcript: data?.transcript ?? "",
      language: TAG_TO_LANG[data?.language_code] ?? undefined,
    });
  } catch (e) {
    const reason = e instanceof Error && e.name === "AbortError" ? "timeout" : "network";
    return NextResponse.json({ ok: false, reason }, { status: 504 });
  }
}
