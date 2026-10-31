import type { LanguageCode, Volunteer } from "./types";
import type {
  AttendanceRecord,
  Deployment,
  FieldActivity,
  LifecycleStage,
  Ngo,
  RosterAssignment,
  TrainingEnrollment,
  TrainingSession,
  TrainingVolunteerStatus,
  VolunteerDirectoryQuery,
  VolunteerRegistrationInput,
} from "./volunteerTypes";

export const MIN_VOLUNTEER_AGE = 18;
export const IDENTITY_PROVIDER_CONFIGURED = false;
export const VMS_DATA_SCOPE = "Browser-local prototype. Figures are calculated from this session’s volunteer records, including labelled demo seed data.";

const restrictedNotes = new Map<string, { accommodationsNote?: string; emergencyContactPhone?: string }>();

export function setRestrictedVolunteerNotes(
  volunteerId: string,
  notes: { accommodationsNote?: string; emergencyContactPhone?: string }
) {
  restrictedNotes.set(volunteerId, notes);
}

export function getRestrictedVolunteerNotes(volunteerId: string) {
  return restrictedNotes.get(volunteerId);
}

export function ageFromYear(yearOfBirth?: string, asOf = new Date()): number | null {
  if (!yearOfBirth || !/^\d{4}$/.test(yearOfBirth)) return null;
  const year = Number(yearOfBirth);
  if (year < 1920 || year > asOf.getFullYear()) return null;
  return asOf.getFullYear() - year;
}

export function isAgeEligible(yearOfBirth?: string): boolean {
  const age = ageFromYear(yearOfBirth);
  return age !== null && age >= MIN_VOLUNTEER_AGE;
}

export function nextVolunteerId(volunteers: Volunteer[]): string {
  const maxNum = volunteers.reduce((m, v) => {
    const n = Number(v.id.replace(/\D/g, ""));
    return Number.isFinite(n) && n > m ? n : m;
  }, 100);
  return `V-${maxNum + 1}`;
}

export function trainingStatusFor(
  volunteerId: string,
  enrollments: TrainingEnrollment[]
): TrainingVolunteerStatus {
  const mine = enrollments.filter((e) => e.volunteerId === volunteerId);
  if (mine.length === 0) return "not_enrolled";
  if (mine.some((e) => e.status === "completed")) return "completed";
  if (mine.some((e) => e.status === "attended")) return "attended";
  if (mine.some((e) => e.status === "incomplete")) {
    const open = mine.filter((e) => e.status === "enrolled" || e.status === "attended");
    if (open.length === 0) return "incomplete";
  }
  if (mine.some((e) => e.status === "enrolled")) return "enrolled";
  return "incomplete";
}

export function isTrained(volunteerId: string, enrollments: TrainingEnrollment[]): boolean {
  return enrollments.some((e) => e.volunteerId === volunteerId && e.status === "completed");
}

export function lifecycleFor(
  volunteer: Volunteer,
  enrollments: TrainingEnrollment[],
  assignments: RosterAssignment[],
  deployments: Deployment[]
): LifecycleStage {
  const assignment = assignments.find((a) => a.volunteerId === volunteer.id);
  const deployment = assignment ? deployments.find((d) => d.id === assignment.deploymentId) : undefined;
  const trained = isTrained(volunteer.id, enrollments);
  const verified = volunteer.identityVerificationStatus === "verified";
  const field = volunteer.fieldDutyStatus ?? "not_deployed";

  if (field === "shift_complete") return "completed";
  if (field === "on_duty" || field === "checked_in" || field === "needs_assistance") return "on_field";
  if (deployment && (deployment.status === "active" || deployment.status === "published" || field === "awaiting_checkin")) {
    return "deployed";
  }
  if (assignment) return "rostered";
  if (trained && verified) return "trained";
  if (verified) return "verified";
  return "registered";
}

export function profileCompleteness(volunteer: Volunteer): { score: number; missing: string[] } {
  const checks: [string, boolean][] = [
    ["Full name", volunteer.name.trim().length >= 2],
    ["Preferred language", Boolean(volunteer.preferredLanguage || volunteer.languages.length)],
    ["Zone", Boolean(volunteer.zoneId)],
    ["Skills", volunteer.skills.length > 0],
    ["Languages", volunteer.languages.length > 0],
    ["Year of birth", Boolean(volunteer.yearOfBirth)],
    ["Contact", Boolean(volunteer.phone || volunteer.email)],
    ["Emergency contact name", Boolean(volunteer.emergencyContactName)],
    ["Category", Boolean(volunteer.category)],
  ];
  const missing = checks.filter(([, ok]) => !ok).map(([label]) => label);
  const score = Math.round(((checks.length - missing.length) / checks.length) * 100);
  return { score, missing };
}

