// Structured output contract for one Setu turn.
//
// Critical actions never depend on free-form model text (§44). The provider
// returns a `SetuTurn` object; the orchestrator validates it here before
// anything is spoken or executed. If validation fails, the orchestrator
// degrades to a safe "I didn't get that" turn rather than acting on garbage.

import type { LanguageCode, GroundReportCategory, ReportSeverity } from "@/lib/types";
import type { SetuIntent } from "@/ai/intents";
import type { ToolName } from "@/ai/tools/registry";

export type Urgency = "routine" | "elevated" | "emergency";

/** What the companion is doing right now — drives the visible state (§27). */
export type SetuStatus =
  | "idle"
  | "listening"
  | "thinking"
  | "searching"
  | "translating"
  | "taking_action"
  | "waiting_for_confirmation"
  | "speaking"
  | "error"
  | "offline";

export interface RetrievedContext {
  /** Verified knowledge-base passages relevant to the query. */
  knowledge: { id: string; title: string; body: string; source: string }[];
  /** A compact, already-formatted snapshot of live operational state. */
  operational: string;
}

export interface SetuTurnRequest {
  /** The user's message this turn (already transcribed if it came from voice). */
  message: string;
  /** Prior turns, oldest first. */
  history: ConversationTurn[];
  /** Language the volunteer is interacting in. */
  volunteerLanguage: LanguageCode;
  /** Grounding: retrieved KB + live operational summary. */
  context: RetrievedContext;
  /** Short-lived session memory (resolved entities, active translation pair). */
  memory: SessionMemorySnapshot;
  /** True when the device has no connectivity — limits what the turn can promise. */
  offline: boolean;
}

export interface ConversationTurn {
  role: "user" | "setu";
  text: string;
  at: string;
}

export interface SessionMemorySnapshot {
  /** e.g. { subject: "the pilgrim's mother", location: "Gate 3" } */
  entities: Record<string, string>;
  /** Active live-translation language pair, if translation mode is on. */
  translationPair?: { volunteer: LanguageCode; other: LanguageCode };
  /** The last ground-report draft being assembled, if any. */
  pendingReportCategory?: GroundReportCategory;
}

/** A tool the model wants run. `arguments` is validated per-tool in the registry. */
export interface ToolInvocation {
  name: ToolName;
  arguments: Record<string, unknown>;
}

/** A structured ground-report draft the companion assembled from the conversation. */
export interface GroundReportDraft {
  category: GroundReportCategory;
  summary: string;
  detail?: string;
  severity: ReportSeverity;
  estimatedPeopleAffected?: number;
  /** Fields Setu still needs from the volunteer before it can submit. */
  missing: string[];
  aiConfidence: number;
}

export interface SetuTurn {
  intent: SetuIntent;
  urgency: Urgency;
  /** The reply, keyed by language. `volunteerLanguage` is always present. */
  reply: Partial<Record<LanguageCode, string>>;
  /** A single follow-up question, if the companion needs one more thing. */
  followUp?: string;
  /** Proposed tool call. Presence does not mean it runs — see requiresConfirmation. */
  tool?: ToolInvocation;
  /** High-risk tool calls (§13) must be confirmed by the volunteer first. */
  requiresConfirmation: boolean;
  /** One-line description of what confirming will do, for the confirm card. */
  confirmationPrompt?: string;
  /** Present when the turn produced/updated a ground-report draft. */
  reportDraft?: GroundReportDraft;
  /** Set true when the companion wants the UI to enter live-translation mode. */
  enterTranslationMode?: { other: LanguageCode };
  /** Set true to leave translation mode. */
  exitTranslationMode?: boolean;
  /** Freeform provenance note shown under the reply ("Source: …"). */
  provenance?: string;
}

const URGENCIES: Urgency[] = ["routine", "elevated", "emergency"];

/**
 * Validates a candidate turn. Returns the turn narrowed, or null if it is
 * unusable. Deliberately permissive about optional fields, strict about the
 * ones the orchestrator will act on.
 */
export function validateTurn(value: unknown): SetuTurn | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;

  if (typeof v.intent !== "string") return null;
  if (typeof v.requiresConfirmation !== "boolean") return null;
  if (!URGENCIES.includes(v.urgency as Urgency)) return null;

  const reply = v.reply;
  if (typeof reply !== "object" || reply === null) return null;
  const replyValues = Object.values(reply as Record<string, unknown>);
  if (replyValues.length === 0 || replyValues.some((r) => typeof r !== "string")) return null;

  if (v.tool !== undefined) {
    const tool = v.tool as Record<string, unknown>;
    if (typeof tool.name !== "string" || typeof tool.arguments !== "object" || tool.arguments === null) {
      return null;
    }
  }

  // If a high-risk turn asks for confirmation it must say what it will do.
  if (v.requiresConfirmation && typeof v.confirmationPrompt !== "string") return null;

  return v as unknown as SetuTurn;
}

export function safeFallbackTurn(volunteerLanguage: LanguageCode): SetuTurn {
  return {
    intent: "other",
    urgency: "routine",
    reply: {
      [volunteerLanguage]:
        "I didn't quite get that. You can try again, or type it — short phrases work best in the field.",
      en: "I didn't quite get that. Please try again, or type it.",
    },
    requiresConfirmation: false,
  };
}
