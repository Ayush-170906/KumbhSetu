import type { IncidentSeverity, IncidentStatus, IncidentType } from "./types";

export function severityTone(severity: IncidentSeverity): "green" | "yellow" | "red" {
  if (severity === "critical") return "red";
  if (severity === "moderate") return "yellow";
  return "green";
}

export function severityLabel(severity: IncidentSeverity): string {
  return severity.toUpperCase();
}

export function statusLabel(status: IncidentStatus): string {
  const map: Record<IncidentStatus, string> = {
    reported: "Reported",
    triaged: "Triaged",
    dispatched: "Volunteer Notified",
    acknowledged: "Volunteer Assigned",
    responding: "Responding",
    resolved: "Resolved",
    escalated: "Escalated",
    cancelled: "Cancelled",
  };
  return map[status];
}

export function typeLabel(type: IncidentType): string {
  const map: Record<IncidentType, string> = {
    medical: "Medical",
    lost_person: "Lost Person",
    crowd_pressure: "Crowd Pressure",
    security: "Security",
    facility: "Facility",
    other: "Other",
  };
  return map[type];
}

export const INCIDENT_STAGES: IncidentStatus[] = [
  "reported",
  "triaged",
  "dispatched",
  "acknowledged",
  "responding",
  "resolved",
];

export function stageIndex(status: IncidentStatus): number {
  const i = INCIDENT_STAGES.indexOf(status);
  return i === -1 ? INCIDENT_STAGES.length - 1 : i;
}
