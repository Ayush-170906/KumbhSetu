// OpenAI-compatible function schemas for the subset of tools the model is
// allowed to propose. Sarvam's chat-completions API is OpenAI-compatible, so
// these go straight into the `tools` array for genuine function calling.
//
// The model only *proposes* a call. The orchestrator still runs registry
// validation, per-persona authorization and the risk/confirmation gate before
// anything executes — see src/ai/orchestrator.ts and src/ai/tools/registry.ts.

export interface OpenAIToolSchema {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

const S = (
  name: string,
  description: string,
  properties: Record<string, unknown> = {},
  required: string[] = []
): OpenAIToolSchema => ({
  type: "function",
  function: { name, description, parameters: { type: "object", properties, required } },
});

const enumStr = (values: string[], description?: string) => ({
  type: "string" as const,
  enum: values,
  ...(description ? { description } : {}),
});

const SCHEMAS: Record<string, OpenAIToolSchema> = {
  // ---- reads ----
  get_zone_status: S("get_zone_status", "Get crowd density, risk band and open-incident count for a zone.", {
    zoneId: { type: "string", description: "Zone id like z04. Omit for the current zone." },
  }),
  get_crowd_status: S("get_crowd_status", "Get the current crowd level and trend for a zone.", {
    zoneId: { type: "string" },
  }),
  get_operational_overview: S(
    "get_operational_overview",
    "Whole-site operational picture for the control room: zones at risk, open incidents, volunteer availability, emerging signals. Use this for 'brief me'."
  ),
  get_emerging_signals: S(
    "get_emerging_signals",
    "The aggregated Kumbh Pulse signals — weak field signals grouped into things worth a human's attention, with contributors and confidence."
  ),
  get_available_volunteers: S("get_available_volunteers", "List volunteers currently available, with skills and languages.", {
    zoneId: { type: "string" },
  }),
  get_nearest_volunteers: S("get_nearest_volunteers", "Nearest volunteers to a zone or incident, ranked by distance.", {
    zoneId: { type: "string" },
  }),
  get_incident: S("get_incident", "Look up one incident by code (e.g. KS-1042) or id.", {
    code: { type: "string" },
    incidentId: { type: "string" },
  }),
  find_nearest_facility: S("find_nearest_facility", "Find the nearest facility of a type.", {
    type: enumStr(["medical", "water", "toilet", "food", "parking", "help_desk"]),
    zoneId: { type: "string" },
  }, ["type"]),
  get_facility_status: S("get_facility_status", "Status (open/limited/closed, load) of facilities of a type in a zone.", {
    type: enumStr(["medical", "water", "toilet", "food", "parking", "help_desk"]),
    zoneId: { type: "string" },
  }, ["type"]),
  get_emergency_contacts: S("get_emergency_contacts", "Emergency and control-room contact numbers."),
  get_resource_status: S("get_resource_status", "Stock/adequacy of a resource type in a zone.", {
    zoneId: { type: "string" },
  }),
  get_operational_procedure: S("get_operational_procedure", "Retrieve the step-by-step SOP for a topic (heatstroke, barrier breach, lost child, shift handover, escalation, dispatch, evacuation).", {
    topic: { type: "string", description: "e.g. 'lost child', 'shift handover', 'heatstroke'" },
  }, ["topic"]),
  get_my_tasks: S("get_my_tasks", "The current task assigned to this volunteer, if any."),

  // ---- writes (all gated: registry validation + confirmation) ----
  create_ground_report: S(
    "create_ground_report",
    "Draft a structured field observation (water/medical/crowd/infrastructure/etc). Low-risk; the volunteer confirms before it is submitted.",
    {
      category: enumStr(["water", "food", "toilet", "medical", "crowd", "infrastructure", "safety", "lost_person", "accessibility", "other"]),
      summary: { type: "string", description: "one clear sentence" },
      detail: { type: "string" },
      severity: enumStr(["low", "moderate", "high"]),
      estimatedPeopleAffected: { type: "number" },
      zoneId: { type: "string" },
    },
    ["category", "summary", "severity"]
  ),
  create_incident: S(
    "create_incident",
    "Create a dispatchable incident. HIGH RISK — pages the nearest volunteer and the control room. Requires human confirmation.",
    {
      type: enumStr(["medical", "lost_person", "crowd_pressure", "security", "facility", "other"]),
      severity: enumStr(["low", "moderate", "critical"]),
      summary: { type: "string" },
      zoneId: { type: "string" },
      preferredLanguage: enumStr(["en", "hi", "mr", "ta"]),
    },
    ["type", "severity", "summary"]
  ),
  escalate_incident: S("escalate_incident", "Escalate an existing incident. HIGH RISK — requires confirmation.", {
    code: { type: "string" },
    incidentId: { type: "string" },
  }),
  assign_volunteer: S(
    "assign_volunteer",
    "Dispatch a responder to an incident. Put the incident code in `code` (e.g. KS-1003) and, if the operator named a specific volunteer, put that in `volunteerId` (e.g. V-233). HIGH RISK — requires confirmation.",
    {
      incidentId: { type: "string", description: "incident code or id, e.g. KS-1003" },
      code: { type: "string", description: "incident code, e.g. KS-1003" },
      volunteerId: { type: "string", description: "specific volunteer to send, e.g. V-233 (optional)" },
    }
  ),
  publish_advisory: S(
    "publish_advisory",
    "Publish an advisory to pilgrim phones. HIGH RISK — requires confirmation.",
    {
      scope: { type: "string", description: "'all' or a zone id" },
      severity: enumStr(["info", "advisory", "warning"]),
      message: { type: "string", description: "a clear instruction, >= 8 chars" },
    },
    ["message"]
  ),
  promote_signal_to_incident: S("promote_signal_to_incident", "Turn a Kumbh Pulse signal into a verified incident. HIGH RISK — requires confirmation.", {
    signalId: { type: "string" },
  }),
};

/** Returns OpenAI function schemas for the given tool names, skipping any we
 * don't expose to the model. */
export function openAiToolSchemas(names: readonly string[]): OpenAIToolSchema[] {
  const seen = new Set<string>();
  const out: OpenAIToolSchema[] = [];
  for (const n of names) {
    if (seen.has(n)) continue;
    seen.add(n);
    if (SCHEMAS[n]) out.push(SCHEMAS[n]);
  }
  return out;
}

/** Coarse SetuIntent label from a proposed tool, for SetuTurn.intent.
 * Values are all members of SetuIntent (src/ai/intents.ts). */
export function intentForTool(name?: string): string {
  if (!name) return "information";
  if (name === "create_ground_report" || name === "get_emerging_signals") return "ground_report";
  if (name === "create_incident" || name === "escalate_incident" || name === "promote_signal_to_incident")
    return "safety";
  if (name === "assign_volunteer" || name === "get_my_tasks" || name === "update_task_status")
    return "volunteer_task";
  if (name === "publish_advisory") return "safety";
  if (name.includes("translat")) return "translation";
  if (name === "get_operational_overview" || name === "get_zone_status" || name === "get_crowd_status")
    return "zone_intelligence";
  if (name === "find_nearest_facility" || name === "get_facility_status") return "navigation";
  if (name === "get_resource_status") return "resource";
  return "information";
}