export function duplicateCandidates(volunteer: Volunteer, all: Volunteer[]): Volunteer[] {
  return all.filter((other) => {
    if (other.id === volunteer.id) return false;
    const samePhone = volunteer.phone && other.phone && normalizePhone(volunteer.phone) === normalizePhone(other.phone);
    const sameName = other.name.trim().toLowerCase() === volunteer.name.trim().toLowerCase();
    const sameEmail = volunteer.email && other.email && volunteer.email.trim().toLowerCase() === other.email.trim().toLowerCase();
    return Boolean(samePhone || (sameName && sameEmail) || (sameName && volunteer.yearOfBirth && volunteer.yearOfBirth === other.yearOfBirth));
  });
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

export function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const as = toMin(aStart);
  let ae = toMin(aEnd);
  const bs = toMin(bStart);
  let be = toMin(bEnd);
  if (ae <= as) ae += 24 * 60;
  if (be <= bs) be += 24 * 60;
  return as < be && bs < ae;
}

export interface RosterSkip {
  volunteerId: string;
  reason: string;
}

export interface RosterPreview {
  selected: Volunteer[];
  unfilled: number;
  skipped: RosterSkip[];
}

export function generateRosterPreview(
  deployment: Deployment,
  volunteers: Volunteer[],
  assignments: RosterAssignment[],
  deployments: Deployment[],
  enrollments: TrainingEnrollment[]
): RosterPreview {
  const skipped: RosterSkip[] = [];
  const selected: Volunteer[] = [];
  const occupied = new Set(
    assignments
      .filter((a) => {
        const other = deployments.find((d) => d.id === a.deploymentId);
        if (!other || other.id === deployment.id) return false;
        if (other.date !== deployment.date) return false;
        return timesOverlap(other.startTime, other.endTime, deployment.startTime, deployment.endTime);
      })
      .map((a) => a.volunteerId)
  );

  for (const volunteer of volunteers) {
    if (selected.length >= deployment.requiredCount) break;
    if (occupied.has(volunteer.id)) {
      skipped.push({ volunteerId: volunteer.id, reason: "Shift conflict with an existing assignment" });
      continue;
    }
    if (assignments.some((a) => a.deploymentId === deployment.id && a.volunteerId === volunteer.id)) {
      skipped.push({ volunteerId: volunteer.id, reason: "Already on this roster" });
      continue;
    }
    if (deployment.requireVerified && volunteer.identityVerificationStatus !== "verified") {
      skipped.push({ volunteerId: volunteer.id, reason: "Verification required" });
      continue;
    }
    if (deployment.requireTrained && !isTrained(volunteer.id, enrollments)) {
      skipped.push({ volunteerId: volunteer.id, reason: "Required training not completed" });
      continue;
    }
    if (volunteer.availability === "off_duty" || volunteer.fieldDutyStatus === "absent") {
      skipped.push({ volunteerId: volunteer.id, reason: "Not available" });
      continue;
    }
    if (deployment.skillsRequired.length && !deployment.skillsRequired.every((skill) => volunteer.skills.includes(skill))) {
      skipped.push({ volunteerId: volunteer.id, reason: "Missing required skill" });
      continue;
    }
    if (deployment.languagesPreferred.length && !deployment.languagesPreferred.some((lang) => volunteer.languages.includes(lang))) {
      skipped.push({ volunteerId: volunteer.id, reason: "Preferred language not listed" });
      continue;
    }
    if (volunteer.availabilityWindow === "weekends" && isWeekday(deployment.date)) {
      skipped.push({ volunteerId: volunteer.id, reason: "Availability is weekends only" });
      continue;
    }
    if (volunteer.availabilityWindow === "weekdays" && !isWeekday(deployment.date)) {
      skipped.push({ volunteerId: volunteer.id, reason: "Availability is weekdays only" });
      continue;
    }
    selected.push(volunteer);
  }

  return { selected, unfilled: Math.max(0, deployment.requiredCount - selected.length), skipped };
}

function isWeekday(date: string): boolean {
  const day = new Date(`${date}T12:00:00`).getDay();
  return day !== 0 && day !== 6;
}

