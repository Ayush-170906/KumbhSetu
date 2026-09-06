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
import { PERSONAS, toolAllowedForPersona, type SetuPersona } from "@/ai/persona";
import { SetuMemory } from "@/ai/memory";
import { getProviders } from "@/ai/providers";
import {
  executeTool,
  needsConfirmation,
  riskClassOf,
  TOOL_BY_NAME,
  type ToolContext,
  type ToolResult,
  type RiskClass,
} from "@/ai/tools";
import type { ReportSeverity } from "@/lib/types";

export interface TurnInput {
  message: string;
  persona: SetuPersona;
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
  /** Pilgrim companion: a screen the reply offers to open. */
  navHint?: { screen: string; label: string };
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
function operationalSummary(ctx: ToolContext, persona: SetuPersona = "volunteer"): string {
  // Control room sees the whole ground; pilgrim/volunteer see their zone.
  if (persona === "management") {
    const s = ctx.store;
    const open = s.incidents.filter((i) => !["resolved", "cancelled"].includes(i.status));
    const crit = open.filter((i) => i.severity === "critical").length;
    const atRisk = [...s.zones].filter((z) => z.riskBand !== "green").sort((a, b) => b.riskScore - a.riskScore);
    const avail = s.volunteers.filter((v) => v.availability === "available").length;
    const signals = s.emergingSignals ?? [];
    return [
      `${open.length} open incident(s)${crit ? ` (${crit} critical)` : ""}.`,
      atRisk.length
        ? `Zones at risk: ${atRisk.map((z) => `${z.shortName} ${z.riskBand} ${z.riskScore}/100`).join(", ")}.`
        : "All zones green.",
      `${avail} volunteer(s) available across the site.`,
      signals.length
        ? `Emerging signals: ${signals.map((sig) => `${sig.headline} (${(sig.confidence * 100) | 0}%)`).join("; ")}.`
        : "No emerging signals.",
    ].join(" ");
  }

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

/**
 * P0: deterministic field-report extraction. When the message clearly reads as
 * a field report ("I also have a report — …", "log this as a report", …) but
 * the model routed elsewhere, we build a create_ground_report call ourselves so
 * natural field-worker phrasing always produces a report draft (which the
 * volunteer then confirms).
 */
function draftGroundReportArgs(message: string): {
  category: GroundReportCategory;
  summary: string;
  severity: ReportSeverity;
} {
  const m = message.toLowerCase();
  const category: GroundReportCategory =
    /\b(lost|missing|separated)\b.{0,24}\b(child|boy|girl|kid|son|daughter|person|man|woman|elderly|mother|father|parent)\b|\b(lost|missing)\s+(child|person|kid)\b/.test(m)
      ? "lost_person"
      : /\b(no water|water shortage|drinking water|tanker|out of water|thirsty|tap)\b/.test(m)
      ? "water"
      : /\b(toilet|sanitation|sewage|latrine|urinal)\b/.test(m)
      ? "toilet"
      : /\b(medical|unwell|injured|faint|collaps|bleeding|heat ?stroke|unconscious|ambulance|sick|dizzy)\b/.test(m)
      ? "medical"
      : /\b(crowd|crush|surge|stampede|bottleneck|pushing|pressure|packed|congest)\b/.test(m)
      ? "crowd"
      : /\b(barricade|barrier|fence|gate|structure|pole|scaffold|collaps|broken|damage|hazard)\b/.test(m)
      ? "infrastructure"
      : /\b(food|langar|annakshetra|meal|hungry|prasad)\b/.test(m)
      ? "food"
      : /\b(fire|smoke|weapon|fight|theft|stolen|suspicious|unattended bag)\b/.test(m)
      ? "safety"
      : /\b(wheelchair|ramp|divyang|elderly access|mobility)\b/.test(m)
      ? "accessibility"
      : "other";
  const severity: ReportSeverity =
    /\b(critical|urgent|emergency|serious|immediately|right now|stampede|crush|collaps|unconscious|bleeding|missing|lost (child|boy|girl|kid)|child.*lost)\b/.test(m)
      ? "high"
      : /\b(minor|small|slight|not urgent|low priority)\b/.test(m)
      ? "low"
      : "moderate";
  const summary =
    message
      .trim()
      .replace(/^\s*(i(?:'| a)?m?\s+(also\s+)?(have|got|filing|submitting|raising|logging|making)\s+(a|an|another|one more|this)?\s*(report|observation|sighting|update)\b[\s:—,-]*)/i, "")
      .replace(/^\s*(reporting|to report)\b[\s:—,-]*/i, "")
      .trim() || message.trim();
  return { category, summary: summary.slice(0, 220), severity };
}

function buildContext(
  message: string,
  intent: SetuIntent,
  ctx: ToolContext,
  persona: SetuPersona
): RetrievedContext {
  return {
    knowledge: retrieve(message, intent, 3, PERSONAS[persona].audience).map((h) => ({
      id: h.id,
      title: h.title,
      body: h.body,
      source: h.source,
    })),
    operational: operationalSummary(ctx, persona),
  };
}

function applyMemoryEffects(turn: SetuTurn, input: TurnInput) {
  const m = input.memory;
  if (turn.enterTranslationMode) {
    m.startTranslation(input.volunteerLanguage, turn.enterTranslationMode.other);
  }
  if (turn.exitTranslationMode) m.endTranslation();

  // Setu asked "which language is the pilgrim speaking?" — remember that, so a
  // bare "marathi" on the next turn is read as the answer, not a new request.
  if (turn.intent === "translation" && turn.followUp && !turn.enterTranslationMode) {
    m.setAwaitingTranslationLanguage(true);
  } else if (turn.intent !== "translation" || turn.enterTranslationMode) {
    m.setAwaitingTranslationLanguage(false);
  }

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
    navHint: turn.navHint,
  };
}

/** Run one full companion turn. */
export async function runTurn(input: TurnInput): Promise<TurnResult> {
  const { llm } = getProviders();
  input.memory.observe(input.message);

  const preIntent = classifyIntent(input.message).intent;
  const ctx = input.buildToolContext();
  const context = buildContext(input.message, preIntent, ctx, input.persona);

  let turn: SetuTurn;
  try {
    const raw = await llm.planTurn({
      message: input.message,
      persona: input.persona,
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

  // Hard guard: never run a tool this persona isn't permitted (§13/§35).
  if (turn.tool && !toolAllowedForPersona(input.persona, turn.tool.name)) {
    turn = { ...turn, tool: undefined, requiresConfirmation: false, confirmationPrompt: undefined };
  }

  // P0: natural "I (also) have a report — …" phrasing must always produce a
  // ground-report draft, even if the model answered with guidance instead.
  if (
    preIntent === "ground_report" &&
    (input.persona === "volunteer" || input.persona === "management") &&
    toolAllowedForPersona(input.persona, "create_ground_report") &&
    turn.tool?.name !== "create_ground_report" &&
    !turn.reportDraft &&
    !input.memory.snapshot().translationPair
  ) {
    const args = draftGroundReportArgs(input.message);
    turn = {
      ...turn,
      intent: "ground_report",
      tool: { name: "create_ground_report" as never, arguments: args },
      requiresConfirmation: false,
      reply: turn.tool
        ? { [input.volunteerLanguage]: "Got it — drafting that as a field report.", en: "Got it — drafting that as a field report." }
        : turn.reply,
    };
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
      endStatus: "speaking",
      text: turn.followUp ? combine(lead, turn.followUp) : lead,
      textEn: turn.followUp ? combine(leadEn, turn.followUp) : leadEn,
      provenance: turn.provenance,
      reportDraft: turn.reportDraft,
      enteredTranslationMode: turn.enterTranslationMode,
      exitedTranslationMode: turn.exitTranslationMode,
      navHint: turn.navHint,
    };
  }

  const mustConfirm = turn.requiresConfirmation || needsConfirmation(turn.tool.name);
  if (mustConfirm) {
    // Say exactly what will happen (P1). Prefer the model's own phrasing, else
    // the tool's own describe() over the concrete arguments.
    const described = TOOL_BY_NAME[turn.tool.name]?.describe(turn.tool.arguments, ctx);
    const prompt = turn.confirmationPrompt ?? (described ? `${described}?` : "Confirm this action?");
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

// ---------------------------------------------------------------------------
// Photo turn (§18) — the volunteer captures an image (optionally with a spoken
// note). Setu runs it through the vision provider, structures a ground-report
// draft (never verified from the image alone, §19), and hands it to the same
// confirm-before-submit flow a spoken report uses.
// ---------------------------------------------------------------------------

export interface PhotoTurnInput {
  dataUrl: string;
  /** What the volunteer said/typed alongside the photo. May be empty. */
  note: string;
  persona: SetuPersona;
  history: ConversationTurn[];
  volunteerLanguage: LanguageCode;
  offline: boolean;
  memory: SetuMemory;
  buildToolContext: () => ToolContext;
}

const PHOTO_CATEGORIES: GroundReportCategory[] = [
  "water", "food", "toilet", "medical", "crowd", "infrastructure", "safety", "lost_person", "accessibility", "other",
];

function countFromText(text: string): number | undefined {
  const m =
    text.match(/(?:about|around|approx(?:\.|imately)?|roughly|~|nearly|some)\s+(\d{1,5})/i) ||
    text.match(/(\d{1,5})\s*(?:\+|or so)?\s*(?:people|persons?|pilgrims?|waiting|affected|stuck|stranded)/i);
  if (m) return Number(m[1]);
  if (/\bhundreds\b/i.test(text)) return 200;
  if (/\bthousands\b/i.test(text)) return 1000;
  return undefined;
}

export async function runPhotoTurn(input: PhotoTurnInput): Promise<TurnResult> {
  const { vision } = getProviders();
  const note = input.note.trim();
  input.memory.observe(note);

  const obs = await vision.describe(input.dataUrl, note || undefined);
  const category: GroundReportCategory = PHOTO_CATEGORIES.includes(obs.categoryHint as GroundReportCategory)
    ? (obs.categoryHint as GroundReportCategory)
    : "other";

  const fireLike = /\b(fire|smoke|burn|spark|electrical)\b/i.test(`${note} ${obs.label}`);
  const people = countFromText(note);
  const urgency: Urgency = fireLike ? "elevated" : "routine";
  const severity: "low" | "moderate" | "high" =
    fireLike || (people ?? 0) >= 100 || /\b(serious|urgent|danger|badly|large|many)\b/i.test(note)
      ? "high"
      : (people ?? 0) >= 30
      ? "moderate"
      : /\b(minor|small|slight)\b/i.test(note)
      ? "low"
      : "moderate";

  const summary = `${obs.label}${note ? ` — “${note.slice(0, 140)}”` : ""}`;
  const missing: string[] = [];
  if (people === undefined && (category === "water" || category === "food" || category === "crowd" || category === "toilet")) {
    missing.push("roughly how many people are affected");
  }

  const reportDraft: GroundReportDraft = {
    category,
    summary,
    detail: note || undefined,
    severity,
    estimatedPeopleAffected: people,
    missing,
    aiConfidence: obs.confidence,
  };
  input.memory.setPendingReport(category);

  const conf = (obs.confidence * 100) | 0;
  const catLabel = category.replace("_", " ");
  const leadEn =
    `I can see ${obs.label.toLowerCase()}. Category: ${catLabel}. ` +
    `Confidence ${conf}% — a photo alone isn't verified. ${obs.potentialImpact}.`;
  const lead =
    input.volunteerLanguage === "en"
      ? leadEn
      : `${obs.label} · ${catLabel} · ${conf}%. ${obs.potentialImpact}.`;

  const provenance = `Vision: ${getProviders().vision.info.name} · structured by Setu from photo + note + GPS`;
  const synthTurn: SetuTurn = {
    intent: "ground_report",
    urgency,
    reply: { en: leadEn, ...(input.volunteerLanguage !== "en" ? { [input.volunteerLanguage]: lead } : {}) },
    requiresConfirmation: missing.length === 0,
    confirmationPrompt: missing.length === 0 ? "Submit this photo report to the control room?" : undefined,
    reportDraft,
    provenance,
  };

  if (missing.length > 0) {
    return {
      turn: synthTurn,
      intent: "ground_report",
      urgency,
      endStatus: "speaking",
      text: combine(lead, `I still need: ${missing.join(", ")}.`),
      textEn: combine(leadEn, `Still needed: ${missing.join(", ")}.`),
      provenance,
      reportDraft,
    };
  }

  return {
    turn: synthTurn,
    intent: "ground_report",
    urgency,
    endStatus: "waiting_for_confirmation",
    text: combine(lead, "Submit this photo report to the control room?"),
    textEn: combine(leadEn, "Submit this photo report to the control room?"),
    provenance,
    reportDraft,
    pendingConfirmation: {
      tool: {
        name: "create_ground_report",
        arguments: {
          category,
          summary,
          detail: note || undefined,
          severity,
          estimatedPeopleAffected: people,
          aiConfidence: obs.confidence,
        },
      },
      prompt: "Submit this photo report to the control room?",
      riskClass: "high_write",
      lead,
    },
  };
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
