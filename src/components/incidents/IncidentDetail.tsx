import type { Incident, Zone, Volunteer } from "@/lib/types";
import { StatusPill } from "@/components/ui/StatusPill";
import { severityTone, severityLabel, typeLabel } from "@/lib/incidentMeta";
import { StageStepper } from "./StageStepper";
import { IncidentTimeline } from "./IncidentTimeline";
import { formatClock } from "@/lib/format";

export function IncidentDetail({
  incident,
  zone,
  volunteer,
}: {
  incident: Incident;
  zone?: Zone;
  volunteer?: Volunteer;
}) {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between">
          <span className="font-mono-num text-sm font-semibold text-ink">{incident.code}</span>
          <StatusPill tone={severityTone(incident.severity)}>{severityLabel(incident.severity)}</StatusPill>
        </div>
        <div className="text-base font-semibold text-ink mt-1">{typeLabel(incident.type)}</div>
        <div className="text-xs text-ink-muted mt-0.5">
          {zone?.name ?? incident.zoneId} · Reported {formatClock(incident.createdAt)}
        </div>
      </div>

      <p className="text-sm text-ink-muted leading-relaxed border-y border-border py-3">{incident.summary}</p>

      {incident.photoUrls && incident.photoUrls.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft mb-2">
            Field evidence ({incident.photoUrls.length})
          </div>
          <div className="grid grid-cols-2 gap-2">
            {incident.photoUrls.map((url, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={idx} src={url} alt="Field evidence" className="w-full h-28 object-cover rounded-sm border border-border" />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft mb-3">Status</div>
        <StageStepper status={incident.status} />
      </div>

      {volunteer && (
        <div className="flex items-center justify-between rounded-sm border border-border bg-surface-muted px-3 py-2.5">
          <div>
            <div className="text-xs text-ink-soft">Responder</div>
            <div className="text-sm font-medium text-ink">{volunteer.name} · {volunteer.id}</div>
          </div>
          {incident.etaMinutes && (
            <div className="text-right">
              <div className="text-xs text-ink-soft">ETA</div>
              <div className="text-sm font-medium text-ink font-mono-num">{incident.etaMinutes} min</div>
            </div>
          )}
        </div>
      )}

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft mb-3">Event Timeline</div>
        <IncidentTimeline incident={incident} />
      </div>
    </div>
  );
}
