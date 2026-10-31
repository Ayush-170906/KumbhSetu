import type {
  FieldDutyStatus,
  IdentityVerificationStatus,
  Volunteer,
  VolunteerAvailability,
} from "@/lib/types";
import type {
  Accommodation,
  AccommodationAssignment,
  AttendanceKind,
  AttendanceMethod,
  AttendanceRecord,
  AttendanceStatus,
  Deployment,
  DeploymentStatus,
  FieldActivity,
  FieldActivityType,
  IdentityVerificationEvent,
  MealAllocation,
  MealDistributionStatus,
  Ngo,
  NgoStatus,
  RosterAssignment,
  SavedVolunteerFilter,
  TrainingEnrollment,
  TrainingSession,
  VolunteerDirectoryQuery,
  VolunteerRegistrationInput,
} from "@/lib/volunteerTypes";
import {
  generateRosterPreview,
  inputToVolunteerPatch,
  isAgeEligible,
  lifecycleFor,
  nextVolunteerId,
  setRestrictedVolunteerNotes,
  timesOverlap,
} from "@/lib/volunteerOps";
import { volunteerOpsSeed } from "@/lib/volunteerSeed";
import { ZONES } from "@/lib/seed";

function nowIso() {
  return new Date().toISOString();
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function audit(actor: string, action: string, entity: string, entityId: string, metadata?: string) {
  return {
    id: `ae-${entityId}-${action}-${Date.now()}`,
    actor,
    action,
    entity,
    entityId,
    timestamp: nowIso(),
    metadata,
  };
}

export interface VolunteerOpsState {
  ngos: Ngo[];
  trainingSessions: TrainingSession[];
  trainingEnrollments: TrainingEnrollment[];
  deployments: Deployment[];
  rosterAssignments: RosterAssignment[];
  attendanceRecords: AttendanceRecord[];
  mealAllocations: MealAllocation[];
  accommodations: Accommodation[];
  accommodationAssignments: AccommodationAssignment[];
  fieldActivities: FieldActivity[];
  identityEvents: IdentityVerificationEvent[];
  savedVolunteerFilters: SavedVolunteerFilter[];
  volunteerSeq: number;

  upsertNgo: (input: Omit<Ngo, "id" | "createdAt" | "updatedAt" | "status"> & { id?: string; status?: NgoStatus }) => Ngo;
  setNgoStatus: (ngoId: string, status: NgoStatus, rejectionReason?: string) => void;
  registerVolunteerProfile: (input: VolunteerRegistrationInput) => Volunteer | { error: string };
  updateVolunteerProfile: (volunteerId: string, patch: Partial<Volunteer>) => void;
  bulkImportVolunteers: (inputs: VolunteerRegistrationInput[]) => { created: Volunteer[]; skipped: string[] };
  recordIdentityConsent: (volunteerId: string) => void;
  setIdentityVerification: (volunteerId: string, status: IdentityVerificationStatus, actor: string, note?: string) => void;
  createTrainingSession: (input: Omit<TrainingSession, "id" | "createdAt" | "lifecycle"> & { lifecycle?: TrainingSession["lifecycle"] }) => TrainingSession;
  updateTrainingSession: (sessionId: string, patch: Partial<TrainingSession>) => void;
  enrollInTraining: (sessionId: string, volunteerId: string) => { ok: boolean; error?: string };
  enrollNgoInTraining: (sessionId: string, ngoId: string) => { enrolled: number; skipped: number };
  markTrainingAttendance: (sessionId: string, volunteerId: string, present: boolean) => void;
  completeTraining: (sessionId: string, volunteerId: string, score?: number) => void;
  createDeployment: (input: Omit<Deployment, "id" | "createdAt" | "status"> & { status?: DeploymentStatus }) => Deployment;
  generateRoster: (deploymentId: string) => { ok: boolean; unfilled: number; error?: string };
  adjustAssignment: (deploymentId: string, fromVolunteerId: string | null, toVolunteerId: string, reason: string) => { ok: boolean; error?: string };
  setDeploymentStatus: (deploymentId: string, status: DeploymentStatus) => void;
  markAttendance: (input: {
    volunteerId: string;
    kind: AttendanceKind;
    sessionId: string;
    date: string;
    status: AttendanceStatus;
    markedBy: string;
    method: AttendanceMethod;
  }) => { ok: boolean; error?: string };
  correctAttendance: (recordId: string, status: AttendanceStatus, by: string, reason: string) => void;
  checkInVolunteer: (volunteerId: string, method: AttendanceMethod, markedBy: string, sessionId?: string) => { ok: boolean; error?: string };
  checkOutVolunteer: (volunteerId: string, markedBy: string) => void;
  allocateMeal: (input: Omit<MealAllocation, "id">) => void;
  markMealDistributed: (mealId: string, status: MealDistributionStatus) => void;
  upsertAccommodation: (input: Omit<Accommodation, "id"> & { id?: string }) => Accommodation;
  assignBed: (accommodationId: string, volunteerId: string, bedLabel: string) => { ok: boolean; error?: string };
  accommodationCheck: (assignmentId: string, action: "in" | "out") => void;
  recordFieldActivity: (volunteerId: string, type: FieldActivityType, note?: string, incidentId?: string) => void;
  setFieldDutyStatus: (volunteerId: string, status: FieldDutyStatus) => void;
  saveVolunteerFilter: (name: string, query: VolunteerDirectoryQuery) => void;
  deleteSavedFilter: (id: string) => void;
  reseedVolunteerDemoData: () => void;
  clearDemoVolunteers: () => void;
  advanceDemoLifecycle: (volunteerId: string) => { ok: boolean; nextStage: string; message: string };
}

export type VolunteerHostState = VolunteerOpsState & {
  volunteers: Volunteer[];
  auditLog: { id: string; actor: string; action: string; entity: string; entityId: string; timestamp: string; metadata?: string }[];
  setVolunteerAvailability: (volunteerId: string, availability: VolunteerAvailability) => void;
  createIncident: (input: {
    type: "other";
    severity: "moderate";
    zoneId: string;
    reportedBy: { role: "volunteer"; label: string };
    summary: string;
  }) => { id: string };
};

type SetFn = (updater: (s: VolunteerHostState) => Partial<VolunteerHostState>) => void;
type GetFn = () => VolunteerHostState;

export function volunteerOpsDefaults() {
  const seed = volunteerOpsSeed();
  return clone(seed);
}

export function createVolunteerOps(set: SetFn, get: GetFn): VolunteerOpsState {
  const defaults = volunteerOpsDefaults();
  return {
    ngos: defaults.ngos,
    trainingSessions: defaults.trainingSessions,
    trainingEnrollments: defaults.trainingEnrollments,
    deployments: defaults.deployments,
    rosterAssignments: defaults.rosterAssignments,
    attendanceRecords: defaults.attendanceRecords,
    mealAllocations: defaults.mealAllocations,
    accommodations: defaults.accommodations,
    accommodationAssignments: defaults.accommodationAssignments,
    fieldActivities: defaults.fieldActivities,
    identityEvents: defaults.identityEvents,
    savedVolunteerFilters: defaults.savedVolunteerFilters,
    volunteerSeq: defaults.volunteerSeq,

    upsertNgo: (input) => {
      const existing = input.id ? get().ngos.find((n) => n.id === input.id) : undefined;
      const ngo: Ngo = existing
        ? { ...existing, ...input, updatedAt: nowIso() }
        : {
            ...input,
            id: input.id ?? `ngo-${Date.now()}`,
            status: input.status ?? "draft",
            createdAt: nowIso(),
            updatedAt: nowIso(),
          };
      set((s) => ({
        ngos: existing ? s.ngos.map((n) => (n.id === ngo.id ? ngo : n)) : [ngo, ...s.ngos],
        auditLog: [audit("Control Room", existing ? "NGO_UPDATED" : "NGO_CREATED", "ngo", ngo.id, ngo.name), ...s.auditLog],
      }));
      return ngo;
    },

    setNgoStatus: (ngoId, status, rejectionReason) => {
      set((s) => ({
        ngos: s.ngos.map((n) =>
          n.id === ngoId ? { ...n, status, rejectionReason: status === "rejected" ? rejectionReason : undefined, updatedAt: nowIso() } : n
        ),
        auditLog: [audit("Control Room", `NGO_${status.toUpperCase()}`, "ngo", ngoId, rejectionReason), ...s.auditLog],
      }));
    },

    registerVolunteerProfile: (input) => {
      if (input.yearOfBirth && !isAgeEligible(input.yearOfBirth)) {
        return { error: "Volunteer must be at least 18 years old under the configured policy." };
      }
      if (input.name.trim().length < 2) return { error: "Full name is required." };
      const s = get();
      const id = nextVolunteerId(s.volunteers);
      const zone = ZONES.find((z) => z.id === input.zoneId) ?? ZONES[0];
      const volunteer: Volunteer = {
        id,
        zoneId: zone.id,
        position: { ...zone.labelPoint },
        availability: "available",
        shiftStart: input.shiftStart ?? "10:00",
        shiftEnd: input.shiftEnd ?? "18:00",
        lastSeen: "just now",
        enrolledAt: nowIso(),
        ...inputToVolunteerPatch(input),
        name: input.name.trim(),
        skills: input.skills,
        languages: input.languages.length ? input.languages : ["mr"],
      };
      if (input.accommodationsNote || input.emergencyContactPhone) {
        setRestrictedVolunteerNotes(id, {
          accommodationsNote: input.accommodationsNote,
          emergencyContactPhone: input.emergencyContactPhone,
        });
      }
      const event: IdentityVerificationEvent | undefined = input.identityConsent
        ? {
            id: `ve-${id}-consent`,
            volunteerId: id,
            status: "consent_pending",
            at: nowIso(),
            actor: volunteer.name,
            note: "Informed consent recorded for manual identity review. No Aadhaar number collected.",
          }
        : undefined;
      set((st) => ({
        volunteers: [...st.volunteers, volunteer],
        identityEvents: event ? [event, ...st.identityEvents] : st.identityEvents,
        auditLog: [audit(input.enrolledBy === "self" ? volunteer.name : "Control Room", "VOLUNTEER_REGISTERED", "volunteer", id, input.enrolledBy), ...st.auditLog],
      }));
      return volunteer;
    },

    updateVolunteerProfile: (volunteerId, patch) => {
      const sensitive = patch as { accommodationsNote?: string; emergencyContactPhone?: string };
      if (sensitive.accommodationsNote || sensitive.emergencyContactPhone) {
        setRestrictedVolunteerNotes(volunteerId, {
          accommodationsNote: sensitive.accommodationsNote,
          emergencyContactPhone: sensitive.emergencyContactPhone,
        });
      }
      const safe = { ...patch } as Partial<Volunteer> & {
        accommodationsNote?: string;
        emergencyContactPhone?: string;
      };
      delete safe.accommodationsNote;
      delete safe.emergencyContactPhone;
      set((s) => ({
        volunteers: s.volunteers.map((v) => (v.id === volunteerId ? { ...v, ...safe } : v)),
      }));
    },

    bulkImportVolunteers: (inputs) => {
      const created: Volunteer[] = [];
      const skipped: string[] = [];
      for (const input of inputs) {
        const result = get().registerVolunteerProfile(input);
        if ("error" in result) skipped.push(`${input.name}: ${result.error}`);
        else created.push(result);
      }
      return { created, skipped };
    },

    recordIdentityConsent: (volunteerId) => {
      set((s) => ({
        volunteers: s.volunteers.map((v) =>
          v.id === volunteerId
            ? { ...v, identityConsentAt: nowIso(), identityVerificationStatus: "consent_pending", identityMethod: "manual_document_review" }
            : v
        ),
        identityEvents: [
          {
            id: `ve-${volunteerId}-${Date.now()}`,
            volunteerId,
            status: "consent_pending",
            at: nowIso(),
            actor: volunteerId,
            note: "Consent recorded for manual identity review. Live Aadhaar verification is not configured.",
          },
          ...s.identityEvents,
        ],
      }));
    },

    setIdentityVerification: (volunteerId, status, actor, note) => {
      const reference = status === "verified" ? `VR-${volunteerId.replace(/\D/g, "")}-MAN` : undefined;
      set((s) => ({
        volunteers: s.volunteers.map((v) =>
          v.id === volunteerId
            ? { ...v, identityVerificationStatus: status, identityVerificationRef: reference ?? v.identityVerificationRef, identityMethod: "manual_document_review" }
            : v
        ),
        identityEvents: [
          { id: `ve-${volunteerId}-${Date.now()}`, volunteerId, status, at: nowIso(), actor, note, reference },
          ...s.identityEvents,
        ],
        auditLog: [audit(actor, `IDENTITY_${status.toUpperCase()}`, "volunteer", volunteerId, note), ...s.auditLog],
      }));
    },

    createTrainingSession: (input) => {
      const session: TrainingSession = {
        ...input,
        id: `tr-${Date.now()}`,
        createdAt: nowIso(),
        lifecycle: input.lifecycle ?? "created",
      };
      set((s) => ({
        trainingSessions: [session, ...s.trainingSessions],
        auditLog: [audit("Control Room", "TRAINING_CREATED", "training", session.id, session.title), ...s.auditLog],
      }));
      return session;
    },

    updateTrainingSession: (sessionId, patch) => {
      set((s) => ({
        trainingSessions: s.trainingSessions.map((t) => (t.id === sessionId ? { ...t, ...patch } : t)),
      }));
    },

    enrollInTraining: (sessionId, volunteerId) => {
      const s = get();
      const session = s.trainingSessions.find((t) => t.id === sessionId);
      if (!session) return { ok: false, error: "Training session not found." };
      if (s.trainingEnrollments.some((e) => e.sessionId === sessionId && e.volunteerId === volunteerId)) {
        return { ok: false, error: "Already enrolled." };
      }
      const count = s.trainingEnrollments.filter((e) => e.sessionId === sessionId).length;
      if (count >= session.capacity) return { ok: false, error: "Session is at capacity." };
      const enrollment: TrainingEnrollment = {
        id: `te-${Date.now()}-${volunteerId}`,
        sessionId,
        volunteerId,
        status: "enrolled",
        enrolledAt: nowIso(),
      };
      set((st) => ({
        trainingEnrollments: [...st.trainingEnrollments, enrollment],
        trainingSessions: st.trainingSessions.map((t) =>
          t.id === sessionId && t.lifecycle === "created" ? { ...t, lifecycle: "enrollment" } : t
        ),
      }));
      return { ok: true };
    },

    enrollNgoInTraining: (sessionId, ngoId) => {
      const members = get().volunteers.filter((v) => v.ngoId === ngoId);
      let enrolled = 0;
      let skipped = 0;
      for (const volunteer of members) {
        const result = get().enrollInTraining(sessionId, volunteer.id);
        if (result.ok) enrolled += 1;
        else skipped += 1;
      }
      return { enrolled, skipped };
    },

    markTrainingAttendance: (sessionId, volunteerId, present) => {
      set((s) => ({
        trainingEnrollments: s.trainingEnrollments.map((e) =>
          e.sessionId === sessionId && e.volunteerId === volunteerId
            ? { ...e, status: present ? "attended" : "incomplete", attendedAt: present ? nowIso() : e.attendedAt }
            : e
        ),
        trainingSessions: s.trainingSessions.map((t) => (t.id === sessionId ? { ...t, lifecycle: "in_progress" } : t)),
      }));
    },

    completeTraining: (sessionId, volunteerId, score) => {
      const enrollment = get().trainingEnrollments.find((e) => e.sessionId === sessionId && e.volunteerId === volunteerId);
      if (!enrollment || (enrollment.status !== "attended" && enrollment.status !== "completed")) return;
      set((s) => ({
        trainingEnrollments: s.trainingEnrollments.map((e) =>
          e.id === enrollment.id
            ? { ...e, status: "completed", completedAt: nowIso(), assessmentScore: score, certificateIssued: true }
            : e
        ),
      }));
    },

    createDeployment: (input) => {
      const deployment: Deployment = {
        ...input,
        id: `dep-${Date.now()}`,
        createdAt: nowIso(),
        status: input.status ?? "draft",
      };
      set((s) => ({
        deployments: [deployment, ...s.deployments],
        auditLog: [audit("Control Room", "DEPLOYMENT_CREATED", "deployment", deployment.id, deployment.name), ...s.auditLog],
      }));
      return deployment;
    },

    generateRoster: (deploymentId) => {
      const s = get();
      const deployment = s.deployments.find((d) => d.id === deploymentId);
      if (!deployment) return { ok: false, unfilled: 0, error: "Deployment not found." };
      const preview = generateRosterPreview(deployment, s.volunteers, s.rosterAssignments, s.deployments, s.trainingEnrollments);
      const remainingSlots = s.rosterAssignments.filter((a) => a.deploymentId === deploymentId);
      const nextIndex = remainingSlots.length;
      const assignments: RosterAssignment[] = preview.selected.map((volunteer, idx) => ({
        id: `ra-${Date.now()}-${volunteer.id}`,
        deploymentId,
        volunteerId: volunteer.id,
        slotIndex: nextIndex + idx,
        assignedAt: nowIso(),
        assignedBy: "roster-generator",
      }));
      set((st) => ({
        rosterAssignments: [...st.rosterAssignments, ...assignments],
        deployments: st.deployments.map((d) => (d.id === deploymentId ? { ...d, status: "generated" } : d)),
        volunteers: st.volunteers.map((v) =>
          assignments.some((a) => a.volunteerId === v.id) && (v.fieldDutyStatus === "not_deployed" || !v.fieldDutyStatus)
            ? { ...v, fieldDutyStatus: "assigned", supervisorName: deployment.supervisor, reportingPoint: deployment.location, sector: deployment.sector, zoneId: deployment.zoneId }
            : v
        ),
        auditLog: [audit("Control Room", "ROSTER_GENERATED", "deployment", deploymentId, `${assignments.length} assigned · ${preview.unfilled} unfilled`), ...st.auditLog],
      }));
      return { ok: true, unfilled: preview.unfilled };
    },

    adjustAssignment: (deploymentId, fromVolunteerId, toVolunteerId, reason) => {
      const s = get();
      const deployment = s.deployments.find((d) => d.id === deploymentId);
      if (!deployment) return { ok: false, error: "Deployment not found." };
      const target = s.volunteers.find((v) => v.id === toVolunteerId);
      if (!target) return { ok: false, error: "Volunteer not found." };
      if (deployment.requireVerified && target.identityVerificationStatus !== "verified") {
        return { ok: false, error: "Cannot assign an unverified volunteer on this deployment." };
      }
      const conflict = s.rosterAssignments.find((a) => {
        if (a.volunteerId !== toVolunteerId) return false;
        const other = s.deployments.find((d) => d.id === a.deploymentId);
        return other && other.date === deployment.date && timesOverlap(other.startTime, other.endTime, deployment.startTime, deployment.endTime);
      });
      if (conflict) return { ok: false, error: "That volunteer already has a conflicting shift." };
      if (s.rosterAssignments.some((a) => a.deploymentId === deploymentId && a.volunteerId === toVolunteerId)) {
        return { ok: false, error: "Volunteer is already on this roster." };
      }
      set((st) => {
        let rosterAssignments = st.rosterAssignments;
        if (fromVolunteerId) {
          rosterAssignments = rosterAssignments.map((a) =>
            a.deploymentId === deploymentId && a.volunteerId === fromVolunteerId
              ? { ...a, volunteerId: toVolunteerId, previousVolunteerId: fromVolunteerId, reassignmentReason: reason, assignedAt: nowIso(), assignedBy: "Control Room" }
              : a
          );
        } else {
          rosterAssignments = [
            ...rosterAssignments,
            {
              id: `ra-${Date.now()}-${toVolunteerId}`,
              deploymentId,
              volunteerId: toVolunteerId,
              slotIndex: rosterAssignments.filter((a) => a.deploymentId === deploymentId).length,
              assignedAt: nowIso(),
              assignedBy: "Control Room",
              reassignmentReason: reason,
            },
          ];
        }
        return {
          rosterAssignments,
          volunteers: st.volunteers.map((v) => {
            if (v.id === toVolunteerId) {
              return { ...v, fieldDutyStatus: v.fieldDutyStatus === "not_deployed" || !v.fieldDutyStatus ? "assigned" : v.fieldDutyStatus, supervisorName: deployment.supervisor, reportingPoint: deployment.location, sector: deployment.sector };
            }
            if (fromVolunteerId && v.id === fromVolunteerId) {
              const stillAssigned = rosterAssignments.some((a) => a.volunteerId === v.id);
              return stillAssigned ? v : { ...v, fieldDutyStatus: "not_deployed" };
            }
            return v;
          }),
          auditLog: [audit("Control Room", "ROSTER_ADJUSTED", "deployment", deploymentId, reason), ...st.auditLog],
        };
      });
      return { ok: true };
    },

    setDeploymentStatus: (deploymentId, status) => {
      set((s) => ({
        deployments: s.deployments.map((d) => (d.id === deploymentId ? { ...d, status } : d)),
        volunteers: status === "published" || status === "active"
          ? s.volunteers.map((v) => {
              const on = s.rosterAssignments.some((a) => a.deploymentId === deploymentId && a.volunteerId === v.id);
              if (!on) return v;
              if (status === "published" && (v.fieldDutyStatus === "assigned" || v.fieldDutyStatus === "not_deployed")) {
                return { ...v, fieldDutyStatus: "awaiting_checkin" };
              }
              return v;
            })
          : s.volunteers,
        auditLog: [audit("Control Room", `DEPLOYMENT_${status.toUpperCase()}`, "deployment", deploymentId), ...s.auditLog],
      }));
    },

    markAttendance: (input) => {
      const exists = get().attendanceRecords.find(
        (r) => r.volunteerId === input.volunteerId && r.sessionId === input.sessionId && r.date === input.date && r.kind === input.kind && r.status !== "absent"
      );
      if (exists && input.status !== "absent") {
        return { ok: false, error: "Attendance already recorded for this volunteer, session and date." };
      }
      const record: AttendanceRecord = {
        id: `att-${Date.now()}-${input.volunteerId}`,
        ...input,
        markedAt: nowIso(),
        checkInAt: input.status === "present" || input.status === "late" ? nowIso() : undefined,
        corrections: [],
      };
      set((s) => ({
        attendanceRecords: [record, ...s.attendanceRecords],
        volunteers: s.volunteers.map((v) =>
          v.id === input.volunteerId && input.status === "absent" ? { ...v, fieldDutyStatus: "absent" } : v
        ),
      }));
      return { ok: true };
    },

    correctAttendance: (recordId, status, by, reason) => {
      if (!reason.trim()) return;
      set((s) => ({
        attendanceRecords: s.attendanceRecords.map((r) =>
          r.id === recordId
            ? {
                ...r,
                status,
                corrections: [...r.corrections, { at: nowIso(), by, from: r.status, to: status, reason: reason.trim() }],
              }
            : r
        ),
      }));
    },

    checkInVolunteer: (volunteerId, method, markedBy, sessionId = "duty") => {
      const today = nowIso().slice(0, 10);
      const result = get().markAttendance({
        volunteerId,
        kind: "shift",
        sessionId,
        date: today,
        status: "present",
        markedBy,
        method,
      });
      if (!result.ok) return result;
      set((s) => ({
        volunteers: s.volunteers.map((v) =>
          v.id === volunteerId ? { ...v, fieldDutyStatus: "checked_in", lastSeen: "just now" } : v
        ),
        fieldActivities: [
          { id: `fa-${Date.now()}`, volunteerId, type: "check_in", at: nowIso(), deploymentId: sessionId !== "duty" ? sessionId : undefined },
          ...s.fieldActivities,
        ],
      }));
      return { ok: true };
    },

    checkOutVolunteer: (volunteerId, markedBy) => {
      const today = nowIso().slice(0, 10);
      set((s) => ({
        attendanceRecords: s.attendanceRecords.map((r) =>
          r.volunteerId === volunteerId && r.date === today && !r.checkOutAt ? { ...r, checkOutAt: nowIso() } : r
        ),
        volunteers: s.volunteers.map((v) => (v.id === volunteerId ? { ...v, fieldDutyStatus: "shift_complete" } : v)),
        fieldActivities: [{ id: `fa-${Date.now()}`, volunteerId, type: "complete_shift", at: nowIso(), note: `Marked by ${markedBy}` }, ...s.fieldActivities],
      }));
    },

    allocateMeal: (input) => {
      set((s) => ({
        mealAllocations: [{ id: `ml-${Date.now()}`, ...input }, ...s.mealAllocations],
      }));
    },

    markMealDistributed: (mealId, status) => {
      set((s) => ({
        mealAllocations: s.mealAllocations.map((m) => (m.id === mealId ? { ...m, status } : m)),
      }));
    },

    upsertAccommodation: (input) => {
      const acc: Accommodation = { ...input, id: input.id ?? `ac-${Date.now()}` };
      set((s) => ({
        accommodations: s.accommodations.some((a) => a.id === acc.id)
          ? s.accommodations.map((a) => (a.id === acc.id ? acc : a))
          : [acc, ...s.accommodations],
      }));
      return acc;
    },

    assignBed: (accommodationId, volunteerId, bedLabel) => {
      const acc = get().accommodations.find((a) => a.id === accommodationId);
      if (!acc) return { ok: false, error: "Accommodation not found." };
      const used = get().accommodationAssignments.filter((a) => a.accommodationId === accommodationId && !a.checkOutAt).length;
      if (used >= acc.capacity) return { ok: false, error: "No beds remaining." };
      if (get().accommodationAssignments.some((a) => a.volunteerId === volunteerId && !a.checkOutAt)) {
        return { ok: false, error: "Volunteer already has an open bed assignment." };
      }
      set((s) => ({
        accommodationAssignments: [
          { id: `bed-${Date.now()}`, accommodationId, volunteerId, bedLabel },
          ...s.accommodationAssignments,
        ],
      }));
      return { ok: true };
    },

    accommodationCheck: (assignmentId, action) => {
      set((s) => ({
        accommodationAssignments: s.accommodationAssignments.map((a) =>
          a.id === assignmentId
            ? { ...a, checkInAt: action === "in" ? nowIso() : a.checkInAt, checkOutAt: action === "out" ? nowIso() : a.checkOutAt }
            : a
        ),
      }));
    },

    recordFieldActivity: (volunteerId, type, note, incidentId) => {
      let linkedIncidentId = incidentId;
      if (type === "incident_report" && !incidentId) {
        const volunteer = get().volunteers.find((v) => v.id === volunteerId);
        const incident = get().createIncident({
          type: "other",
          severity: "moderate",
          zoneId: volunteer?.zoneId ?? "z01",
          reportedBy: { role: "volunteer", label: `${volunteer?.name ?? "Volunteer"} · ${volunteerId}` },
          summary: note?.trim() || "Field incident reported from volunteer operations.",
        });
        linkedIncidentId = incident.id;
      }
      if (type === "start_duty") {
        get().setVolunteerAvailability(volunteerId, "available");
        set((s) => ({
          volunteers: s.volunteers.map((v) => (v.id === volunteerId ? { ...v, fieldDutyStatus: "on_duty" } : v)),
        }));
      }
      if (type === "assistance_request") {
        set((s) => ({
          volunteers: s.volunteers.map((v) => (v.id === volunteerId ? { ...v, fieldDutyStatus: "needs_assistance" } : v)),
        }));
      }
      if (type === "complete_shift") {
        get().checkOutVolunteer(volunteerId, volunteerId);
      }
      set((s) => ({
        fieldActivities: [
          { id: `fa-${Date.now()}`, volunteerId, type, at: nowIso(), note, incidentId: linkedIncidentId },
          ...s.fieldActivities,
        ],
      }));
    },

    setFieldDutyStatus: (volunteerId, status) => {
      set((s) => ({
        volunteers: s.volunteers.map((v) => (v.id === volunteerId ? { ...v, fieldDutyStatus: status } : v)),
      }));
    },

    saveVolunteerFilter: (name, query) => {
      set((s) => ({
        savedVolunteerFilters: [{ id: `sf-${Date.now()}`, name, query }, ...s.savedVolunteerFilters],
      }));
    },

    deleteSavedFilter: (id) => {
      set((s) => ({
        savedVolunteerFilters: s.savedVolunteerFilters.filter((f) => f.id !== id),
      }));
    },

    reseedVolunteerDemoData: () => {
      const seed = volunteerOpsSeed();
      set(() => ({
        volunteers: seed.volunteers,
        ngos: seed.ngos,
        trainingSessions: seed.trainingSessions,
        trainingEnrollments: seed.trainingEnrollments,
        deployments: seed.deployments,
        rosterAssignments: seed.rosterAssignments,
        attendanceRecords: seed.attendanceRecords,
        mealAllocations: seed.mealAllocations,
        accommodations: seed.accommodations,
        accommodationAssignments: seed.accommodationAssignments,
        fieldActivities: seed.fieldActivities,
        identityEvents: seed.identityEvents,
        savedVolunteerFilters: seed.savedVolunteerFilters,
        volunteerSeq: seed.volunteerSeq,
      }));
    },

    clearDemoVolunteers: () => {
      set((s) => ({
        volunteers: s.volunteers.filter((v) => !v.isSyntheticDemo),
        rosterAssignments: s.rosterAssignments.filter((a) => !a.id.includes("demo")),
        trainingEnrollments: s.trainingEnrollments.filter((e) => !e.id.includes("demo")),
        attendanceRecords: s.attendanceRecords.filter((att) => !att.id.includes("demo")),
        mealAllocations: s.mealAllocations.filter((m) => !m.id.includes("demo")),
        accommodationAssignments: s.accommodationAssignments.filter((b) => !b.id.includes("demo")),
        fieldActivities: s.fieldActivities.filter((fa) => !fa.id.includes("demo")),
        identityEvents: s.identityEvents.filter((ie) => !ie.id.includes("demo")),
      }));
    },

    advanceDemoLifecycle: (volunteerId: string) => {
      const v = get().volunteers.find((vol) => vol.id === volunteerId);
      if (!v) return { ok: false, nextStage: "not_found", message: "Volunteer not found" };

      const enrollments = get().trainingEnrollments;
      const assignments = get().rosterAssignments;
      const deployments = get().deployments;
      const stage = lifecycleFor(v, enrollments, assignments, deployments);

      if (stage === "registered") {
        get().setIdentityVerification(volunteerId, "verified", "Lifecycle Demo Controller", "Physical document verified");
        return { ok: true, nextStage: "verified", message: `${v.name} identity document verified by desk review.` };
      }

      if (stage === "verified") {
        const session = get().trainingSessions[0];
        if (session) {
          get().enrollInTraining(session.id, volunteerId);
          get().completeTraining(session.id, volunteerId, 94);
          return { ok: true, nextStage: "trained", message: `${v.name} completed ${session.title} (Score: 94%).` };
        }
      }

      if (stage === "trained") {
        const dep = get().deployments.find((d) => d.zoneId === v.zoneId) || get().deployments[0];
        if (dep) {
          const currentCount = get().rosterAssignments.filter((a) => a.deploymentId === dep.id).length;
          const newAssignment = {
            id: `ra-demo-${Date.now()}`,
            deploymentId: dep.id,
            volunteerId,
            slotIndex: currentCount + 1,
            assignedAt: nowIso(),
            assignedBy: "Lifecycle Demo Controller",
          };
          set((st) => ({
            rosterAssignments: [...st.rosterAssignments, newAssignment],
            volunteers: st.volunteers.map((vol) => (vol.id === volunteerId ? { ...vol, fieldDutyStatus: "assigned" } : vol)),
          }));
          return { ok: true, nextStage: "rostered", message: `${v.name} rostered to ${dep.name}.` };
        }
      }

      if (stage === "rostered") {
        get().checkInVolunteer(volunteerId, "qr", "Shift Supervisor");
        get().setFieldDutyStatus(volunteerId, "on_duty");
        get().recordFieldActivity(volunteerId, "start_duty", "Checked in at sector post; active on ground.");
        get().allocateMeal({
          volunteerId,
          date: new Date().toISOString().slice(0, 10),
          meal: "lunch",
          location: "Central Volunteer Langar #1",
          shift: "morning",
          entitled: true,
          status: "issued",
        });
        return { ok: true, nextStage: "on_field", message: `${v.name} checked in on field! Lunch voucher issued.` };
      }

      if (stage === "deployed" || stage === "on_field") {
        get().checkOutVolunteer(volunteerId, "Shift Supervisor");
        get().setFieldDutyStatus(volunteerId, "shift_complete");
        get().recordFieldActivity(volunteerId, "complete_shift", "Shift ended cleanly; sector log handed over.");
        return { ok: true, nextStage: "completed", message: `${v.name} completed duty shift and checked out.` };
      }

      return { ok: true, nextStage: "completed", message: `${v.name} has completed the entire lifecycle!` };
    },
  };
}
