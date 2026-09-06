import { NextResponse } from "next/server";
import { sarvamEnabled, sarvamFetch, SARVAM_CHAT_MODEL } from "@/lib/serverEnv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-side Setu reasoning turn. The client sends an already-compact,
 * already-grounded payload (message + persona + retrieved knowledge + a short
 * operational summary + allowed tool names). We ask Sarvam for a single
 * structured JSON object matching the SetuTurn contract. The client validates
 * it again with validateTurn() and falls back to the local rule engine on any
 * problem — so this route is allowed to fail loudly.
 */
export async function POST(req: Request) {
  if (!sarvamEnabled("chat")) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }

  let body: {
    message?: string;
    persona?: string;
    language?: string;
    knowledge?: { title: string; body: string }[];
    operational?: string;
    allowedTools?: string[];
    offline?: boolean;
    history?: { role: string; text: string }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  const sys = [
    "You are Setu, an operational field companion for people working during a mass gathering (Kumbh Mela).",
    "Return ONE JSON object and nothing else, matching this TypeScript type:",
    '{ "intent": string, "urgency": "routine"|"elevated"|"emergency", "reply": { "<lang>": string },',
    ' "followUp"?: string, "tool"?: { "name": string, "arguments": object }, "requiresConfirmation": boolean,',
    ' "confirmationPrompt"?: string, "provenance"?: string }',
    `The user's language code is "${body.language || "en"}"; always include reply["${body.language || "en"}"].`,
    "Never invent operational facts. Never claim an incident is verified or a responder dispatched unless a tool result says so.",
    "Only propose a tool from the allowed list. High-risk actions (advisories, escalation, dispatch) MUST set requiresConfirmation:true with a one-line confirmationPrompt.",
    body.offline ? "The device is OFFLINE — do not promise anything that needs the network; keep to cached guidance." : "",
    body.allowedTools?.length ? `Allowed tools: ${body.allowedTools.join(", ")}.` : "No tools available this turn.",
    body.operational ? `Live operational state:\n${body.operational}` : "",
    body.knowledge?.length
      ? `Verified knowledge you may quote:\n${body.knowledge.map((k) => `- ${k.title}: ${k.body}`).join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const messages = [
    { role: "system", content: sys },
    ...(body.history || []).slice(-6).map((h) => ({
      role: h.role === "setu" ? "assistant" : "user",
      content: h.text,
    })),
    { role: "user", content: body.message || "" },
  ];

  try {
    const res = await sarvamFetch("/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: SARVAM_CHAT_MODEL,
        messages,
        temperature: 0.2,
        max_tokens: 700,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, reason: `sarvam_${res.status}` }, { status: 502 });
    }
    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    let turn: unknown;
    try {
      turn = JSON.parse(content);
    } catch {
      return NextResponse.json({ ok: false, reason: "unparseable" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, turn, model: SARVAM_CHAT_MODEL });
  } catch (e) {
    const reason = e instanceof Error && e.name === "AbortError" ? "timeout" : "network";
    return NextResponse.json({ ok: false, reason }, { status: 504 });
  }
}
