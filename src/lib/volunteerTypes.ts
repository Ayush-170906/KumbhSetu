import type {
  FieldDutyStatus,
  IdentityVerificationStatus,
  LanguageCode,
  VolunteerAvailabilityWindow,
  VolunteerCategory,
  VolunteerGender,
} from "./types";

export type NgoStatus = "draft" | "submitted" | "under_verification" | "approved" | "rejected";

export interface Ngo {
  id: string;
  name: string;
  registrationId: string;
  authorizedRepresentative: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  state: string;
  district: string;
  volunteerCountDeclared: number;
  areasOfOperation: string[];
  documentsOnFile: boolean;
  status: NgoStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type TrainingMode = "online" | "offline" | "hybrid";
export type TrainingCategory =
  | "crowd_management"
  | "emergency_response"
  | "first_aid"
  | "missing_person"
  | "communication"
  | "volunteer_safety"
  | "kumbh_orientation";
export type TrainingLifecycle = "created" | "scheduled" | "enrollment" | "in_progress" | "completed";
export type TrainingVolunteerStatus = "not_enrolled" | "enrolled" | "attended" | "completed" | "incomplete";

export interface TrainingSession {
  id: string;
  title: string;
  description: string;
  category: TrainingCategory;
  mode: TrainingMode;
  trainer: string;
  venueOrLink: string;
  startAt: string;
  endAt: string;
  capacity: number;
  attendanceRequired: boolean;
  completionCriteria: string;
  lifecycle: TrainingLifecycle;
  createdAt: string;
}

export interface TrainingEnrollment {
  id: string;
  sessionId: string;
  volunteerId: string;
  status: Exclude<TrainingVolunteerStatus, "not_enrolled">;
  enrolledAt: string;
  attendedAt?: string;
  completedAt?: string;
  assessmentScore?: number;
  certificateIssued?: boolean;
}

export type DeploymentStatus = "draft" | "generated" | "approved" | "published" | "active" | "completed";
export type DeploymentShift = "morning" | "afternoon" | "night";
export type DeploymentPriority = "low" | "normal" | "high";

export interface Deployment {
  id: string;
  name: string;
  location: string;
  zoneId: string;
  sector: string;
  dutyCategory: VolunteerCategory;
  shift: DeploymentShift;
  date: string;
  startTime: string;
  endTime: string;
  requiredCount: number;
  skillsRequired: string[];
  languagesPreferred: LanguageCode[];
  supervisor: string;
  priority: DeploymentPriority;
  status: DeploymentStatus;
  requireVerified: boolean;
  requireTrained: boolean;
  createdAt: string;
}

export interface RosterAssignment {
  id: string;
  deploymentId: string;
  volunteerId: string;
  slotIndex: number;
  assignedAt: string;
  assignedBy: string;
  reassignmentReason?: string;
  previousVolunteerId?: string;
}

export type AttendanceKind = "daily" | "shift" | "training" | "deployment";
export type AttendanceStatus = "present" | "late" | "early_departure" | "absent" | "leave";
export type AttendanceMethod = "manual" | "qr" | "supervisor";

export interface AttendanceCorrection {
  at: string;
  by: string;
  from: AttendanceStatus;
  to: AttendanceStatus;
  reason: string;
}

export interface AttendanceRecord {
  id: string;
  volunteerId: string;
  kind: AttendanceKind;
  sessionId: string;
  date: string;
  markedAt: string;
  status: AttendanceStatus;
  markedBy: string;
  method: AttendanceMethod;
  checkInAt?: string;
  checkOutAt?: string;
  corrections: AttendanceCorrection[];
}

export type MealType = "breakfast" | "lunch" | "dinner";
export type MealDistributionStatus = "entitled" | "issued" | "skipped";

export interface MealAllocation {
  id: string;
  volunteerId: string;
  date: string;
  meal: MealType;
  location: string;
  shift: DeploymentShift;
  entitled: boolean;
  status: MealDistributionStatus;
}

export type AccommodationType = "dormitory" | "shared_room" | "family_room" | "staging_camp";
export type OccupancyStatus = "available" | "partial" | "full";

export interface Accommodation {
  id: string;
  name: string;
  address: string;
  type: AccommodationType;
  zoneId: string;
  capacity: number;
}

export interface AccommodationAssignment {
  id: string;
  accommodationId: string;
  volunteerId: string;
  bedLabel: string;
  checkInAt?: string;
  checkOutAt?: string;
}

export type FieldActivityType =
  | "check_in"
  | "start_duty"
  | "status_update"
  | "field_note"
  | "incident_report"
  | "assistance_request"
  | "complete_shift";

export interface FieldActivity {
  id: string;
  volunteerId: string;
  type: FieldActivityType;
  at: string;
  note?: string;
  incidentId?: string;
  deploymentId?: string;
}

export interface IdentityVerificationEvent {
  id: string;
  volunteerId: string;
  status: IdentityVerificationStatus;
  at: string;
  actor: string;
  note?: string;
  reference?: string;
}

export interface SavedVolunteerFilter {
  id: string;
  name: string;
  query: VolunteerDirectoryQuery;
}

export interface VolunteerDirectoryQuery {
  text?: string;
  ngoId?: string;
  verification?: IdentityVerificationStatus | "all";
  training?: TrainingVolunteerStatus | "all";
  zoneId?: string;
  sector?: string;
  skill?: string;
  language?: LanguageCode | "all";
  availability?: string;
  attendance?: AttendanceStatus | "all";
  fieldStatus?: FieldDutyStatus | "all";
  shift?: string;
  registeredFrom?: string;
}

export interface VolunteerRegistrationInput {
  name: string;
  yearOfBirth?: string;
  gender?: VolunteerGender;
  preferredLanguage: LanguageCode;
  phone?: string;
  email?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  addressLine?: string;
  state?: string;
  district?: string;
  ngoId?: string;
  category: VolunteerCategory;
  skills: string[];
  languages: LanguageCode[];
  experience?: string;
  availabilityWindow: VolunteerAvailabilityWindow;
  preferredArea?: string;
  zoneId: string;
  shiftStart?: string;
  shiftEnd?: string;
  kind?: "professional" | "general";
  hasAccessibilityNeed?: boolean;
  accommodationsNote?: string;
  identityConsent: boolean;
  enrolledBy?: "self" | "management" | "ngo_bulk";
}

export const VOLUNTEER_SKILL_OPTIONS = [
  { id: "first_aid", label: "First aid" },
  { id: "crowd_marshal", label: "Crowd marshalling" },
  { id: "medical_escort", label: "Medical escort" },
  { id: "logistics", label: "Logistics" },
  { id: "translation", label: "Translation help" },
  { id: "lost_found", label: "Missing-person assistance" },
] as const;

export const TRAINING_CATEGORY_LABELS: Record<TrainingCategory, string> = {
  crowd_management: "Crowd management",
  emergency_response: "Emergency response",
  first_aid: "First aid awareness",
  missing_person: "Missing-person assistance",
  communication: "Communication protocols",
  volunteer_safety: "Volunteer safety",
  kumbh_orientation: "Kumbh operations orientation",
};

export const NGO_STATUS_LABELS: Record<NgoStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_verification: "Under verification",
  approved: "Approved",
  rejected: "Rejected",
};

export const IDENTITY_STATUS_LABELS: Record<IdentityVerificationStatus, string> = {
  not_initiated: "Not initiated",
  consent_pending: "Consent pending",
  verification_pending: "Verification pending",
  verified: "Verified",
  failed: "Failed",
  manual_review: "Manual review required",
};

export const FIELD_STATUS_LABELS: Record<FieldDutyStatus, string> = {
  not_deployed: "Not deployed",
  assigned: "Rostered",
  awaiting_checkin: "Awaiting check-in",
  checked_in: "Checked in",
  on_duty: "On duty",
  shift_complete: "Shift complete",
  needs_assistance: "Needs assistance",
  absent: "Absent",
};

export const LIFECYCLE_STAGES = [
  "registered",
  "verified",
  "trained",
  "rostered",
  "deployed",
  "on_field",
  "completed",
] as const;

export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];