export function filterVolunteers(
  volunteers: Volunteer[],
  query: VolunteerDirectoryQuery,
  extras: {
    enrollments: TrainingEnrollment[];
    sessions: TrainingSession[];
    assignments: RosterAssignment[];
    deployments: Deployment[];
    attendance: AttendanceRecord[];
  }
): Volunteer[] {
  const text = query.text?.trim().toLowerCase();
  return volunteers.filter((volunteer) => {
    if (text && ![volunteer.name, volunteer.id, volunteer.phone, volunteer.email].some((value) => value?.toLowerCase().includes(text))) {
      return false;
    }
    if (query.ngoId && volunteer.ngoId !== query.ngoId) return false;
    if (query.verification && query.verification !== "all" && (volunteer.identityVerificationStatus ?? "not_initiated") !== query.verification) return false;
    if (query.training && query.training !== "all" && trainingStatusFor(volunteer.id, extras.enrollments) !== query.training) return false;
    if (query.zoneId && volunteer.zoneId !== query.zoneId) return false;
    if (query.sector && volunteer.sector !== query.sector) return false;
    if (query.skill && !volunteer.skills.includes(query.skill)) return false;
    if (query.language && query.language !== "all" && !volunteer.languages.includes(query.language)) return false;
    if (query.availability && volunteer.availability !== query.availability && volunteer.availabilityWindow !== query.availability) return false;
    if (query.fieldStatus && query.fieldStatus !== "all" && (volunteer.fieldDutyStatus ?? "not_deployed") !== query.fieldStatus) return false;
    if (query.shift && volunteer.shiftStart !== query.shift && !extras.assignments.some((a) => {
      const d = extras.deployments.find((item) => item.id === a.deploymentId);
      return a.volunteerId === volunteer.id && d?.shift === query.shift;
    })) return false;
    if (query.registeredFrom && volunteer.enrolledAt && volunteer.enrolledAt.slice(0, 10) < query.registeredFrom) return false;
    if (query.attendance && query.attendance !== "all") {
      const latest = extras.attendance.filter((a) => a.volunteerId === volunteer.id).sort((a, b) => b.markedAt.localeCompare(a.markedAt))[0];
      if (!latest || latest.status !== query.attendance) return false;
    }
    return true;
  });
}

export interface CsvRowError {
  row: number;
  message: string;
}

export interface ParsedVolunteerRow {
  row: number;
  input: VolunteerRegistrationInput;
  duplicateOf?: string;
}

export function parseVolunteerCsv(
  text: string,
  existing: Volunteer[],
  defaultNgoId?: string
): { rows: ParsedVolunteerRow[]; errors: CsvRowError[]; headers: string[] } {
  const lines = text.replace(/\r/g, "").split("\n").filter((line) => line.trim());
  if (lines.length === 0) return { rows: [], errors: [{ row: 0, message: "File is empty" }], headers: [] };
  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  const required = ["fullName"];
  const errors: CsvRowError[] = [];
  const rows: ParsedVolunteerRow[] = [];
  const seenPhones = new Set(existing.map((v) => v.phone).filter(Boolean).map((p) => normalizePhone(p!)));
  const seenNames = new Set(existing.map((v) => v.name.trim().toLowerCase()));

  for (const req of required) {
    if (!headers.includes(req)) errors.push({ row: 1, message: `Missing required column: ${req}` });
  }
  if (errors.length) return { rows: [], errors, headers };

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const rec: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rec[h] = (cols[idx] ?? "").trim();
    });
    const name = rec.fullName || rec.name;
    if (!name || name.length < 2) {
      errors.push({ row: i + 1, message: "Full name is required" });
      continue;
    }
    const phone = rec.mobile || rec.phone;
    if (phone && phone.replace(/\D/g, "").length && phone.replace(/\D/g, "").length !== 10) {
      errors.push({ row: i + 1, message: "Mobile number must be 10 digits when provided" });
      continue;
    }
    const languages = (rec.languages || "mr")
      .split(/[|,]/)
      .map((l) => l.trim())
      .filter(Boolean) as LanguageCode[];
    const skills = (rec.skills || "crowd_marshal").split(/[|,]/).map((s) => s.trim()).filter(Boolean);
    const yearOfBirth = rec.yearOfBirth || rec.yob;
    if (yearOfBirth && !isAgeEligible(yearOfBirth)) {
      errors.push({ row: i + 1, message: `Age must be at least ${MIN_VOLUNTEER_AGE}` });
      continue;
    }
    const phoneKey = phone ? normalizePhone(phone) : "";
    const duplicateOf = phoneKey && seenPhones.has(phoneKey)
      ? existing.find((v) => v.phone && normalizePhone(v.phone) === phoneKey)?.id
      : seenNames.has(name.toLowerCase()) && phoneKey
        ? existing.find((v) => v.name.trim().toLowerCase() === name.toLowerCase())?.id
        : undefined;
    if (phoneKey) seenPhones.add(phoneKey);
    seenNames.add(name.toLowerCase());
    rows.push({
      row: i + 1,
      duplicateOf,
      input: {
        name,
        phone,
        email: rec.email,
        preferredLanguage: (languages[0] as LanguageCode) || "mr",
        languages: languages.length ? languages : ["mr"],
        skills: skills.length ? skills : ["crowd_marshal"],
        category: (rec.category as VolunteerRegistrationInput["category"]) || "general",
        zoneId: rec.zoneId || "z01",
        ngoId: rec.ngoId || defaultNgoId,
        availabilityWindow: (rec.availability as VolunteerRegistrationInput["availabilityWindow"]) || "full_time",
        preferredArea: rec.preferredArea,
        experience: rec.experience,
        yearOfBirth,
        gender: rec.gender === "female" || rec.gender === "male" || rec.gender === "other" ? rec.gender : "undisclosed",
        emergencyContactName: rec.emergencyContactName,
        addressLine: rec.address,
        state: rec.state || "Maharashtra",
        district: rec.district || "Nashik",
        identityConsent: rec.identityConsent === "yes" || rec.identityConsent === "true",
        enrolledBy: "ngo_bulk",
        kind: "general",
        shiftStart: rec.shiftStart || "10:00",
        shiftEnd: rec.shiftEnd || "18:00",
      },
    });
  }
  return { rows, errors, headers };
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export const CSV_TEMPLATE = `fullName,mobile,email,yearOfBirth,gender,preferredLanguage,category,skills,languages,zoneId,availability,preferredArea,emergencyContactName,identityConsent
A. Sample,9876543210,a.sample@example.test,1998,undisclosed,mr,crowd_management,crowd_marshal|translation,mr|hi,z01,full_time,Ramkund,B. Sample,yes
`;

