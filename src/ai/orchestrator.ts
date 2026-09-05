// AI orchestration layer (§43).
//
// One place that runs a companion turn end to end:
//   observe memory → retrieve knowledge → summarise live state → plan (provider)
//   → validate structured output → apply memory effects → tool policy
//   (read now / high-risk deferred to a confirm) → execute → compose reply.
//
// React components call `runTurn` / `confirmPending`; they never touch the
// provider, the tool registry or the store directly.

import type { LanguageCode, GroundReportCategory } from "@/lib/types";
import {
  validateTurn,
  safeFallbackTurn,
  type SetuTurn,
  type ConversationTurn,
  type SetuStatus,
  type Urgency,
  type GroundReportDraft,
  type ToolInvocation,
  type RetrievedContext,
} from "@/ai/schemas";
import { classifyIntent, type SetuIntent } from "@/ai/intents";
import { retrieve } from "@/ai/knowledge/kb";
import { SetuMemory } from "@/ai/memory";
import { getProviders } from "@/ai/providers";
import {
  executeTool,
  needsConfirmation,
  riskClassOf,
  type ToolContext,
  type ToolResult,
  type RiskClass,
} from "@/ai/tools";

export interface TurnInput {
  message: string;
  history: ConversationTurn[];
  volunteerLanguage: LanguageCode;
  offline: boolean;
  memory: SetuMemory;
  /** Returns a fresh tool context (live store snapshot) each time it's called. */
  buildToolContext: () => ToolContext;
}

export interface TranslationRelay {
  sourceText: string;
  translatedText: string;
  to: LanguageCode;
  detectedSource: LanguageCode;
  confidence: number;
  fromPhrasebook: boolean;
}

export interface PendingConfirmation {
  tool: ToolInvocation;
  prompt: string;
  riskClass: RiskClass;
  /** The already-spoken lead-in, so the UI can show it above the confirm card. */
  lead: string;
}

export interface TurnResult {
  turn: SetuTurn;
  intent: SetuIntent;
  urgency: Urgency;
  endStatus: SetuStatus;
  /** Final text in the volunteer's language (falls back to English). */
  text: string;
  /** English text, always present — used for the audit trail / eval. */
  textEn: string;
  provenance?: string;
  toolResult?: ToolResult;
  pendingConfirmation?: PendingConfirmation;
  reportDraft?: GroundReportDraft;
  translationRelay?: TranslationRelay;
  enteredTranslationMode?: { other: LanguageCode };
  exitedTranslationMode?: boolean;
}

function pickLang(reply: Partial<Record<LanguageCode, string>>, lang: LanguageCode): string {
  return reply[lang] ?? reply.en ?? Object.values(reply)[0] ?? "";
}

function combine(lead: string, detail: string): string {
  const l = lead.trim();
  const d = detail.trim();
  if (!d) return l;
  if (!l) return d;
  // If the lead is a short frame ("On it.", "Here's what I have:"), keep it inline.
  return l.length <= 40 ? `${l}  ${d}` : `${l}\n\n${d}`;
}

