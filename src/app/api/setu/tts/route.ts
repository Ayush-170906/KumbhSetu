import { NextResponse } from "next/server";
import { sarvamEnabled, sarvamFetch, SARVAM_TTS_MODEL } from "@/lib/serverEnv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LANG_TAG: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
  ta: "ta-IN",
};

export async function POST(req: Request) {
  if (!sarvamEnabled("tts")) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }

  let body: { text?: string; lang?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }
  const text = (body.text || "").trim().slice(0, 1500);
  if (!text) return NextResponse.json({ ok: false, reason: "empty" }, { status: 400 });

  try {
    const res = await sarvamFetch("/text-to-speech", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text,
        target_language_code: LANG_TAG[body.lang || "en"] ?? "en-IN",
        model: SARVAM_TTS_MODEL,
      }),
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, reason: `sarvam_${res.status}` }, { status: 502 });
    }
    const data = await res.json();
    const audios: string[] = data?.audios || [];
    if (!audios.length) return NextResponse.json({ ok: false, reason: "empty_audio" }, { status: 502 });
    return NextResponse.json({ ok: true, audioBase64: audios[0], mime: "audio/wav" });
  } catch (e) {
    const reason = e instanceof Error && e.name === "AbortError" ? "timeout" : "network";
    return NextResponse.json({ ok: false, reason }, { status: 504 });
  }
}
