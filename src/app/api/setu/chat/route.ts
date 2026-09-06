import { NextResponse } from "next/server";
import {
  sarvamEnabled,
  sarvamFetch,
  sarvamErrorReason,
  SARVAM_CHAT_MODEL,
  SARVAM_CONV_MODEL,
} from "@/lib/serverEnv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface OpenAITool {
  type: "function";
  function: { name: string; description: string; parameters: unknown };
}

/**
 * Server-side Setu reasoning turn with GENUINE Sarvam function calling.
 *
 * The client sends a compact, already-grounded payload plus the OpenAI-format
 * schemas of the tools this persona is allowed to use. Sarvam (sarvam-105b for
 * reasoning, sarvam-105b-conversations for voice) either replies in natural
 * language or emits a real `tool_calls` proposal. We assemble a SetuTurn from
 * that; the client re-validates it and the orchestrator still applies registry
 * validation + per-persona authz + the risk/confirmation gate before anything
 * runs. This route is allowed to fail — the client falls back to the local
 * rule engine on any non-2xx.
 */
export async function POST(req: Request) {
  if (!sarvamEnabled("chat")) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }

  let body: {
    message?: string;
    persona?: string;
    language?: string;
    conversational?: boolean;
    knowledge?: { title: string; body: string }[];
    operational?: string;
    tools?: OpenAITool[];
    offline?: boolean;
    history?: { role: string; text: string }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  const lang = body.language || "en";
  const model = body.conversational ? SARVAM_CONV_MODEL : SARVAM_CHAT_MODEL;

  const sys = [
    "You are Setu, an operational field companion for people working during the Kumbh Mela mass gathering.",
    `Reply in the user's language (code "${lang}"), concise and actionable — one or two sentences.`,
    "Never invent operational facts (crowd numbers, medical status, infrastructure state, locations, government info).",
    "Never claim an incident is verified or a responder dispatched unless a tool result says so.",
    "If an operational action or lookup is needed, CALL THE APPROPRIATE TOOL rather than guessing.",
    "For 'brief me' / 'why is a zone at risk', call get_operational_overview or get_zone_status and explain only what it returns.",
    "High-risk tools (create_incident, escalate_incident, assign_volunteer, publish_advisory, promote_signal_to_incident) will be confirmed by a human — still call them when they are the right next step.",
    body.offline
      ? "The device is OFFLINE. Do not promise anything that needs the network; keep to cached guidance and, at most, a field-report draft."
      : "",
    body.operational ? `Live operational state (synthetic demo data):\n${body.operational}` : "",
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

  const payload: Record<string, unknown> = {
    model,
    messages,
    temperature: 0.2,
    max_tokens: 700,
  };
  if (body.tools?.length) {
    payload.tools = body.tools;
    payload.tool_choice = "auto";
  }

  let res: Response;
  try {
    res = await sarvamFetch("/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    const reason = e instanceof Error && e.name === "AbortError" ? "timeout" : "network";
    return NextResponse.json({ ok: false, reason }, { status: 504 });
  }

  if (!res.ok) {
    const { reason, status } = sarvamErrorReason(res.status);
    return NextResponse.json({ ok: false, reason }, { status });
  }

  let data: {
    choices?: { message?: { content?: string; tool_calls?: { function?: { name?: string; arguments?: string } }[] } }[];
  };
  try {
    data = await res.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "unparseable" }, { status: 502 });
  }

  const msg = data?.choices?.[0]?.message;
  let content = (msg?.content || "").trim();
  const call = msg?.tool_calls?.[0]?.function;

  let tool: { name: string; arguments: Record<string, unknown> } | undefined;

  const parseArgs = (raw: unknown): Record<string, unknown> => {
    if (raw && typeof raw === "object") return raw as Record<string, unknown>;
    if (typeof raw === "string" && raw.trim()) {
      try {
        const v = JSON.parse(raw);
        return v && typeof v === "object" ? v : {};
      } catch {
        return {};
      }
    }
    return {};
  };

  if (call?.name) {
    // Native OpenAI-style tool call (the normal path for sarvam-105b with schemas).
    tool = { name: call.name, arguments: parseArgs(call.arguments) };
  } else {
    // Defensive fallback: some models emit <tool_call>…</tool_call> in the text.
    const m = content.match(/<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/i);
    if (m) {
      const inner = m[1].trim();
      content = content.replace(m[0], "").trim();
      let name = "";
      let args: Record<string, unknown> = {};
      try {
        const obj = JSON.parse(inner);
        name = String(obj.name || obj.tool || "");
        args = parseArgs(obj.arguments ?? obj.args);
      } catch {
        const nl = inner.indexOf("\n");
        name = (nl === -1 ? inner : inner.slice(0, nl)).trim();
        args = parseArgs(nl === -1 ? "" : inner.slice(nl + 1));
      }
      if (name) tool = { name, arguments: args };
    }
  }

  if (!content && !tool) {
    return NextResponse.json({ ok: false, reason: "empty" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, model, content, tool: tool ?? null });
}
