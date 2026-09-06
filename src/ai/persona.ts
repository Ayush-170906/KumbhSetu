// Who is talking to Setu, and what that means.
//
// The /ai core (orchestrator, tools, KB, providers) is role-agnostic. This file
// is the one place the differences live: which tools a role may call, which KB
// audience its questions are weighted toward, and the surface copy / quick
// actions its companion shows. The Pilgrim, Volunteer and Control-Room
// companions are the same engine with a different PersonaSpec.

import type { Role } from "@/lib/types";
import type { KBAudience } from "@/ai/knowledge/kb";
import type { ToolName } from "@/ai/tools/registry";

export type SetuPersona = "pilgrim" | "volunteer" | "management";

export interface PersonaSpec {
  /** Store role — drives tool authorization. */
  role: Role;
  /** KB passages written for this role are weighted up in retrieval. */
  audience: KBAudience;
  title: string;
  subtitle: string;
  emptyHint: string;
  /** Operational quick actions (§42) — never generic AI suggestions. */
  chips: string[];
  /** Hard allow-list. A tool the model proposes outside this set is dropped. */
  allowedTools: ToolName[];
}

const READS_COMMON: ToolName[] = [
  "find_nearest_facility",
  "get_facility_status",
  "get_zone_status",
  "get_crowd_status",
  "search_kumbh_knowledge",
  "get_operational_procedure",
  "translate_text",
  "start_translation_session",
  "end_translation_session",
];

export const PERSONAS: Record<SetuPersona, PersonaSpec> = {
  pilgrim: {
    role: "pilgrim",
    audience: "pilgrim",
    title: "Kumbh Setu AI",
    subtitle: "Ask about facilities, routes, darshan and safety",
    emptyHint: "Ask a question, or tap a suggestion. Setu can also translate.",
    chips: [
      "Where is the nearest toilet?",
      "Nearest medical camp",
      "Is this area crowded right now?",
      "When is the next Shahi Snan?",
      "I need help",
    ],
    // Pilgrims read and translate. They do NOT file control-room incidents or
    // ground reports — the SOS flow and Report-an-Issue screen do that.
    allowedTools: [...READS_COMMON, "get_emergency_contacts"],
  },

  volunteer: {
    role: "volunteer",
    audience: "volunteer",
    title: "Kumbh Setu AI",
    subtitle: "Voice-first field companion",
    emptyHint: "Ask, translate, or send a photo — Kumbh Setu AI",
    chips: [
      "Nearest medical camp",
      "What's happening in my zone",
      "Help me talk to a Tamil-speaking pilgrim",
      "Report a water shortage here",
      "My tasks",
    ],
    allowedTools: [
      ...READS_COMMON,
      "get_nearest_volunteers",
      "get_available_volunteers",
      "get_my_tasks",
      "get_incident",
      "get_resource_status",
      "get_emergency_contacts",
      "create_ground_report",
      "report_resource_issue",
      "create_incident",
      "escalate_incident",
      "update_task_status",
    ],
  },

  management: {
    role: "management",
    audience: "management",
    title: "Kumbh Setu AI · Operations",
    subtitle: "Control-room copilot — one question, the whole ground",
    emptyHint: "Ask for the overview, a zone, the signals, or draft an advisory.",
    chips: [
      "Brief me on current operations",
      "Why is Ghat 4 at risk?",
      "Show me the emerging signals",
      "Draft a shift handover for Ghat 4",
      "Draft an advisory for Ghat 4",
      "How many volunteers are available?",
    ],
    allowedTools: [
      ...READS_COMMON,
      "get_nearest_volunteers",
      "get_available_volunteers",
      "get_incident",
      "get_resource_status",
      "get_emergency_contacts",
      "get_operational_overview",
      "get_emerging_signals",
      "create_incident",
      "escalate_incident",
      "assign_volunteer",
      "publish_advisory",
      "promote_signal_to_incident",
    ],
  },
};

export function personaSpec(p: SetuPersona): PersonaSpec {
  return PERSONAS[p];
}

/** Whether `persona` is permitted to run `name` at all. */
export function toolAllowedForPersona(persona: SetuPersona, name: string): boolean {
  return (PERSONAS[persona].allowedTools as string[]).includes(name);
}
