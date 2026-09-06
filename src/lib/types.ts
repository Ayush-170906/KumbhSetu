// Core domain model for Kumbh Setu.
// All data flowing through this file is SIMULATED / SYNTHETIC unless explicitly noted otherwise.

export type Role = "pilgrim" | "volunteer" | "management";

export type RiskBand = "green" | "yellow" | "red";

export type DensityLevel = "low" | "moderate" | "high" | "severe";

export type Trend = "up" | "down" | "flat";

export interface ZonePoint {
  x: number;
  y: number;
}

export interface Zone {
  id: string;
  code: string; // e.g. "Z04"
  name: string; // e.g. "Trimbakeshwar Temple Perimeter"
  shortName: string; // e.g. "Ghat 4"
  polygon: ZonePoint[]; // abstract map coordinates, 0-1000 viewBox space
  labelPoint: ZonePoint;
  density: DensityLevel;
  densityPercent: number; // 0-100, capacity utilization
  riskBand: RiskBand;
  riskScore: number; // 0-100
  trend: Trend;
  capacity: number;
  currentOccupancy: number;
}

export type FacilityType =
  | "medical"
  | "water"
  | "toilet"
  | "food"
  | "parking"
  | "help_desk";

export type FacilityStatus = "open" | "limited" | "closed";

export interface Facility {
  id: string;
  type: FacilityType;
  name: string;
  zoneId: string;
  position: ZonePoint;
  status: FacilityStatus;
  load: "low" | "moderate" | "high";
  distanceM?: number; // computed relative to viewer in demo context
}

export type IncidentType =
  | "medical"
  | "lost_person"
  | "crowd_pressure"
  | "security"
  | "facility"
  | "other";

export type IncidentSeverity = "low" | "moderate" | "critical";

export type IncidentStatus =
  | "reported"
  | "triaged"
  | "dispatched"
  | "acknowledged"
  | "responding"
  | "resolved"
  | "escalated"
  | "cancelled";

export interface IncidentTimelineEvent {
  status: IncidentStatus | "created" | "note";
  label: string;
  timestamp: string; // ISO
  actor?: string;
  detail?: string;
}

export interface Incident {
  id: string;
  code: string; // "KS-1042"
  type: IncidentType;
  severity: IncidentSeverity;
  zoneId: string;
  position: ZonePoint;
  createdAt: string;
  updatedAt: string;
  status: IncidentStatus;
  reportedBy: {
    role: Role;
    label: string;
  };
  assignedVolunteerId?: string;
  etaMinutes?: number;
  timeline: IncidentTimelineEvent[];
  summary: string;
  preferredLanguage?: LanguageCode;
  requiredSkill?: string;
  matchQuality?: "skill_and_language" | "skill" | "language" | "nearest";
  photoUrls?: string[];
}

export type LanguageCode = "en" | "hi" | "mr" | "ta";

export type VolunteerAvailability = "available" | "on_task" | "off_duty";

/** How a volunteer commits time. A working professional sets their own dated
 * slots; a general volunteer takes a standing shift. */
export type VolunteerKind = "professional" | "general";

export interface AvailabilitySlot {
  id: string;
  date: string; // ISO yyyy-mm-dd
  start: string; // "14:00"
  end: string; // "18:00"
}

export interface Volunteer {
  id: string; // "V-218"
  name: string;
  zoneId: string;
  position: ZonePoint;
  availability: VolunteerAvailability;
  skills: string[];
  languages: LanguageCode[];
  shiftStart: string;
  shiftEnd: string;
  lastSeen: string;
  activeTaskId?: string;
  /** Enrollment fields (self-registered or added by management). */
  kind?: VolunteerKind;
  phone?: string;
  /** Working-professional volunteers: the specific windows they've committed. */
  slots?: AvailabilitySlot[];
  enrolledAt?: string;
  enrolledBy?: "self" | "management";
}

export type TaskState =
  | "created"
  | "assigned"
  | "accepted"
  | "in_progress"
  | "arrived"
  | "resolved"
  | "escalated"
  | "cancelled";

export interface Task {
  id: string;
  incidentId: string;
  assigneeId: string;
  priority: IncidentSeverity;
  state: TaskState;
  createdAt: string;
  acceptedAt?: string;
  arrivedAt?: string;
  resolvedAt?: string;
}

export interface RiskContributor {
  label: string;
  weightPercent: number;
}

export interface RiskSnapshot {
  zoneId: string;
  score: number;
  band: RiskBand;
  generatedAt: string;
  modelVersion: string;
  confidence: number; // 0-1
  forecastBand?: RiskBand;
  forecastHorizonMinutes?: [number, number];
  contributors: RiskContributor[];
  narrative: string;
}

