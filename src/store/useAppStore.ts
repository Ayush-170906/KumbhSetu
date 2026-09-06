"use client";

import { create } from "zustand";
import type {
  Zone,
  Facility,
  Volunteer,
  VolunteerAvailability,
  VolunteerKind,
  AvailabilitySlot,
  Incident,
  IncidentType,
  IncidentSeverity,
  Task,
  RiskSnapshot,
  Resource,
  Notification,
  AuditEvent,
  SystemStatus,
  ZonePoint,
  Role,
  Advisory,
  AdvisorySeverity,
  FoundReport,
  LanguageCode,
  ZoneMessage,
  PilgrimFeedback,
  FeedbackCategory,
  FamilyGroup,
  FamilyMember,
  EPass,
  EPassCategory,
  GroundReport,
  GroundReportCategory,
  ReportSeverity,
  EvidenceSource,
  VerificationStatus,
  EmergingSignal,
} from "@/lib/types";
import { deriveEmergingSignals } from "@/lib/signals";
import {
  ZONES,
  FACILITIES,
  VOLUNTEERS,
  RISK_SNAPSHOTS,
  RESOURCES,
  INITIAL_INCIDENTS,
  AUDIT_SEED,
  INITIAL_ADVISORIES,
  INITIAL_FOUND_REPORTS,
  INITIAL_FEEDBACK,
  findZone,
} from "@/lib/seed";
import {
  findNearestAvailableVolunteer,
  estimateEtaMinutes,
  distance,
  severityWeight,
  recomputeZoneRisk,
  nextSequentialCode,
  requiredSkillFor,
  textMatchScore,
} from "@/lib/dispatch";
import { loadPersistedState, initPersistence } from "./persist";

const MODEL_VERSION = "pulse-rule-v0.3";
const BASELINE_RISK: Record<string, RiskSnapshot> = RISK_SNAPSHOTS;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

/**
 * Approximates "pilgrim demand" per category+zone for the Kumbh Pulse signal
 * model — pilgrim-reported incidents are treated as demand signals that can
 * corroborate a volunteer's ground report (§20). Keyed "category::zoneId".
 */
function pilgrimRequestTally(incidents: Incident[]): Record<string, number> {
  const map: Record<IncidentType, GroundReportCategory> = {
    medical: "medical",
    lost_person: "lost_person",
    crowd_pressure: "crowd",
    security: "safety",
    facility: "infrastructure",
    other: "other",
  };
  const tally: Record<string, number> = {};
  for (const i of incidents) {
    if (i.reportedBy.role !== "pilgrim") continue;
    if (["resolved", "cancelled"].includes(i.status)) continue;
    const key = `${map[i.type]}::${i.zoneId}`;
    tally[key] = (tally[key] ?? 0) + 1;
  }
  return tally;
}

export interface ReportIncidentInput {
  type: IncidentType;
  severity: IncidentSeverity;
  zoneId: string;
  position?: ZonePoint;
  reportedBy: { role: Role; label: string };
  summary: string;
  preferredLanguage?: LanguageCode;
}

export interface EnrollVolunteerInput {
  name: string;
  phone?: string;
  zoneId: string;
  kind: VolunteerKind;
  skills: string[];
  languages: LanguageCode[];
  /** professional: dated windows; general: a standing shift start/end. */
  slots?: AvailabilitySlot[];
  shiftStart?: string;
  shiftEnd?: string;
  enrolledBy?: "self" | "management";
}

export interface PublishAdvisoryInput {
  zoneId: "all" | string;
  severity: AdvisorySeverity;
  message: string;
  issuedBy: string;
}

export interface CreateGroundReportInput {
  category: GroundReportCategory;
  zoneId: string;
  position?: ZonePoint;
  summary: string;
  detail?: string;
  severity: ReportSeverity;
  estimatedPeopleAffected?: number;
  source: EvidenceSource;
  reportedBy: { role: Role; id?: string; label: string };
  photoUrls?: string[];
  aiConfidence?: number;
  queuedOffline?: boolean;
}

export interface SetuAuditInput {
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: string;
}

export interface DemoLogEntry {
  id: string;
  time: string;
  label: string;
}

interface DemoState {
  running: boolean;
  completed: boolean;
  stepIndex: number;
  totalSteps: number;
  log: DemoLogEntry[];
  activeIncidentId?: string;
  activeTaskId?: string;
}

export interface AppState {
  zones: Zone[];
  facilities: Facility[];
  volunteers: Volunteer[];
  incidents: Incident[];
  tasks: Task[];
  riskSnapshots: Record<string, RiskSnapshot>;
  riskHistory: Record<string, number[]>;
  resources: Resource[];
  notifications: Notification[];
  auditLog: AuditEvent[];
  systemStatus: SystemStatus;
  incidentSeq: number;
  simTickCount: number;
  simulationRunning: boolean;
  demo: DemoState;
  advisories: Advisory[];
  foundReports: FoundReport[];
  language: LanguageCode;
  messages: ZoneMessage[];
  groundReports: GroundReport[];
  groundReportSeq: number;
  emergingSignals: EmergingSignal[];
  pilgrimFeedback: PilgrimFeedback[];
  familyGroups: FamilyGroup[];
  ePasses: EPass[];

