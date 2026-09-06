// Controlled tool layer (§12/§13).
//
// The model NEVER mutates store state directly. It proposes a tool call; the
// orchestrator validates the arguments here, applies the risk policy (read /
// low-risk write / high-risk), and only then runs the tool. Every tool has a
// typed signature, an authorization check, argument validation, structured
// output, and produces an audit record.

import type {
  AppState,
} from "@/store/useAppStore";
import type {
  Role,
  ZonePoint,
  LanguageCode,
  IncidentType,
  IncidentSeverity,
  GroundReportCategory,
  ReportSeverity,
  FacilityType,
} from "@/lib/types";
import type { TranslationProvider } from "@/ai/providers/types";
import { retrieve } from "@/ai/knowledge/kb";
import { distance, resolveIncident } from "@/lib/dispatch";

export type RiskClass = "read" | "low_write" | "high_write";

export interface ToolContext {
  /** Live store snapshot + actions (from useAppStore.getState()). */
  store: AppState;
  /** Re-reads the store — use after a mutation, since `store` is a snapshot. */
  getStore: () => AppState;
  /** Who is invoking — drives authorization. */
  actor: { role: Role; id?: string; label: string };
  /** Volunteer's current zone / position (location context, §31). */
  zoneId: string;
  position?: ZonePoint;
  offline: boolean;
  /** A photo the volunteer captured this session, if any (for reports). */
  photo?: string | null;
  translation: TranslationProvider;
}

export interface ToolResult {
  ok: boolean;
  /** One-line, already-phrased-for-a-volunteer summary of what happened / was found. */
  summary: string;
  data?: unknown;
  error?: string;
  /** Audit trail entry to append (§34). Omitted for pure reads that change nothing. */
  audit?: { action: string; entity: string; entityId: string; metadata?: string };
  /** Set by write tools that created something the UI may want to open. */
  createdId?: string;
}

export interface ArgCheck {
  ok: boolean;
  errors: string[];
  /** Normalised args to pass to run(). */
  value: Record<string, unknown>;
}

export interface ToolDef {
  name: string;
  riskClass: RiskClass;
  /** Short description used in the confirm card for high-risk calls. */
  describe: (args: Record<string, unknown>, ctx: ToolContext) => string;
  /** Who may call this tool. */
  authorize: (ctx: ToolContext) => boolean;
  validate: (args: Record<string, unknown>, ctx: ToolContext) => ArgCheck;
  run: (args: Record<string, unknown>, ctx: ToolContext) => Promise<ToolResult>;
}

// --- small helpers ---------------------------------------------------------

const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const num = (v: unknown): number | undefined => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : undefined;
};
const isVolunteer = (ctx: ToolContext) => ctx.actor.role === "volunteer" || ctx.actor.role === "management";

/** "V233" / "v-233" / "V 233" -> "V-233"; anything not volunteer-id shaped -> undefined. */
const normVolId = (v: unknown): string | undefined => {
  const m = (typeof v === "string" ? v : "").toUpperCase().match(/V[-\s]?(\d{2,4})/);
  return m ? `V-${m[1]}` : undefined;
};

const FACILITY_TYPES: FacilityType[] = ["medical", "water", "toilet", "food", "parking", "help_desk"];
const INCIDENT_TYPES: IncidentType[] = ["medical", "lost_person", "crowd_pressure", "security", "facility", "other"];
const SEVERITIES: IncidentSeverity[] = ["low", "moderate", "critical"];
const REPORT_CATEGORIES: GroundReportCategory[] = [
  "water", "food", "toilet", "medical", "crowd", "infrastructure", "safety", "lost_person", "accessibility", "other",
];
const REPORT_SEVERITIES: ReportSeverity[] = ["low", "moderate", "high"];

function nearestFacility(ctx: ToolContext, type: FacilityType, zoneId?: string) {
  const pool = ctx.store.facilities.filter((f) => f.type === type);
  if (pool.length === 0) return undefined;
  const z = zoneId ?? ctx.zoneId;
  const inZone = pool.filter((f) => f.zoneId === z);
  const search = inZone.length > 0 ? inZone : pool;
  const origin = ctx.position ?? ctx.store.zones.find((zz) => zz.id === z)?.labelPoint ?? { x: 500, y: 300 };
  return [...search].sort((a, b) => distance(a.position, origin) - distance(b.position, origin))[0];
}

function metresBetween(a: ZonePoint, b: ZonePoint) {
  return Math.round(distance(a, b) * 3.4); // same abstract-units→m factor the field app uses
}