export interface Resource {
  id: string;
  type: string;
  zoneId: string;
  quantity: number;
  status: "adequate" | "low" | "critical";
}

export type NotificationChannel = "push" | "sms" | "in_app";

export interface Notification {
  id: string;
  recipientRole: Role;
  recipientId?: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  event: string;
  createdAt: string;
  deliveryState: "sent" | "delivered" | "failed" | "queued";
}

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  metadata?: string;
}

export interface SystemStatus {
  mode: "simulation";
  connectivity: "nominal" | "degraded" | "offline";
  lastSyncAt: string;
}

export type AdvisorySeverity = "info" | "advisory" | "warning";

export interface Advisory {
  id: string;
  zoneId: "all" | string;
  severity: AdvisorySeverity;
  message: string;
  issuedBy: string;
  createdAt: string;
  active: boolean;
}

export interface FoundReport {
  id: string;
  code: string;
  zoneId: string;
  description: string;
  createdAt: string;
  status: "open" | "matched" | "closed";
  matchedIncidentId?: string;
}

export interface LostFoundMatch {
  incidentId: string;
  foundReportId: string;
  score: number;
}

export interface ZoneMessage {
  id: string;
  zoneId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  phone?: string;
  /** wristband / tag number written on a child or elder */
  wristband?: string;
  note?: string;
}

/** A pilgrim's travelling group, with a shareable code and a meeting point.
 * Lightweight, device-local in practice — helps reunite a separated group. */
export interface FamilyGroup {
  id: string; // short human code, e.g. "KS-4821"
  name: string;
  createdAt: string;
  meetingPoint?: { zoneId: string; label: string };
  members: FamilyMember[];
}

export type FeedbackCategory =
  | "facilities"
  | "cleanliness"
  | "safety"
  | "crowd"
  | "staff"
  | "app"
  | "other";

/** A pilgrim's rating + note, shown on the Common Operations Board. */
export interface PilgrimFeedback {
  id: string;
  name?: string;
  zoneId?: string;
  rating: number; // 1-5
  category: FeedbackCategory;
  message: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Setu AI Field Companion — ground truth & operational intelligence
// ---------------------------------------------------------------------------

/** What a field observation is about. Broader than IncidentType because most
 * ground observations (water, sanitation, signage) are not incidents yet. */
export type GroundReportCategory =
  | "water"
  | "food"
  | "toilet"
  | "medical"
  | "crowd"
  | "infrastructure"
  | "safety"
  | "lost_person"
  | "accessibility"
  | "other";

/** Ground truth is never confused with verified operational fact (§19). A
 * single volunteer observation starts UNVERIFIED; corroboration from other
 * field reports moves it up the ladder; only an authorised operator VERIFIES. */
export type VerificationStatus =
  | "unverified"
  | "reported"
  | "corroborated"
  | "verified"
  | "resolved"
  | "dismissed";

export type ReportSeverity = "low" | "moderate" | "high";

/** Where a piece of information came from, so the UI can always show it (§24). */
export type EvidenceSource =
  | "volunteer_observation"
  | "pilgrim_request"
  | "resource_data"
  | "sensor"
  | "ai_inference";

export interface GroundReport {
  id: string;
  code: string; // "GR-4012"
  category: GroundReportCategory;
  zoneId: string;
  position?: ZonePoint;
  summary: string; // structured one-liner
  detail?: string; // volunteer's own words
  severity: ReportSeverity;
  estimatedPeopleAffected?: number;
  source: EvidenceSource;
  reportedBy: { role: Role; id?: string; label: string };
  status: VerificationStatus;
  corroborations: number; // how many independent reports back this
  photoUrls?: string[];
  createdAt: string;
  updatedAt: string;
  /** Set once an operator promotes this report into a dispatchable incident. */
  linkedIncidentId?: string;
  /** True while this report is only stored locally and waiting for connectivity. */
  queuedOffline?: boolean;
  /** How confident the AI structuring step was in its own extraction (0-1). */
  aiConfidence?: number;
}

/** Kumbh Pulse decision-support: several weak field signals aggregated into
 * one thing worth a human's attention (§20). Never an automated action. */
export interface EmergingSignal {
  id: string;
  category: GroundReportCategory;
  zoneId: string;
  headline: string;
  confidence: number; // 0-1, from signal count + agreement
  reportIds: string[];
  pilgrimRequestCount: number;
  resourceFlag?: string;
  recommendedAction: string;
  firstSeenAt: string;
  lastUpdatedAt: string;
}