  initSimulation: () => void;
  tick: () => void;
  setConnectivity: (state: SystemStatus["connectivity"]) => void;
  setLanguage: (language: LanguageCode) => void;

  publishAdvisory: (input: PublishAdvisoryInput) => void;
  retractAdvisory: (advisoryId: string) => void;

  reportFoundPerson: (input: { zoneId: string; description: string }) => FoundReport;
  confirmLostFoundMatch: (incidentId: string, foundReportId: string) => void;

  attachPhoto: (incidentId: string, dataUrl: string, actor: string) => void;
  sendZoneMessage: (input: { zoneId: string; senderId: string; senderName: string; text: string }) => void;
  submitFeedback: (input: {
    name?: string;
    zoneId?: string;
    rating: number;
    category: FeedbackCategory;
    message: string;
  }) => PilgrimFeedback;
  issueEPass: (input: {
    holder: string;
    cluster: "nashik" | "trimbakeshwar";
    date: string;
    category: EPassCategory;
    partySize: number;
  }) => EPass;
  createFamilyGroup: (name: string) => FamilyGroup;
  addFamilyMember: (groupId: string, member: Omit<FamilyMember, "id">) => void;
  removeFamilyMember: (groupId: string, memberId: string) => void;
  setFamilyMeetingPoint: (groupId: string, point: { zoneId: string; label: string }) => void;

  createGroundReport: (input: CreateGroundReportInput) => GroundReport;
  corroborateGroundReport: (reportId: string, by: string) => void;
  updateGroundReportStatus: (reportId: string, status: VerificationStatus, actor?: string) => void;
  promoteReportToIncident: (reportId: string, actor?: string) => Incident | undefined;
  flushOfflineReports: () => void;
  recordSetuAudit: (input: SetuAuditInput) => void;

  createIncident: (input: ReportIncidentInput) => Incident;
  triageIncident: (incidentId: string) => void;
  dispatchIncident: (incidentId: string, excludeVolunteerIds?: string[]) => void;
  submitSOS: (input: ReportIncidentInput) => Incident;

  acceptTask: (taskId: string) => void;
  declineTask: (taskId: string) => void;
  arriveTask: (taskId: string) => void;
  resolveTask: (taskId: string, outcome?: "resolved" | "escalated") => void;
  setVolunteerAvailability: (volunteerId: string, availability: VolunteerAvailability) => void;
  enrollVolunteer: (input: EnrollVolunteerInput) => Volunteer;

  startDemo: () => void;
  resetDemo: () => void;
  resetAll: () => void;
}

let simInterval: ReturnType<typeof setInterval> | null = null;
let demoTimers: ReturnType<typeof setTimeout>[] = [];

function clearDemoTimers() {
  demoTimers.forEach((t) => clearTimeout(t));
  demoTimers = [];
}

function pushTimeline(incident: Incident, status: Incident["timeline"][number]["status"], label: string, actor?: string, detail?: string) {
  incident.timeline.push({ status, label, timestamp: nowIso(), actor, detail });
}

function recalcZoneRisk(get: () => AppState, set: (fn: (s: AppState) => Partial<AppState>) => void, zoneId: string) {
  const state = get();
  const zone = state.zones.find((z) => z.id === zoneId);
  const baseline = BASELINE_RISK[zoneId];
  if (!zone || !baseline) return;

  const openIncidents = state.incidents.filter(
    (i) => i.zoneId === zoneId && !["resolved", "escalated", "cancelled"].includes(i.status)
  );
  const severityBoost = openIncidents.reduce((sum, i) => sum + severityWeight(i.severity), 0);

  const snapshot = recomputeZoneRisk(zone, baseline, openIncidents.length, severityBoost, MODEL_VERSION);

  set((s) => {
    const history = [...(s.riskHistory[zoneId] ?? []), snapshot.score].slice(-24);
    return {
      zones: s.zones.map((z) =>
        z.id === zoneId
          ? {
              ...z,
              riskScore: snapshot.score,
              riskBand: snapshot.band,
              trend: snapshot.score > z.riskScore ? "up" : snapshot.score < z.riskScore ? "down" : "flat",
            }
          : z
      ),
      riskSnapshots: { ...s.riskSnapshots, [zoneId]: snapshot },
      riskHistory: { ...s.riskHistory, [zoneId]: history },
    };
  });
}

const defaultData = {
  zones: clone(ZONES),
  facilities: clone(FACILITIES),
  volunteers: clone(VOLUNTEERS),
  incidents: clone(INITIAL_INCIDENTS),
  tasks: [] as Task[],
  riskSnapshots: clone(RISK_SNAPSHOTS),
  riskHistory: Object.fromEntries(ZONES.map((z) => [z.id, [RISK_SNAPSHOTS[z.id]?.score ?? z.riskScore]])),
  resources: clone(RESOURCES),
  notifications: [] as Notification[],
  auditLog: clone(AUDIT_SEED),
  systemStatus: { mode: "simulation", connectivity: "nominal", lastSyncAt: nowIso() } as SystemStatus,
  incidentSeq: 2, // seed already used ks-1039, next fresh incident starts at 1040
  simTickCount: 0,
  simulationRunning: false,
  demo: { running: false, completed: false, stepIndex: 0, totalSteps: 6, log: [] } as DemoState,
  advisories: clone(INITIAL_ADVISORIES),
  foundReports: clone(INITIAL_FOUND_REPORTS),
  language: "en" as LanguageCode,
  messages: [] as ZoneMessage[],
  groundReports: [] as GroundReport[],
  groundReportSeq: 0,
  emergingSignals: [] as EmergingSignal[],
  pilgrimFeedback: clone(INITIAL_FEEDBACK),
  familyGroups: [] as FamilyGroup[],
  ePasses: [] as EPass[],
};