// --- tool definitions ----------------------------------------------------

export const TOOLS: ToolDef[] = [
  // ------------------------------------------------------------------ READ
  {
    name: "find_nearest_facility",
    riskClass: "read",
    authorize: () => true,
    describe: (a) => `Find the nearest ${str(a.type) ?? "facility"}`,
    validate: (a) => {
      const type = str(a.type);
      const errors: string[] = [];
      if (!type || !FACILITY_TYPES.includes(type as FacilityType)) {
        errors.push(`type must be one of ${FACILITY_TYPES.join(", ")}`);
      }
      return { ok: errors.length === 0, errors, value: { type, zoneId: str(a.zoneId) } };
    },
    run: async (a, ctx) => {
      const type = a.type as FacilityType;
      const f = nearestFacility(ctx, type, a.zoneId as string | undefined);
      if (!f) return { ok: false, summary: `No ${type} facility in this dataset.`, error: "not_found" };
      const origin = ctx.position ?? ctx.store.zones.find((z) => z.id === (a.zoneId ?? ctx.zoneId))?.labelPoint;
      const dist = origin ? `${metresBetween(f.position, origin)} m away` : "nearby";
      const zone = ctx.store.zones.find((z) => z.id === f.zoneId);
      return {
        ok: true,
        summary: `${f.name} — ${dist}, ${f.status}${f.status === "open" ? "" : " (limited)"}, ${f.load} load${zone ? `, in ${zone.shortName}` : ""}.`,
        data: { facility: f, distanceLabel: dist },
      };
    },
  },
  {
    name: "get_facility_status",
    riskClass: "read",
    authorize: () => true,
    describe: (a) => `Check status of ${str(a.name) ?? str(a.facilityId) ?? "a facility"}`,
    validate: (a) => {
      const facilityId = str(a.facilityId);
      const name = str(a.name);
      return {
        ok: Boolean(facilityId || name),
        errors: facilityId || name ? [] : ["provide facilityId or name"],
        value: { facilityId, name },
      };
    },
    run: async (a, ctx) => {
      const facilityId = a.facilityId as string | undefined;
      const name = (a.name as string | undefined)?.toLowerCase();
      const f = ctx.store.facilities.find(
        (x) => x.id === facilityId || (name && x.name.toLowerCase().includes(name))
      );
      if (!f) return { ok: false, summary: "I couldn't find that facility in this dataset.", error: "not_found" };
      return { ok: true, summary: `${f.name} is ${f.status}, ${f.load} load.`, data: { facility: f } };
    },
  },
  {
    name: "get_zone_status",
    riskClass: "read",
    authorize: () => true,
    describe: (a) => `Zone brief for ${str(a.zoneId) ?? "current zone"}`,
    validate: (a) => ({ ok: true, errors: [], value: { zoneId: str(a.zoneId) } }),
    run: async (a, ctx) => {
      const zoneId = (a.zoneId as string | undefined) ?? ctx.zoneId;
      const zone = ctx.store.zones.find((z) => z.id === zoneId);
      const snap = ctx.store.riskSnapshots[zoneId];
      if (!zone) return { ok: false, summary: "Unknown zone.", error: "not_found" };
      const open = ctx.store.incidents.filter(
        (i) => i.zoneId === zoneId && !["resolved", "cancelled", "escalated"].includes(i.status)
      );
      const vols = ctx.store.volunteers.filter((v) => v.zoneId === zoneId && v.availability === "available");
      const reports = ctx.store.groundReports.filter(
        (r) => r.zoneId === zoneId && !["resolved", "dismissed"].includes(r.status)
      );
      return {
        ok: true,
        summary: `${zone.shortName}: crowd ${zone.density}, risk ${snap?.band ?? "n/a"} (${zone.riskScore}/100). ${open.length} open incident${open.length === 1 ? "" : "s"}, ${reports.length} field report${reports.length === 1 ? "" : "s"}, ${vols.length} volunteer${vols.length === 1 ? "" : "s"} available.`,
        data: { zone, snapshot: snap, openIncidents: open, reports, availableVolunteers: vols },
      };
    },
  },
  {
    name: "get_crowd_status",
    riskClass: "read",
    authorize: () => true,
    describe: () => "Current crowd reading",
    validate: (a) => ({ ok: true, errors: [], value: { zoneId: str(a.zoneId) } }),
    run: async (a, ctx) => {
      const zoneId = (a.zoneId as string | undefined) ?? ctx.zoneId;
      const zone = ctx.store.zones.find((z) => z.id === zoneId);
      if (!zone) return { ok: false, summary: "Unknown zone.", error: "not_found" };
      return {
        ok: true,
        summary: `${zone.shortName} is ${zone.density} (${zone.densityPercent}% of capacity), trend ${zone.trend}.`,
        data: { zone },
      };
    },
  },
  {
    name: "get_nearest_volunteers",
    riskClass: "read",
    authorize: (ctx) => isVolunteer(ctx),
    describe: () => "List nearby volunteers",
    validate: (a) => ({ ok: true, errors: [], value: { zoneId: str(a.zoneId), skill: str(a.skill), limit: num(a.limit) } }),
    run: async (a, ctx) => {
      const zoneId = (a.zoneId as string | undefined) ?? ctx.zoneId;
      const skill = a.skill as string | undefined;
      const limit = (num(a.limit) ?? 5) as number;
      const origin = ctx.position ?? ctx.store.zones.find((z) => z.id === zoneId)?.labelPoint ?? { x: 500, y: 300 };
      let pool = ctx.store.volunteers.filter((v) => v.id !== ctx.actor.id);
      if (skill) pool = pool.filter((v) => v.skills.includes(skill));
      const ranked = pool
        .map((v) => ({ v, d: distance(v.position, origin) }))
        .sort((x, y) => x.d - y.d)
        .slice(0, limit);
      if (ranked.length === 0) return { ok: true, summary: "No other volunteers match that in this dataset.", data: { volunteers: [] } };
      return {
        ok: true,
        summary: ranked
          .map(({ v }) => `${v.id} ${v.name} (${v.availability.replace("_", " ")}, ${metresBetween(v.position, origin)} m)`)
          .join("; "),
        data: { volunteers: ranked.map((r) => r.v) },
      };
    },
  },
  {
    name: "get_available_volunteers",
    riskClass: "read",
    authorize: (ctx) => isVolunteer(ctx),
    describe: () => "List available volunteers",
    validate: () => ({ ok: true, errors: [], value: {} }),
    run: async (_a, ctx) => {
      const avail = ctx.store.volunteers.filter((v) => v.availability === "available");
      return {
        ok: true,
        summary: `${avail.length} available: ${avail.map((v) => `${v.id} (${ctx.store.zones.find((z) => z.id === v.zoneId)?.shortName ?? v.zoneId})`).join(", ") || "none"}.`,
        data: { volunteers: avail },
      };
    },
  },
  {
    name: "get_my_tasks",
    riskClass: "read",
    authorize: (ctx) => isVolunteer(ctx),
    describe: () => "Show my tasks",
    validate: () => ({ ok: true, errors: [], value: {} }),
    run: async (_a, ctx) => {
      const mine = ctx.store.tasks.filter((t) => t.assigneeId === ctx.actor.id);
      const active = mine.filter((t) => !["resolved", "escalated", "cancelled"].includes(t.state));
      if (active.length === 0) {
        return { ok: true, summary: "You have no active task right now. You're clear for the next dispatch.", data: { tasks: [] } };
      }
      const lines = active.map((t) => {
        const inc = ctx.store.incidents.find((i) => i.id === t.incidentId);
        return `${inc?.code ?? t.incidentId}: ${inc?.type ?? "task"} · ${t.state} · ${inc?.zoneId ?? ""}`;
      });
      return { ok: true, summary: lines.join(" | "), data: { tasks: active } };
    },
  },
  {
    name: "get_incident",
    riskClass: "read",
    authorize: (ctx) => isVolunteer(ctx),
    describe: (a) => `Look up incident ${str(a.code) ?? str(a.incidentId) ?? ""}`,
    validate: (a) => {
      const has = Boolean(str(a.incidentId) || str(a.code));
      return { ok: has, errors: has ? [] : ["provide incidentId or code"], value: { incidentId: str(a.incidentId), code: str(a.code) } };
    },
    run: async (a, ctx) => {
      const inc = resolveIncident(ctx.store.incidents, a.incidentId as string, a.code as string);
      if (!inc) return { ok: false, summary: "No incident matches that.", error: "not_found" };
      const ageMin = Math.round((Date.now() - new Date(inc.createdAt).getTime()) / 60000);
      return {
        ok: true,
        summary: `${inc.code} — ${inc.type}, ${inc.severity}, status ${inc.status}, open ${ageMin} min${inc.assignedVolunteerId ? `, assigned ${inc.assignedVolunteerId}` : ""}.`,
        data: { incident: inc },
      };
    },
  },
  {
    name: "search_kumbh_knowledge",
    riskClass: "read",
    authorize: () => true,
    describe: (a) => `Search knowledge base for "${str(a.query) ?? ""}"`,
    validate: (a) => {
      const q = str(a.query);
      return { ok: Boolean(q), errors: q ? [] : ["query required"], value: { query: q } };
    },
    run: async (a) => {
      const hits = retrieve(a.query as string, "information", 3);
      if (hits.length === 0) {
        return { ok: true, summary: "No verified knowledge-base entry covers that yet.", data: { hits: [] } };
      }
      return {
        ok: true,
        summary: hits.map((h) => `${h.title}: ${h.body}`).join("\n\n"),
        data: { hits },
      };
    },
  },
  {
    name: "get_resource_status",
    riskClass: "read",
    authorize: (ctx) => isVolunteer(ctx),
    describe: () => "Resource levels",
    validate: (a) => ({ ok: true, errors: [], value: { zoneId: str(a.zoneId) } }),
    run: async (a, ctx) => {
      const zoneId = a.zoneId as string | undefined;
      const rows = ctx.store.resources.filter((r) => !zoneId || r.zoneId === zoneId);
      if (rows.length === 0) return { ok: true, summary: "No resource records for that zone.", data: { resources: [] } };
      return {
        ok: true,
        summary: rows.map((r) => `${r.type}: ${r.quantity} (${r.status})`).join("; "),
        data: { resources: rows },
      };
    },
  },
  {
    name: "get_emergency_contacts",
    riskClass: "read",
    authorize: () => true,
    describe: () => "Emergency contacts",
    validate: () => ({ ok: true, errors: [], value: {} }),
    run: async () => ({
      ok: true,
      summary:
        "Medical response team: radio channel 1 / control room. Crowd safety desk: channel 2. Lost & Found / reunification: zone Help Desk. Police post: channel 3. (Demo environment — these are placeholder channels.)",
      data: {
        contacts: [
          { name: "Medical response team", via: "Radio ch.1 · Control Room" },
          { name: "Crowd safety desk", via: "Radio ch.2" },
          { name: "Lost & Found", via: "Zone Help Desk" },
          { name: "Police post", via: "Radio ch.3" },
        ],
      },
    }),
  },
  {
    name: "get_operational_procedure",
    riskClass: "read",
    authorize: () => true,
    describe: (a) => `Procedure: ${str(a.topic) ?? ""}`,
    validate: (a) => {
      const topic = str(a.topic);
      return { ok: Boolean(topic), errors: topic ? [] : ["topic required"], value: { topic } };
    },
    run: async (a) => {
      const hits = retrieve(a.topic as string, "information", 2);
      if (hits.length === 0) {
        return { ok: true, summary: "I don't have a verified procedure for that. Ask the control room.", data: { hits: [] } };
      }
      return { ok: true, summary: hits.map((h) => h.body).join("\n\n"), data: { hits } };
    },
  },
  {
    name: "translate_text",
    riskClass: "read",
    authorize: () => true,
    describe: (a) => `Translate to ${str(a.to) ?? "?"}`,
    validate: (a) => {
      const text = str(a.text);
      const to = str(a.to);
      const errors: string[] = [];
      if (!text) errors.push("text required");
      if (!to || !["en", "hi", "mr", "ta"].includes(to)) errors.push("to must be en|hi|mr|ta");
      return { ok: errors.length === 0, errors, value: { text, to, from: str(a.from) } };
    },
    run: async (a, ctx) => {
      const res = await ctx.translation.translate(
        a.text as string,
        a.to as LanguageCode,
        a.from as LanguageCode | undefined
      );
      return {
        ok: true,
        summary: res.text,
        data: res,
      };
    },
  },

  // -------------------------------------------------------------- LOW WRITE
  {
    name: "create_ground_report",
    riskClass: "low_write",
    authorize: (ctx) => isVolunteer(ctx),
    describe: (a) => `Submit a ${str(a.category) ?? "field"} report`,
    validate: (a, ctx) => {
      const errors: string[] = [];
      const category = str(a.category);
      const summary = str(a.summary);
      const severity = str(a.severity) ?? "moderate";
      if (!category || !REPORT_CATEGORIES.includes(category as GroundReportCategory)) {
        errors.push(`category must be one of ${REPORT_CATEGORIES.join(", ")}`);
      }
      if (!summary) errors.push("summary required");
      if (!REPORT_SEVERITIES.includes(severity as ReportSeverity)) errors.push("severity must be low|moderate|high");
      return {
        ok: errors.length === 0,
        errors,
        value: {
          category,
          summary,
          detail: str(a.detail),
          severity,
          estimatedPeopleAffected: num(a.estimatedPeopleAffected),
          zoneId: str(a.zoneId) ?? ctx.zoneId,
        },
      };
    },
    run: async (a, ctx) => {
      const report = ctx.store.createGroundReport({
        category: a.category as GroundReportCategory,
        summary: a.summary as string,
        detail: a.detail as string | undefined,
        severity: a.severity as ReportSeverity,
        estimatedPeopleAffected: a.estimatedPeopleAffected as number | undefined,
        zoneId: a.zoneId as string,
        position: ctx.position,
        reportedBy: ctx.actor,
        source: "volunteer_observation",
        photoUrls: ctx.photo ? [ctx.photo] : undefined,
        aiConfidence: typeof a.aiConfidence === "number" ? (a.aiConfidence as number) : 0.8,
        queuedOffline: ctx.offline,
      });
      // No `audit` here — the store's createGroundReport already writes a rich
      // audit entry; adding one would double-log.
      return {
        ok: true,
        createdId: report.id,
        summary: ctx.offline
          ? `Saved ${report.code} locally — it will sync when you're back online.`
          : `Field report ${report.code} submitted to the control room.`,
        data: { report },
      };
    },
  },
  {
    name: "report_resource_issue",
    riskClass: "low_write",
    authorize: (ctx) => isVolunteer(ctx),
    describe: (a) => `Report resource issue: ${str(a.resourceType) ?? ""}`,
    validate: (a, ctx) => {
      const resourceType = str(a.resourceType);
      const note = str(a.note);
      const errors: string[] = [];
      if (!resourceType) errors.push("resourceType required");
      if (!note) errors.push("note required");
      return { ok: errors.length === 0, errors, value: { resourceType, note, zoneId: str(a.zoneId) ?? ctx.zoneId } };
    },
    run: async (a, ctx) => {
      const report = ctx.store.createGroundReport({
        category: "infrastructure",
        summary: `${a.resourceType} issue: ${a.note}`,
        detail: a.note as string,
        severity: "moderate",
        zoneId: a.zoneId as string,
        position: ctx.position,
        reportedBy: ctx.actor,
        source: "resource_data",
        queuedOffline: ctx.offline,
      });
      return {
        ok: true,
        createdId: report.id,
        summary: `Logged as ${report.code} for the resource team.`,
        data: { report },
      };
    },
  },

  // ------------------------------------------------------------- HIGH WRITE
  {
    name: "create_incident",
    riskClass: "high_write",
    authorize: (ctx) => isVolunteer(ctx),
    describe: (a) =>
      `Create a ${str(a.severity) ?? "moderate"} ${str(a.type) ?? "incident"} in ${str(a.zoneId) ?? "this zone"} — this pages the nearest volunteer and the control room`,
    validate: (a, ctx) => {
      const errors: string[] = [];
      const type = str(a.type);
      const severity = str(a.severity) ?? "moderate";
      const summary = str(a.summary);
      if (!type || !INCIDENT_TYPES.includes(type as IncidentType)) errors.push(`type must be one of ${INCIDENT_TYPES.join(", ")}`);
      if (!SEVERITIES.includes(severity as IncidentSeverity)) errors.push("severity must be low|moderate|critical");
      if (!summary) errors.push("summary required");
      return {
        ok: errors.length === 0,
        errors,
        value: {
          type,
          severity,
          summary,
          zoneId: str(a.zoneId) ?? ctx.zoneId,
          preferredLanguage: str(a.preferredLanguage),
          dispatch: a.dispatch !== false,
        },
      };
    },
    run: async (a, ctx) => {
      const input = {
        type: a.type as IncidentType,
        severity: a.severity as IncidentSeverity,
        zoneId: a.zoneId as string,
        position: ctx.position,
        reportedBy: { role: ctx.actor.role, label: ctx.actor.label },
        summary: a.summary as string,
        preferredLanguage: a.preferredLanguage as LanguageCode | undefined,
      };
      const incident = a.dispatch === false
        ? ctx.store.createIncident(input)
        : ctx.store.submitSOS(input);
      const assigned = ctx.getStore().incidents.find((i) => i.id === incident.id)?.assignedVolunteerId;
      return {
        ok: true,
        createdId: incident.id,
        summary: `Incident ${incident.code} created${assigned ? ` and dispatched to ${assigned}` : " — awaiting a responder"}.`,
        data: { incident },
        audit: {
          action: "INCIDENT_CREATED_VIA_SETU",
          entity: "incident",
          entityId: incident.id,
          metadata: `${input.type} · ${input.severity}`,
        },
      };
    },
  },
  {
    name: "escalate_incident",
    riskClass: "high_write",
    authorize: (ctx) => isVolunteer(ctx),
    describe: (a) => `Escalate ${str(a.code) ?? str(a.incidentId) ?? "the incident"} to the control room`,
    validate: (a) => {
      const has = Boolean(str(a.incidentId) || str(a.code));
      return { ok: has, errors: has ? [] : ["provide incidentId or code"], value: { incidentId: str(a.incidentId), code: str(a.code) } };
    },
    run: async (a, ctx) => {
      const inc = resolveIncident(ctx.store.incidents, a.incidentId as string, a.code as string);
      if (!inc) return { ok: false, summary: "No incident matches that.", error: "not_found" };
      const task = ctx.store.tasks.find(
        (t) => t.incidentId === inc.id && !["resolved", "escalated", "cancelled"].includes(t.state)
      );
      if (task) {
        ctx.store.resolveTask(task.id, "escalated");
      } else {
        ctx.store.dispatchIncident(inc.id);
      }
      return {
        ok: true,
        summary: `${inc.code} escalated — the control room is notified and the case stays open.`,
        data: { incidentId: inc.id },
        audit: { action: "INCIDENT_ESCALATED_VIA_SETU", entity: "incident", entityId: inc.id },
      };
    },
  },
  {
    name: "assign_volunteer",
    riskClass: "high_write",
    authorize: (ctx) => isVolunteer(ctx),
    describe: (a, ctx) => {
      const inc = resolveIncident(ctx.store.incidents, a.incidentId as string, a.code as string);
      const v = normVolId(a.volunteerId);
      return v
        ? `Dispatch ${v} to ${inc?.code ?? "the incident"}`
        : `Dispatch the nearest skill- and language-matched responder to ${inc?.code ?? "the incident"}`;
    },
    validate: (a) => {
      const has = Boolean(str(a.incidentId) || str(a.code));
      return {
        ok: has,
        errors: has ? [] : ["provide incidentId or code"],
        value: { incidentId: str(a.incidentId), code: str(a.code), volunteerId: normVolId(a.volunteerId) },
      };
    },
    run: async (a, ctx) => {
      const inc = resolveIncident(ctx.store.incidents, a.incidentId as string, a.code as string);
      if (!inc) return { ok: false, summary: "No incident matches that.", error: "not_found" };
      // If the operator named a specific available volunteer, force that one by
      // excluding every other available responder; otherwise auto-match.
      let exclude: string[] = [];
      const wanted = a.volunteerId as string | undefined;
      if (wanted) {
        const v = ctx.store.volunteers.find((vv) => vv.id.toUpperCase() === wanted.toUpperCase());
        if (v && v.availability === "available") {
          exclude = ctx.store.volunteers
            .filter((vv) => vv.id !== v.id && vv.availability === "available")
            .map((vv) => vv.id);
        }
      }
      ctx.store.dispatchIncident(inc.id, exclude);
      const assigned = ctx.getStore().incidents.find((i) => i.id === inc.id)?.assignedVolunteerId;
      return {
        ok: true,
        summary: assigned ? `${assigned} dispatched to ${inc.code}.` : `No responder available for ${inc.code} — escalated.`,
        data: { incidentId: inc.id, assigned },
        audit: { action: "VOLUNTEER_DISPATCHED_VIA_SETU", entity: "incident", entityId: inc.id, metadata: assigned },
      };
    },
  },
  {
    // low_write: the volunteer is advancing a task they already own. resolve /
    // escalate still get a confirm — the reasoning provider sets
    // requiresConfirmation and the orchestrator honours it.
    name: "update_task_status",
    riskClass: "low_write",
    authorize: (ctx) => isVolunteer(ctx),
    describe: (a) => `Mark your task "${str(a.status) ?? ""}"`,
    validate: (a) => {
      const status = str(a.status);
      const ok = Boolean(status && ["accept", "arrive", "resolve", "escalate"].includes(status));
      return { ok, errors: ok ? [] : ["status must be accept|arrive|resolve|escalate"], value: { status, taskId: str(a.taskId) } };
    },
    run: async (a, ctx) => {
      const status = a.status as "accept" | "arrive" | "resolve" | "escalate";
      const task =
        ctx.store.tasks.find((t) => t.id === a.taskId) ??
        ctx.store.tasks.find(
          (t) => t.assigneeId === ctx.actor.id && !["resolved", "escalated", "cancelled"].includes(t.state)
        );
      if (!task) return { ok: false, summary: "You have no active task to update.", error: "no_task" };
      if (status === "accept") ctx.store.acceptTask(task.id);
      if (status === "arrive") ctx.store.arriveTask(task.id);
      if (status === "resolve") ctx.store.resolveTask(task.id, "resolved");
      if (status === "escalate") ctx.store.resolveTask(task.id, "escalated");
      return {
        ok: true,
        summary: `Task for ${ctx.store.incidents.find((i) => i.id === task.incidentId)?.code ?? task.incidentId} marked ${status}d.`,
        data: { taskId: task.id, status },
        audit: { action: `TASK_${status.toUpperCase()}_VIA_SETU`, entity: "task", entityId: task.id },
      };
    },
  },
  {
    name: "start_translation_session",
    riskClass: "low_write",
    authorize: () => true,
    describe: (a) => `Start live translation with ${str(a.other) ?? "another language"}`,
    validate: (a) => {
      const other = str(a.other);
      const ok = Boolean(other && ["en", "hi", "mr", "ta"].includes(other));
      return { ok, errors: ok ? [] : ["other must be en|hi|mr|ta"], value: { other } };
    },
    run: async (a) => ({
      ok: true,
      summary: `Live translation ready. Speak, and I'll relay each side.`,
      data: { other: a.other },
      audit: { action: "TRANSLATION_SESSION_STARTED", entity: "session", entityId: "-", metadata: String(a.other) },
    }),
  },
  {
    name: "end_translation_session",
    riskClass: "read",
    authorize: () => true,
    describe: () => "End live translation",
    validate: () => ({ ok: true, errors: [], value: {} }),
    run: async () => ({ ok: true, summary: "Translation ended.", data: {} }),
  },

  // ---- control-room only -------------------------------------------------
  {
    name: "get_operational_overview",
    riskClass: "read",
    authorize: (ctx) => ctx.actor.role === "management",
    describe: () => "Whole-ground operational overview",
    validate: () => ({ ok: true, errors: [], value: {} }),
    run: async (_a, ctx) => {
      const s = ctx.getStore();
      const open = s.incidents.filter((i) => !["resolved", "cancelled"].includes(i.status));
      const crit = open.filter((i) => i.severity === "critical").length;
      const atRisk = [...s.zones].filter((z) => z.riskBand !== "green").sort((a, b) => b.riskScore - a.riskScore);
      const avail = s.volunteers.filter((v) => v.availability === "available").length;
      const onTask = s.volunteers.filter((v) => v.availability === "on_task").length;
      const signals = s.emergingSignals ?? [];
      const reports = s.groundReports.filter((r) => !["resolved", "dismissed"].includes(r.status)).length;
      const riskLine = atRisk.length
        ? atRisk.map((z) => `${z.shortName} ${z.riskBand} ${z.riskScore}`).join(", ")
        : "all zones green";
      return {
        ok: true,
        summary:
          `${open.length} open incident${open.length === 1 ? "" : "s"}${crit ? ` (${crit} critical)` : ""}. ` +
          `Zones at risk: ${riskLine}. ` +
          `${signals.length} emerging signal${signals.length === 1 ? "" : "s"}, ${reports} active field report${reports === 1 ? "" : "s"}. ` +
          `Volunteers: ${avail} available, ${onTask} on task.`,
        data: { open, atRisk, signals, availableVolunteers: avail, onTask },
      };
    },
  },
  {
    name: "get_emerging_signals",
    riskClass: "read",
    authorize: (ctx) => ctx.actor.role === "management",
    describe: () => "Current Kumbh Pulse emerging signals",
    validate: () => ({ ok: true, errors: [], value: {} }),
    run: async (_a, ctx) => {
      const signals = ctx.getStore().emergingSignals ?? [];
      if (signals.length === 0) {
        return { ok: true, summary: "No emerging signals right now — field reports are not clustering.", data: { signals: [] } };
      }
      const lines = signals
        .map((sig) => {
          const zone = ctx.store.zones.find((z) => z.id === sig.zoneId);
          return `${zone?.shortName ?? sig.zoneId}: ${sig.headline} — ${(sig.confidence * 100) | 0}% confidence, ${sig.reportIds.length} report(s)${sig.pilgrimRequestCount ? ` + ${sig.pilgrimRequestCount} pilgrim request(s)` : ""}. Recommended: ${sig.recommendedAction}`;
        })
        .join("  •  ");
      return { ok: true, summary: lines, data: { signals } };
    },
  },
  {
    name: "publish_advisory",
    riskClass: "high_write",
    authorize: (ctx) => ctx.actor.role === "management",
    describe: (a) =>
      `Publish a ${str(a.severity) ?? "advisory"} to ${str(a.scope) === "all" ? "ALL zones (every pilgrim phone)" : str(a.scope) ?? "a zone"} — live on pilgrim apps`,
    validate: (a, ctx) => {
      const errors: string[] = [];
      const scope = str(a.scope) ?? "all";
      const severity = str(a.severity) ?? "advisory";
      const message = str(a.message);
      if (!["info", "advisory", "warning"].includes(severity)) errors.push("severity must be info|advisory|warning");
      if (!message || message.length < 8) errors.push("message required (a clear instruction)");
      if (scope !== "all" && !ctx.store.zones.some((z) => z.id === scope || z.shortName.toLowerCase() === scope.toLowerCase())) {
        errors.push("scope must be 'all' or a known zone");
      }
      return { ok: errors.length === 0, errors, value: { scope, severity, message } };
    },
    run: async (a, ctx) => {
      const scopeRaw = a.scope as string;
      const zone = ctx.store.zones.find(
        (z) => z.id === scopeRaw || z.shortName.toLowerCase() === scopeRaw.toLowerCase()
      );
      const zoneId = scopeRaw === "all" ? "all" : zone?.id ?? scopeRaw;
      ctx.store.publishAdvisory({
        zoneId,
        severity: a.severity as "info" | "advisory" | "warning",
        message: a.message as string,
        issuedBy: ctx.actor.label,
      });
      return {
        ok: true,
        summary: `Advisory published to ${zoneId === "all" ? "all zones" : zone?.shortName ?? zoneId}. It is now live on pilgrim apps in scope.`,
        data: { zoneId, severity: a.severity },
        audit: {
          action: "ADVISORY_PUBLISHED_VIA_SETU",
          entity: "advisory",
          entityId: zoneId,
          metadata: `${a.severity} · ${(a.message as string).slice(0, 60)}`,
        },
      };
    },
  },
  {
    name: "promote_signal_to_incident",
    riskClass: "high_write",
    authorize: (ctx) => ctx.actor.role === "management",
    describe: (a) => `Promote signal ${str(a.signalId) ?? ""} to a dispatchable incident`,
    validate: (a) => {
      const has = Boolean(str(a.signalId) || str(a.zoneId) || str(a.category));
      return {
        ok: has,
        errors: has ? [] : ["provide signalId, or a zoneId/category to match a signal"],
        value: { signalId: str(a.signalId), zoneId: str(a.zoneId), category: str(a.category) },
      };
    },
    run: async (a, ctx) => {
      const signals = ctx.getStore().emergingSignals ?? [];
      const sig =
        signals.find((x) => x.id === a.signalId) ??
        signals.find(
          (x) =>
            (a.zoneId && (x.zoneId === a.zoneId)) ||
            (a.category && x.category === a.category)
        ) ??
        signals[0];
      if (!sig) return { ok: false, summary: "No emerging signal to promote.", error: "not_found" };
      const reportId = sig.reportIds[0];
      if (!reportId) return { ok: false, summary: "That signal has no linked field report to promote.", error: "no_report" };
      const incident = ctx.store.promoteReportToIncident(reportId, ctx.actor.label);
      if (!incident) return { ok: false, summary: "Couldn't promote that report — it may already be linked to an incident.", error: "promote_failed" };
      const assigned = ctx.getStore().incidents.find((i) => i.id === incident.id)?.assignedVolunteerId;
      return {
        ok: true,
        createdId: incident.id,
        summary: `Signal promoted to incident ${incident.code}${assigned ? ` and dispatched to ${assigned}` : " — awaiting a responder"}.`,
        data: { incident, signal: sig },
        audit: {
          action: "SIGNAL_PROMOTED_VIA_SETU",
          entity: "incident",
          entityId: incident.id,
          metadata: sig.headline,
        },
      };
    },
  },
];

export type ToolName = (typeof TOOLS)[number]["name"];

export const TOOL_BY_NAME: Record<string, ToolDef> = Object.fromEntries(TOOLS.map((t) => [t.name, t]));

export function toolRiskClass(name: string): RiskClass | undefined {
  return TOOL_BY_NAME[name]?.riskClass;
}
