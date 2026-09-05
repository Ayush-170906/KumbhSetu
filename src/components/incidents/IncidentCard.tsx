import type { Incident, Zone } from "@/lib/types";
import { StatusPill } from "@/components/ui/StatusPill";
import { severityTone, severityLabel, statusLabel, typeLabel } from "@/lib/incidentMeta";
import { formatClockShort, formatRelative } from "@/lib/format";

export function IncidentCard({
  incident,
  zone,
  selected,
  onClick,
}: {
  incident: Incident;
  zone?: Zone;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-sm border px-3 py-2.5 transition-colors duration-150 ${
        selected ? "border-primary bg-primary-soft/40" : "border-border bg-surface hover:bg-surface-muted"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono-num text-xs font-semibold text-ink">{incident.code}</span>
        <StatusPill tone={severityTone(incident.severity)}>{severityLabel(incident.severity)}</StatusPill>
      </div>
      <div className="text-sm font-medium text-ink mt-1">{typeLabel(incident.type)}</div>
      <div className="text-xs text-ink-muted mt-0.5">{zone?.shortName ?? incident.zoneId}</div>
      <div className="flex items-center justify-between mt-2 text-[11px] text-ink-soft">
        <span>{statusLabel(incident.status)}</span>
        <span className="font-mono-num">{formatClockShort(incident.createdAt)} · {formatRelative(incident.createdAt)}</span>
      </div>
      {incident.assignedVolunteerId && (
        <div className="text-[11px] text-ink-muted mt-1">
          Responder <span className="font-medium text-ink">{incident.assignedVolunteerId}</span>
          {incident.etaMinutes ? ` · ETA ${incident.etaMinutes} min` : ""}
        </div>
      )}
    </button>
  );
}