export function ngoParticipation(ngos: Ngo[], volunteers: Volunteer[]) {
  return ngos.map((ngo) => ({
    ngo,
    count: volunteers.filter((v) => v.ngoId === ngo.id).length,
  }));
}

export function registrationTrend(volunteers: Volunteer[], days = 14): { date: string; count: number }[] {
  const today = new Date();
  const buckets: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.push({
      date: key,
      count: volunteers.filter((v) => (v.enrolledAt ?? "2026-10-01").slice(0, 10) === key).length,
    });
  }
  return buckets;
}

export function locationDistribution(volunteers: Volunteer[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const v of volunteers) map[v.zoneId] = (map[v.zoneId] ?? 0) + 1;
  return map;
}

export function latestAttendance(volunteerId: string, records: AttendanceRecord[]): AttendanceRecord | undefined {
  return records.filter((r) => r.volunteerId === volunteerId).sort((a, b) => b.markedAt.localeCompare(a.markedAt))[0];
}

export function latestFieldNote(volunteerId: string, activities: FieldActivity[]): FieldActivity | undefined {
  return activities.filter((a) => a.volunteerId === volunteerId).sort((a, b) => b.at.localeCompare(a.at))[0];
}

export function authorizedExportRows(volunteers: Volunteer[], ngos: Ngo[]) {
  return volunteers.map((v) => ({
    id: v.id,
    name: v.name,
    ngo: ngos.find((n) => n.id === v.ngoId)?.name ?? "",
    zoneId: v.zoneId,
    skills: v.skills.join("|"),
    languages: v.languages.join("|"),
    verification: v.identityVerificationStatus ?? "not_initiated",
    fieldStatus: v.fieldDutyStatus ?? "not_deployed",
    availability: v.availability,
  }));
}

export function toCsv(rows: Record<string, string>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h] ?? "")).join(","))].join("\n");
}

export function inputToVolunteerPatch(input: VolunteerRegistrationInput): Partial<Volunteer> {
  return {
    name: input.name.trim(),
    phone: input.phone?.trim() || undefined,
    email: input.email?.trim() || undefined,
    ngoId: input.ngoId,
    category: input.category,
    skills: input.skills,
    languages: input.languages.length ? input.languages : ["mr"],
    preferredLanguage: input.preferredLanguage,
    yearOfBirth: input.yearOfBirth,
    gender: input.gender ?? "undisclosed",
    emergencyContactName: input.emergencyContactName?.trim() || undefined,
    addressLine: input.addressLine?.trim() || undefined,
    state: input.state?.trim() || "Maharashtra",
    district: input.district?.trim() || "Nashik",
    experience: input.experience?.trim() || undefined,
    availabilityWindow: input.availabilityWindow,
    preferredArea: input.preferredArea?.trim() || undefined,
    hasAccessibilityNeed: Boolean(input.hasAccessibilityNeed),
    kind: input.kind ?? "general",
    enrolledBy: input.enrolledBy ?? "management",
    identityVerificationStatus: input.identityConsent ? "consent_pending" : "not_initiated",
    identityConsentAt: input.identityConsent ? new Date().toISOString() : undefined,
    identityMethod: "manual_document_review",
    registrationComplete: true,
    fieldDutyStatus: "not_deployed",
  };
}
