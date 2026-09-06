import { NextResponse } from "next/server";
import { sarvamEnabled, sarvamFetch, sarvamErrorReason, SARVAM_TRANSLATE_MODEL } from "@/lib/serverEnv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LANG_TAG: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
  ta: "ta-IN",
};

export async function POST(req: Request) {
  if (!sarvamEnabled("translation")) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }

  let body: { text?: string; to?: string; from?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }
  const text = (body.text || "").trim();
  if (!text) return NextResponse.json({ ok: false, reason: "empty" }, { status: 400 });

  try {
    const res = await sarvamFetch("/translate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        input: text,
        source_language_code: body.from ? LANG_TAG[body.from] ?? "auto" : "auto",
        target_language_code: LANG_TAG[body.to || "en"] ?? "en-IN",
        model: SARVAM_TRANSLATE_MODEL,
        mode: "formal",
      }),
    });
    if (!res.ok) {
      const err = sarvamErrorReason(res.status);
      return NextResponse.json({ ok: false, reason: err.reason }, { status: err.status });
    }
    const data = await res.json();
    const tag: string = data?.source_language_code || "";
    const detected = Object.entries(LANG_TAG).find(([, v]) => v === tag)?.[0] || body.from || "en";
    return NextResponse.json({
      ok: true,
      text: data?.translated_text ?? "",
      detectedSource: detected,
    });
  } catch (e) {
    const reason = e instanceof Error && e.name === "AbortError" ? "timeout" : "network";
    return NextResponse.json({ ok: false, reason }, { status: 504 });
  }
}