/** A compact, already-formatted snapshot of live operational state (§21). */
function operationalSummary(ctx: ToolContext): string {
  const zone = ctx.store.zones.find((z) => z.id === ctx.zoneId);
  if (!zone) return "No zone context.";
  const snap = ctx.store.riskSnapshots[ctx.zoneId];
  const open = ctx.store.incidents.filter(
    (i) => i.zoneId === ctx.zoneId && !["resolved", "cancelled", "escalated"].includes(i.status)
  ).length;
  const reports = ctx.store.groundReports.filter(
    (r) => r.zoneId === ctx.zoneId && !["resolved", "dismissed"].includes(r.status)
  ).length;
  const vols = ctx.store.volunteers.filter((v) => v.zoneId === ctx.zoneId && v.availability === "available").length;
  const med = ctx.store.facilities.find((f) => f.type === "medical" && f.zoneId === ctx.zoneId)
    ?? ctx.store.facilities.find((f) => f.type === "medical");
  const signals = ctx.store.emergingSignals.filter((s) => s.zoneId === ctx.zoneId);
  return [
    `Zone ${zone.shortName} (${zone.name}): crowd ${zone.density} ${zone.densityPercent}%, risk ${snap?.band ?? "n/a"} ${zone.riskScore}/100, trend ${zone.trend}.`,
    `${open} open incident(s), ${reports} field report(s), ${vols} volunteer(s) available here.`,
    med ? `Nearest medical: ${med.name} (${med.status}).` : "",
    signals.length ? `Emerging signal(s): ${signals.map((s) => s.headline).join("; ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function buildContext(message: string, intent: SetuIntent, ctx: ToolContext): RetrievedContext {
  return {
    knowledge: retrieve(message, intent, 3).map((h) => ({
      id: h.id,
      title: h.title,
      body: h.body,
      source: h.source,
    })),
    operational: operationalSummary(ctx),
  };
}

function applyMemoryEffects(turn: SetuTurn, input: TurnInput) {
  const m = input.memory;
  if (turn.enterTranslationMode) {
    m.startTranslation(input.volunteerLanguage, turn.enterTranslationMode.other);
  }
  if (turn.exitTranslationMode) m.endTranslation();

  if (turn.reportDraft) {
    m.setPendingReport(turn.reportDraft.category as GroundReportCategory);
  } else if (turn.intent !== "ground_report") {
    m.setPendingReport(undefined);
  }
}

function relayFromResult(result: ToolResult, args: Record<string, unknown>): TranslationRelay | undefined {
  const d = result.data as
    | { text: string; detectedSource: LanguageCode; confidence: number; fromPhrasebook: boolean }
    | undefined;
  if (!d || typeof d.text !== "string") return undefined;
  return {
    sourceText: String(args.text ?? ""),
    translatedText: d.text,
    to: (args.to as LanguageCode) ?? "en",
    detectedSource: d.detectedSource,
    confidence: d.confidence,
    fromPhrasebook: d.fromPhrasebook,
  };
}

async function composeToolTurn(
  turn: SetuTurn,
  input: TurnInput,
  ctx: ToolContext,
  confirmed: boolean
): Promise<TurnResult> {
  const tool = turn.tool!;
  const lead = pickLang(turn.reply, input.volunteerLanguage);
  const leadEn = turn.reply.en ?? lead;
  const intent = turn.intent;

  const result = await executeTool(tool.name, tool.arguments, ctx, { confirmed });

  if (result.error === "confirmation_required") {
    // Shouldn't reach here (we gate earlier), but stay safe.
    return {
      turn,
      intent,
      urgency: turn.urgency,
      endStatus: "waiting_for_confirmation",
      text: combine(lead, turn.confirmationPrompt ?? result.summary),
      textEn: combine(leadEn, turn.confirmationPrompt ?? result.summary),
      pendingConfirmation: {
        tool,
        prompt: turn.confirmationPrompt ?? result.summary,
        riskClass: riskClassOf(tool.name) ?? "high_write",
        lead,
      },
      provenance: turn.provenance,
      reportDraft: turn.reportDraft,
    };
  }

  const relay = tool.name === "translate_text" ? relayFromResult(result, tool.arguments) : undefined;
  if (tool.name === "end_translation_session") input.memory.endTranslation();
  if (result.ok && tool.name === "create_ground_report") input.memory.setPendingReport(undefined);

  const detail = relay ? relay.translatedText : result.summary;
  const provenance =
    turn.provenance ??
    (relay
      ? `Offline field phrasebook · confidence ${(relay.confidence * 100) | 0}%`
      : result.ok
      ? undefined
      : undefined);

  return {
    turn,
    intent,
    urgency: turn.urgency,
    endStatus: result.ok ? "speaking" : "error",
    text: combine(lead, detail),
    textEn: combine(leadEn, relay ? relay.translatedText : result.summary),
    provenance,
    toolResult: result,
    reportDraft: turn.reportDraft,
    translationRelay: relay,
    enteredTranslationMode: turn.enterTranslationMode,
    exitedTranslationMode: turn.exitTranslationMode,
  };
}

/** Run one full companion turn. */
export async function runTurn(input: TurnInput): Promise<TurnResult> {
  const { llm } = getProviders();
  input.memory.observe(input.message);

  const preIntent = classifyIntent(input.message).intent;
  const ctx = input.buildToolContext();
  const context = buildContext(input.message, preIntent, ctx);

  let turn: SetuTurn;
  try {
    const raw = await llm.planTurn({
      message: input.message,
      history: input.history,
      volunteerLanguage: input.volunteerLanguage,
      context,
      memory: input.memory.snapshot(),
      offline: input.offline,
    });
    turn = validateTurn(raw) ?? safeFallbackTurn(input.volunteerLanguage);
  } catch {
    turn = safeFallbackTurn(input.volunteerLanguage);
  }

  applyMemoryEffects(turn, input);

  const lead = pickLang(turn.reply, input.volunteerLanguage);
  const leadEn = turn.reply.en ?? lead;

  // Offline + a write tool that reaches the control room now: only ground
  // reports are allowed (they queue); everything else is deferred.
  if (
    input.offline &&
    turn.tool &&
    riskClassOf(turn.tool.name) !== "read" &&
    turn.tool.name !== "create_ground_report" &&
    turn.tool.name !== "start_translation_session" &&
    turn.tool.name !== "end_translation_session"
  ) {
    return {
      turn,
      intent: turn.intent,
      urgency: turn.urgency,
      endStatus: "offline",
      text: combine(lead, "You're offline — I can't reach the control room. I'll hold this and you can send it when you're back online."),
      textEn: combine(leadEn, "Offline — action held until connectivity returns."),
      provenance: turn.provenance,
      reportDraft: turn.reportDraft,
    };
  }

  if (!turn.tool) {
    return {
      turn,
      intent: turn.intent,
      urgency: turn.urgency,
      endStatus: turn.followUp ? "speaking" : "speaking",
      text: turn.followUp ? combine(lead, turn.followUp) : lead,
      textEn: turn.followUp ? combine(leadEn, turn.followUp) : leadEn,
      provenance: turn.provenance,
      reportDraft: turn.reportDraft,
      enteredTranslationMode: turn.enterTranslationMode,
      exitedTranslationMode: turn.exitTranslationMode,
    };
  }

  const mustConfirm = turn.requiresConfirmation || needsConfirmation(turn.tool.name);
  if (mustConfirm) {
    const prompt = turn.confirmationPrompt ?? "Confirm this action?";
    return {
      turn,
      intent: turn.intent,
      urgency: turn.urgency,
      endStatus: "waiting_for_confirmation",
      text: combine(lead, prompt),
      textEn: combine(leadEn, prompt),
      provenance: turn.provenance,
      reportDraft: turn.reportDraft,
      pendingConfirmation: {
        tool: turn.tool,
        prompt,
        riskClass: riskClassOf(turn.tool.name) ?? "low_write",
        lead,
      },
      enteredTranslationMode: turn.enterTranslationMode,
    };
  }

  return composeToolTurn(turn, input, ctx, false);
}

/** Execute a tool that was deferred to a confirm card, after the user approves. */
export async function confirmPending(
  pending: PendingConfirmation,
  input: Pick<TurnInput, "volunteerLanguage" | "memory" | "buildToolContext">
): Promise<TurnResult> {
  const ctx = input.buildToolContext();
  const result = await executeTool(pending.tool.name, pending.tool.arguments, ctx, { confirmed: true });

  if (result.ok && pending.tool.name === "create_ground_report") input.memory.setPendingReport(undefined);
  if (pending.tool.name === "end_translation_session") input.memory.endTranslation();

  const relay = pending.tool.name === "translate_text" ? relayFromResult(result, pending.tool.arguments) : undefined;

  return {
    turn: {
      intent: "other",
      urgency: "routine",
      reply: { en: result.summary },
      requiresConfirmation: false,
    },
    intent: "other",
    urgency: "routine",
    endStatus: result.ok ? "speaking" : "error",
    text: relay ? relay.translatedText : result.summary,
    textEn: relay ? relay.translatedText : result.summary,
    toolResult: result,
    translationRelay: relay,
    provenance: result.ok ? "Action completed · logged to the audit trail" : undefined,
  };
}