// Restore a prior session's incidents/tasks/etc. (if any) so a page reload
// mid-demo doesn't silently wipe progress. A demo that was mid-flight when
// the page unloaded can't have its setTimeout chain resume, so it's always
// un-paused back to "not running" rather than shown stuck. The ambient
// simulation interval lives in module state that a reload clears too, so
// simulationRunning is likewise reset — Management re-arms it via initSimulation().
const persisted = loadPersistedState();
const initialData = persisted
  ? {
      ...defaultData,
      ...persisted,
      simulationRunning: false,
      demo: { ...defaultData.demo, ...(persisted.demo as Partial<DemoState> | undefined), running: false },
    }
  : defaultData;

export const useAppStore = create<AppState>((set, get) => ({
  ...initialData,

  setLanguage: (language) => set(() => ({ language })),

  attachPhoto: (incidentId, dataUrl, actor) => {
    set((s) => ({
      incidents: s.incidents.map((i) => {
        if (i.id !== incidentId) return i;
        const updated = { ...i, photoUrls: [...(i.photoUrls ?? []), dataUrl], updatedAt: nowIso(), timeline: [...i.timeline] };
        pushTimeline(updated, "note", "Photo evidence attached", actor);
        return updated;
      }),
      auditLog: [
        {
          id: `ae-photo-${incidentId}-${Date.now()}`,
          actor,
          action: "PHOTO_ATTACHED",
          entity: "incident",
          entityId: incidentId,
          timestamp: nowIso(),
        },
        ...s.auditLog,
      ],
    }));
  },

  sendZoneMessage: (input) => {
    const message: ZoneMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      zoneId: input.zoneId,
      senderId: input.senderId,
      senderName: input.senderName,
      text: input.text,
      createdAt: nowIso(),
    };
    set((s) => ({ messages: [...s.messages, message].slice(-100) }));
  },

  submitFeedback: (input) => {
    const fb: PilgrimFeedback = {
      id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: input.name?.trim() || undefined,
      zoneId: input.zoneId || undefined,
      rating: Math.max(1, Math.min(5, Math.round(input.rating))),
      category: input.category,
      message: input.message.trim(),
      createdAt: nowIso(),
    };
    set((s) => ({
      pilgrimFeedback: [fb, ...s.pilgrimFeedback].slice(0, 200),
      auditLog: [
        {
          id: `ae-fb-${fb.id}`,
          actor: fb.name ?? "Pilgrim",
          action: "FEEDBACK_SUBMITTED",
          entity: "feedback",
          entityId: fb.id,
          timestamp: nowIso(),
          metadata: `${fb.rating}★ · ${fb.category}`,
        },
        ...s.auditLog,
      ],
    }));
    return fb;
  },

  issueEPass: (input) => {
    const pass: EPass = {
      id: `KP-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      holder: input.holder.trim() || "Pilgrim",
      cluster: input.cluster,
      date: input.date,
      category: input.category,
      partySize: Math.max(1, Math.min(50, Math.round(input.partySize))),
      issuedAt: nowIso(),
    };
    set((s) => ({ ePasses: [pass, ...s.ePasses].slice(0, 50) }));
    return pass;
  },

  createFamilyGroup: (name) => {
    const group: FamilyGroup = {
      id: `KS-${Math.floor(1000 + Math.random() * 9000)}`,
      name: name.trim() || "My group",
      createdAt: nowIso(),
      members: [],
    };
    set((s) => ({ familyGroups: [group, ...s.familyGroups].slice(0, 50) }));
    return group;
  },

  addFamilyMember: (groupId, member) => {
    set((s) => ({
      familyGroups: s.familyGroups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              members: [
                ...g.members,
                {
                  id: `fm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  name: member.name.trim() || "Member",
                  phone: member.phone?.trim() || undefined,
                  wristband: member.wristband?.trim() || undefined,
                  note: member.note?.trim() || undefined,
                },
              ],
            }
          : g
      ),
    }));
  },

  removeFamilyMember: (groupId, memberId) => {
    set((s) => ({
      familyGroups: s.familyGroups.map((g) =>
        g.id === groupId ? { ...g, members: g.members.filter((m) => m.id !== memberId) } : g
      ),
    }));
  },

  setFamilyMeetingPoint: (groupId, point) => {
    set((s) => ({
      familyGroups: s.familyGroups.map((g) =>
        g.id === groupId ? { ...g, meetingPoint: point } : g
      ),
    }));
  },

  createGroundReport: (input) => {
    const seq = get().groundReportSeq + 1;
    const now = nowIso();
    const report: GroundReport = {
      id: `gr-${4000 + seq}`,
      code: `GR-${4000 + seq}`,
      category: input.category,
      zoneId: input.zoneId,
      position: input.position,
      summary: input.summary,
      detail: input.detail,
      severity: input.severity,
      estimatedPeopleAffected: input.estimatedPeopleAffected,
      source: input.source,
      reportedBy: input.reportedBy,
      status: input.queuedOffline ? "unverified" : "reported",
      corroborations: 1,
      photoUrls: input.photoUrls,
      createdAt: now,
      updatedAt: now,
      queuedOffline: input.queuedOffline,
      aiConfidence: input.aiConfidence,
    };

    set((s) => {
      const groundReports = [report, ...s.groundReports];
      return {
        groundReports,
        groundReportSeq: seq,
        emergingSignals: deriveEmergingSignals(groundReports, s.resources, s.zones, pilgrimRequestTally(s.incidents)),
        auditLog: [
          {
            id: `ae-${report.id}`,
            actor: input.reportedBy.label,
            action: input.queuedOffline ? "GROUND_REPORT_QUEUED_OFFLINE" : "GROUND_REPORT_CREATED",
            entity: "groundReport",
            entityId: report.id,
            timestamp: now,
            metadata: `${report.category} · ${report.severity}${report.estimatedPeopleAffected ? ` · ~${report.estimatedPeopleAffected} affected` : ""}`,
          },
          ...s.auditLog,
        ],
        notifications: input.queuedOffline
          ? s.notifications
          : [
              {
                id: `n-${report.id}-mgmt`,
                recipientRole: "management" as Role,
                channel: "in_app" as const,
                title: `Field report ${report.code}`,
                body: report.summary,
                event: "ground_report",
                createdAt: now,
                deliveryState: "delivered" as const,
              },
              ...s.notifications,
            ],
      };
    });

    return report;
  },

  corroborateGroundReport: (reportId, by) => {
    set((s) => {
      const groundReports = s.groundReports.map((r) =>
        r.id === reportId
          ? {
              ...r,
              corroborations: r.corroborations + 1,
              status: r.status === "unverified" || r.status === "reported" ? ("corroborated" as VerificationStatus) : r.status,
              updatedAt: nowIso(),
            }
          : r
      );
      return {
        groundReports,
        emergingSignals: deriveEmergingSignals(groundReports, s.resources, s.zones, pilgrimRequestTally(s.incidents)),
        auditLog: [
          {
            id: `ae-corrob-${reportId}-${Date.now()}`,
            actor: by,
            action: "GROUND_REPORT_CORROBORATED",
            entity: "groundReport",
            entityId: reportId,
            timestamp: nowIso(),
          },
          ...s.auditLog,
        ],
      };
    });
  },

  updateGroundReportStatus: (reportId, status, actor = "Control Room") => {
    set((s) => {
      const groundReports = s.groundReports.map((r) =>
        r.id === reportId ? { ...r, status, updatedAt: nowIso() } : r
      );
      return {
        groundReports,
        emergingSignals: deriveEmergingSignals(groundReports, s.resources, s.zones, pilgrimRequestTally(s.incidents)),
        auditLog: [
          {
            id: `ae-grstatus-${reportId}-${Date.now()}`,
            actor,
            action: `GROUND_REPORT_${status.toUpperCase()}`,
            entity: "groundReport",
            entityId: reportId,
            timestamp: nowIso(),
          },
          ...s.auditLog,
        ],
      };
    });
  },

  promoteReportToIncident: (reportId, actor = "Control Room") => {
    const report = get().groundReports.find((r) => r.id === reportId);
    if (!report || report.linkedIncidentId) return get().incidents.find((i) => i.id === report?.linkedIncidentId);

    const typeMap: Record<GroundReportCategory, IncidentType> = {
      water: "facility",
      food: "facility",
      toilet: "facility",
      infrastructure: "facility",
      accessibility: "facility",
      medical: "medical",
      crowd: "crowd_pressure",
      safety: "security",
      lost_person: "lost_person",
      other: "other",
    };
    const sevMap: Record<ReportSeverity, IncidentSeverity> = { low: "low", moderate: "moderate", high: "critical" };

    const incident = get().createIncident({
      type: typeMap[report.category],
      severity: sevMap[report.severity],
      zoneId: report.zoneId,
      position: report.position,
      reportedBy: { role: "management", label: `${actor} (from ${report.code})` },
      summary: report.summary,
    });

    set((s) => ({
      groundReports: s.groundReports.map((r) =>
        r.id === reportId ? { ...r, linkedIncidentId: incident.id, status: "verified" as VerificationStatus, updatedAt: nowIso() } : r
      ),
      auditLog: [
        {
          id: `ae-promote-${reportId}-${Date.now()}`,
          actor,
          action: "GROUND_REPORT_PROMOTED_TO_INCIDENT",
          entity: "incident",
          entityId: incident.id,
          timestamp: nowIso(),
          metadata: report.code,
        },
        ...s.auditLog,
      ],
    }));
    return incident;
  },

  flushOfflineReports: () => {
    set((s) => {
      const queued = s.groundReports.filter((r) => r.queuedOffline);
      if (queued.length === 0) return s;
      const groundReports = s.groundReports.map((r) =>
        r.queuedOffline ? { ...r, queuedOffline: false, status: r.status === "unverified" ? ("reported" as VerificationStatus) : r.status, updatedAt: nowIso() } : r
      );
      return {
        groundReports,
        emergingSignals: deriveEmergingSignals(groundReports, s.resources, s.zones, pilgrimRequestTally(s.incidents)),
        auditLog: [
          {
            id: `ae-flush-${Date.now()}`,
            actor: "system",
            action: "OFFLINE_REPORTS_SYNCED",
            entity: "system",
            entityId: "-",
            timestamp: nowIso(),
            metadata: `${queued.length} queued report${queued.length === 1 ? "" : "s"} synced`,
          },
          ...s.auditLog,
        ],
      };
    });
  },

  recordSetuAudit: (input) => {
    set((s) => ({
      auditLog: [
        {
          id: `ae-setu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          actor: input.actor,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId,
          timestamp: nowIso(),
          metadata: input.metadata,
        },
        ...s.auditLog,
      ],
    }));
  },

  publishAdvisory: (input) => {
    const advisory: Advisory = {
      id: `adv-${Date.now()}`,
      zoneId: input.zoneId,
      severity: input.severity,
      message: input.message,
      issuedBy: input.issuedBy,
      createdAt: nowIso(),
      active: true,
    };
    set((s) => ({
      advisories: [advisory, ...s.advisories],
      auditLog: [
        {
          id: `ae-advisory-${advisory.id}`,
          actor: input.issuedBy,
          action: "ADVISORY_PUBLISHED",
          entity: "advisory",
          entityId: advisory.id,
          timestamp: nowIso(),
          metadata: `${input.zoneId === "all" ? "All zones" : input.zoneId} · ${input.severity.toUpperCase()}`,
        },
        ...s.auditLog,
      ],
    }));
  },

  retractAdvisory: (advisoryId) => {
    set((s) => ({
      advisories: s.advisories.map((a) => (a.id === advisoryId ? { ...a, active: false } : a)),
    }));
  },

  reportFoundPerson: (input) => {
    const state = get();
    const seq = state.foundReports.length + 1;
    const report: FoundReport = {
      id: `found-${Date.now()}`,
      code: `KF-${2000 + seq}`,
      zoneId: input.zoneId,
      description: input.description,
      createdAt: nowIso(),
      status: "open",
    };
    set((s) => ({
      foundReports: [report, ...s.foundReports],
      auditLog: [
        {
          id: `ae-${report.id}`,
          actor: "Volunteer/Help Desk",
          action: "FOUND_PERSON_REPORTED",
          entity: "foundReport",
          entityId: report.id,
          timestamp: nowIso(),
          metadata: report.code,
        },
        ...s.auditLog,
      ],
    }));
    return report;
  },

  confirmLostFoundMatch: (incidentId, foundReportId) => {
    set((s) => ({
      foundReports: s.foundReports.map((f) =>
        f.id === foundReportId ? { ...f, status: "matched", matchedIncidentId: incidentId } : f
      ),
      incidents: s.incidents.map((i) => {
        if (i.id !== incidentId) return i;
        const updated = { ...i, status: "resolved" as const, updatedAt: nowIso(), timeline: [...i.timeline] };
        pushTimeline(updated, "resolved", "Matched with a found-person report — case closed", "Control Room");
        return updated;
      }),
      auditLog: [
        {
          id: `ae-match-${incidentId}-${foundReportId}`,
          actor: "Control Room",
          action: "LOST_FOUND_MATCH_CONFIRMED",
          entity: "incident",
          entityId: incidentId,
          timestamp: nowIso(),
        },
        ...s.auditLog,
      ],
    }));
    const incident = get().incidents.find((i) => i.id === incidentId);
    if (incident) recalcZoneRisk(get, set, incident.zoneId);
  },

  initSimulation: () => {
    if (simInterval) return;
    set(() => ({ simulationRunning: true }));
    simInterval = setInterval(() => get().tick(), 4000);
  },

  tick: () => {
    set((s) => {
      const zones = s.zones.map((z) => {
        const bias = z.id === "z04" || z.id === "z02" ? 0.6 : -0.2;
        const drift = (Math.random() - 0.45 + bias * 0.3) * 4;
        const seedZone = ZONES.find((sz) => sz.id === z.id)!;
        const densityPercent = Math.max(
          10,
          Math.min(96, Math.round(z.densityPercent + drift * 0.5 + (seedZone.densityPercent - z.densityPercent) * 0.05))
        );
        return {
          ...z,
          densityPercent,
          currentOccupancy: Math.round((densityPercent / 100) * z.capacity),
        };
      });

      const volunteers = s.volunteers.map((v) => {
        if (v.availability !== "on_task" || !v.activeTaskId) return v;
        const task = s.tasks.find((t) => t.id === v.activeTaskId);
        const incident = task ? s.incidents.find((i) => i.id === task.incidentId) : undefined;
        if (!incident) return v;
        const target = incident.position;
        const nx = v.position.x + (target.x - v.position.x) * 0.35;
        const ny = v.position.y + (target.y - v.position.y) * 0.35;
        return { ...v, position: { x: nx, y: ny } };
      });

      return {
        zones,
        volunteers,
        simTickCount: s.simTickCount + 1,
        systemStatus: { ...s.systemStatus, lastSyncAt: nowIso() },
      };
    });

    get().zones.forEach((z) => recalcZoneRisk(get, set, z.id));
  },

  setConnectivity: (connectivity) =>
    set((s) => ({ systemStatus: { ...s.systemStatus, connectivity } })),

  createIncident: (input) => {
    const state = get();
    const seq = state.incidentSeq + 1;
    const code = nextSequentialCode(seq);
    const zone = findZone(input.zoneId);
    const position = input.position ?? zone?.labelPoint ?? { x: 500, y: 400 };

    const incident: Incident = {
      id: `inc-${code.toLowerCase()}`,
      code,
      type: input.type,
      severity: input.severity,
      zoneId: input.zoneId,
      position,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      status: "reported",
      reportedBy: input.reportedBy,
      timeline: [],
      summary: input.summary,
      preferredLanguage: input.preferredLanguage,
      requiredSkill: requiredSkillFor(input.type),
    };
    pushTimeline(incident, "created", `Reported by ${input.reportedBy.label}`, input.reportedBy.label);

    const auditEntry: AuditEvent = {
      id: `ae-${code}-created`,
      actor: input.reportedBy.label,
      action: "INCIDENT_REPORTED",
      entity: "incident",
      entityId: incident.id,
      timestamp: nowIso(),
      metadata: `${zone?.shortName ?? input.zoneId} · ${input.severity.toUpperCase()}`,
    };

    const notification: Notification = {
      id: `n-${code}-mgmt`,
      recipientRole: "management",
      channel: "in_app",
      title: `New incident ${code}`,
      body: incident.summary,
      event: "incident_reported",
      createdAt: nowIso(),
      deliveryState: "delivered",
    };

    set((s) => ({
      incidents: [...s.incidents, incident],
      incidentSeq: seq,
      auditLog: [auditEntry, ...s.auditLog],
      notifications: [notification, ...s.notifications],
    }));

    recalcZoneRisk(get, set, input.zoneId);
    return incident;
  },

  triageIncident: (incidentId) => {
    set((s) => ({
      incidents: s.incidents.map((i) => {
        if (i.id !== incidentId) return i;
        const updated = { ...i, status: "triaged" as const, updatedAt: nowIso(), timeline: [...i.timeline] };
        pushTimeline(updated, "triaged", `Triaged — priority ${i.severity.toUpperCase()}`, "Kumbh Pulse");
        return updated;
      }),
      auditLog: [
        {
          id: `ae-${incidentId}-triaged-${Date.now()}`,
          actor: "system",
          action: "INCIDENT_TRIAGED",
          entity: "incident",
          entityId: incidentId,
          timestamp: nowIso(),
        },
        ...s.auditLog,
      ],
    }));
  },

  dispatchIncident: (incidentId, excludeVolunteerIds = []) => {
    const state = get();
    const incident = state.incidents.find((i) => i.id === incidentId);
    if (!incident) return;

    const match = findNearestAvailableVolunteer(
      state.volunteers,
      incident.zoneId,
      incident.position,
      excludeVolunteerIds,
      incident.requiredSkill,
      incident.preferredLanguage
    );
    const responder = match?.volunteer;

    if (!responder) {
      set((s) => ({
        incidents: s.incidents.map((i) => {
          if (i.id !== incidentId) return i;
          const updated = { ...i, updatedAt: nowIso(), timeline: [...i.timeline] };
          pushTimeline(updated, "note", "No responder available — escalated to control room", "system");
          return updated;
        }),
        auditLog: [
          {
            id: `ae-${incidentId}-noresponder-${Date.now()}`,
            actor: "system",
            action: "ESCALATED_NO_RESPONDER",
            entity: "incident",
            entityId: incidentId,
            timestamp: nowIso(),
          },
          ...s.auditLog,
        ],
      }));
      return;
    }

    const etaMinutes = estimateEtaMinutes(distance(responder.position, incident.position));
    const taskId = `task-${incident.code.toLowerCase()}-${responder.id.toLowerCase()}`;
    const task: Task = {
      id: taskId,
      incidentId: incident.id,
      assigneeId: responder.id,
      priority: incident.severity,
      state: "assigned",
      createdAt: nowIso(),
    };

    const matchLabel =
      match!.quality === "skill_and_language"
        ? ` — matched on skill + language`
        : match!.quality === "skill"
        ? ` — matched on required skill`
        : match!.quality === "language"
        ? ` — matched on language`
        : "";

    set((s) => ({
      tasks: [...s.tasks, task],
      incidents: s.incidents.map((i) => {
        if (i.id !== incidentId) return i;
        const updated = {
          ...i,
          status: "dispatched" as const,
          assignedVolunteerId: responder.id,
          etaMinutes,
          matchQuality: match!.quality,
          updatedAt: nowIso(),
          timeline: [...i.timeline],
        };
        pushTimeline(updated, "dispatched", `Dispatched to ${responder.id} · ETA ${etaMinutes} min${matchLabel}`, "system");
        return updated;
      }),
      notifications: [
        {
          id: `n-${taskId}-vol`,
          recipientRole: "volunteer",
          recipientId: responder.id,
          channel: "push",
          title: `New task — ${incident.type.replace("_", " ")}`,
          body: `${incident.summary} (${incident.code})`,
          event: "task_assigned",
          createdAt: nowIso(),
          deliveryState: "delivered",
        },
        ...s.notifications,
      ],
      auditLog: [
        {
          id: `ae-${taskId}-dispatched`,
          actor: "system",
          action: "VOLUNTEER_DISPATCHED",
          entity: "task",
          entityId: taskId,
          timestamp: nowIso(),
          metadata: `${responder.id} → ${incident.code}`,
        },
        ...s.auditLog,
      ],
    }));

    recalcZoneRisk(get, set, incident.zoneId);
  },

  submitSOS: (input) => {
    const incident = get().createIncident(input);
    get().triageIncident(incident.id);
    get().dispatchIncident(incident.id);
    return get().incidents.find((i) => i.id === incident.id)!;
  },

  acceptTask: (taskId) => {
    const state = get();
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;

    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, state: "accepted", acceptedAt: nowIso() } : t)),
      volunteers: s.volunteers.map((v) =>
        v.id === task.assigneeId ? { ...v, availability: "on_task", activeTaskId: taskId } : v
      ),
      incidents: s.incidents.map((i) => {
        if (i.id !== task.incidentId) return i;
        const updated = { ...i, status: "acknowledged" as const, updatedAt: nowIso(), timeline: [...i.timeline] };
        pushTimeline(updated, "acknowledged", `${task.assigneeId} accepted — en route`, task.assigneeId);
        return updated;
      }),
      auditLog: [
        {
          id: `ae-${taskId}-accepted-${Date.now()}`,
          actor: task.assigneeId,
          action: "TASK_ACCEPTED",
          entity: "task",
          entityId: taskId,
          timestamp: nowIso(),
        },
        ...s.auditLog,
      ],
    }));
  },

  declineTask: (taskId) => {
    const state = get();
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const incidentId = task.incidentId;
    const decliningVolunteerId = task.assigneeId;

    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, state: "cancelled" } : t)),
      auditLog: [
        {
          id: `ae-${taskId}-declined-${Date.now()}`,
          actor: decliningVolunteerId,
          action: "TASK_DECLINED",
          entity: "task",
          entityId: taskId,
          timestamp: nowIso(),
        },
        ...s.auditLog,
      ],
    }));

    get().dispatchIncident(incidentId, [decliningVolunteerId]);
  },

  arriveTask: (taskId) => {
    const state = get();
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;

    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, state: "arrived", arrivedAt: nowIso() } : t)),
      incidents: s.incidents.map((i) => {
        if (i.id !== task.incidentId) return i;
        const updated = { ...i, status: "responding" as const, updatedAt: nowIso(), timeline: [...i.timeline] };
        pushTimeline(updated, "responding", `${task.assigneeId} arrived on site`, task.assigneeId);
        return updated;
      }),
      auditLog: [
        {
          id: `ae-${taskId}-arrived-${Date.now()}`,
          actor: task.assigneeId,
          action: "TASK_ARRIVED",
          entity: "task",
          entityId: taskId,
          timestamp: nowIso(),
        },
        ...s.auditLog,
      ],
    }));
  },

  resolveTask: (taskId, outcome = "resolved") => {
    const state = get();
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;

    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, state: outcome, resolvedAt: nowIso() } : t)),
      volunteers: s.volunteers.map((v) =>
        v.id === task.assigneeId ? { ...v, availability: "available", activeTaskId: undefined } : v
      ),
      incidents: s.incidents.map((i) => {
        if (i.id !== task.incidentId) return i;
        const updated = { ...i, status: outcome, updatedAt: nowIso(), timeline: [...i.timeline] };
        pushTimeline(updated, outcome, outcome === "resolved" ? "Incident resolved" : "Escalated for further response", task.assigneeId);
        return updated;
      }),
      auditLog: [
        {
          id: `ae-${taskId}-${outcome}-${Date.now()}`,
          actor: task.assigneeId,
          action: outcome === "resolved" ? "TASK_RESOLVED" : "TASK_ESCALATED",
          entity: "task",
          entityId: taskId,
          timestamp: nowIso(),
        },
        ...s.auditLog,
      ],
    }));

    const incident = get().incidents.find((i) => i.id === task.incidentId);
    if (incident) recalcZoneRisk(get, set, incident.zoneId);
  },

  setVolunteerAvailability: (volunteerId, availability) => {
    set((s) => ({
      volunteers: s.volunteers.map((v) => (v.id === volunteerId ? { ...v, availability } : v)),
    }));
  },

  enrollVolunteer: (input) => {
    const s = get();
    // next V-### after the highest existing numeric id
    const maxNum = s.volunteers.reduce((m, v) => {
      const n = Number(v.id.replace(/\D/g, ""));
      return Number.isFinite(n) && n > m ? n : m;
    }, 100);
    const id = `V-${maxNum + 1}`;
    const zone = ZONES.find((z) => z.id === input.zoneId) ?? ZONES[0];
    const volunteer: Volunteer = {
      id,
      name: input.name.trim() || id,
      zoneId: zone.id,
      position: { ...zone.labelPoint },
      availability: "available",
      skills: input.skills,
      languages: input.languages.length ? input.languages : ["mr"],
      shiftStart: input.kind === "general" ? input.shiftStart ?? "10:00" : input.slots?.[0]?.start ?? "",
      shiftEnd: input.kind === "general" ? input.shiftEnd ?? "18:00" : input.slots?.[input.slots.length - 1]?.end ?? "",
      lastSeen: "just now",
      kind: input.kind,
      phone: input.phone?.trim() || undefined,
      slots: input.kind === "professional" ? input.slots ?? [] : undefined,
      enrolledAt: nowIso(),
      enrolledBy: input.enrolledBy ?? "self",
    };
    set((st) => ({
      volunteers: [...st.volunteers, volunteer],
      auditLog: [
        {
          id: `ae-enroll-${id}-${Date.now()}`,
          actor: input.enrolledBy === "management" ? "Control Room" : volunteer.name,
          action: "VOLUNTEER_ENROLLED",
          entity: "volunteer",
          entityId: id,
          timestamp: nowIso(),
          metadata: `${input.kind} · ${zone.shortName}${input.kind === "professional" ? ` · ${volunteer.slots?.length ?? 0} slot(s)` : ""}`,
        },
        ...st.auditLog,
      ],
    }));
    return volunteer;
  },

  startDemo: () => {
    clearDemoTimers();
    get().resetAll();

    const zoneId = "z04";
    const zone = findZone(zoneId)!;

    set(() => ({
      demo: { running: true, completed: false, stepIndex: 0, totalSteps: 6, log: [] },
    }));

    const log = (label: string) => {
      set((s) => ({
        demo: {
          ...s.demo,
          stepIndex: s.demo.stepIndex + 1,
          log: [...s.demo.log, { id: `${Date.now()}-${Math.random()}`, time: nowIso(), label }],
        },
      }));
    };

    const schedule = (delay: number, fn: () => void) => {
      demoTimers.push(setTimeout(fn, delay));
    };

    let t = 0;
    schedule((t += 300), () => {
      const incident = get().submitSOS({
        type: "medical",
        severity: "critical",
        zoneId,
        position: { x: zone.labelPoint.x + 20, y: zone.labelPoint.y - 30 },
        reportedBy: { role: "pilgrim", label: "Pilgrim · Zone 04" },
        summary: "Medical assistance requested near the Ghat 4 steps — elderly pilgrim, breathing difficulty.",
      });
      set((s) => ({ demo: { ...s.demo, activeIncidentId: incident.id } }));
      log(`Pilgrim raised SOS — incident ${incident.code} created`);
    });

    schedule((t += 1600), () => {
      log("Incident triaged — priority CRITICAL");
    });

    schedule((t += 1400), () => {
      const incidentId = get().demo.activeIncidentId!;
      const incident = get().incidents.find((i) => i.id === incidentId);
      const responderId = incident?.assignedVolunteerId;
      const task = get().tasks.find((tk) => tk.incidentId === incidentId);
      if (task) set((s) => ({ demo: { ...s.demo, activeTaskId: task.id } }));
      log(responderId ? `Nearest volunteer identified — ${responderId} notified` : "Escalated — no responder currently available");
    });

    schedule((t += 1800), () => {
      const taskId = get().demo.activeTaskId;
      if (taskId) {
        get().acceptTask(taskId);
        const assignee = get().tasks.find((tk) => tk.id === taskId)?.assigneeId;
        log(`${assignee} accepted the task — en route`);
      }
    });

    schedule((t += 3200), () => {
      const taskId = get().demo.activeTaskId;
      if (taskId) {
        get().arriveTask(taskId);
        const assignee = get().tasks.find((tk) => tk.id === taskId)?.assigneeId;
        log(`${assignee} arrived on site`);
      }
    });

    schedule((t += 2400), () => {
      const taskId = get().demo.activeTaskId;
      if (taskId) {
        get().resolveTask(taskId, "resolved");
        log("Incident resolved — response complete");
      }
      set((s) => ({ demo: { ...s.demo, running: false, completed: true } }));
    });
  },

  resetDemo: () => {
    clearDemoTimers();
    set(() => ({ demo: { running: false, completed: false, stepIndex: 0, totalSteps: 6, log: [] } }));
  },

  resetAll: () => {
    clearDemoTimers();
    set(() => ({
      zones: clone(ZONES),
      facilities: clone(FACILITIES),
      volunteers: clone(VOLUNTEERS),
      incidents: clone(INITIAL_INCIDENTS),
      tasks: [],
      riskSnapshots: clone(RISK_SNAPSHOTS),
      riskHistory: Object.fromEntries(ZONES.map((z) => [z.id, [RISK_SNAPSHOTS[z.id]?.score ?? z.riskScore]])),
      resources: clone(RESOURCES),
      notifications: [],
      auditLog: clone(AUDIT_SEED),
      incidentSeq: 2,
      demo: { running: false, completed: false, stepIndex: 0, totalSteps: 6, log: [] },
      advisories: clone(INITIAL_ADVISORIES),
      foundReports: clone(INITIAL_FOUND_REPORTS),
      messages: [],
      groundReports: [],
      groundReportSeq: 0,
      emergingSignals: [],
      pilgrimFeedback: clone(INITIAL_FEEDBACK),
      familyGroups: [],
      ePasses: [],
    }));
  },
}));

initPersistence(useAppStore);
