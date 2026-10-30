import type { Incident, Zone, Volunteer } from "@/lib/types";
import { StatusPill } from "@/components/ui/StatusPill";
import { severityTone, severityLabel, typeLabel } from "@/lib/incidentMeta";
import { StageStepper } from "./StageStepper";
import { IncidentTimeline } from "./IncidentTimeline";
import { formatClock } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

export function IncidentDetail({
  incident,
  zone,
  volunteer,
  assignableVolunteers = [],
  onTriage,
  onAssign,
}: {
  incident: Incident;
  zone?: Zone;
  volunteer?: Volunteer;
  assignableVolunteers?: Volunteer[];
  onTriage?: () => void;
  onAssign?: (volunteerId: string) => boolean;
}) {
  const [volunteerId, setVolunteerId] = useState("");
  const [assignmentNotice, setAssignmentNotice] = useState("");
  const [assignmentSucceeded, setAssignmentSucceeded] = useState(false);
  const canDispatch = ["reported", "triaged", "dispatched"].includes(incident.status);

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

      <section className="border border-border bg-surface-muted/50 p-3" aria-labelledby="incident-response-heading">
        <div className="flex items-center justify-between gap-3">
          <div><h3 id="incident-response-heading" className="text-xs font-semibold text-ink">Response assignment</h3><p className="mt-0.5 text-[11px] text-ink-soft">Prototype actions are recorded in the local incident timeline.</p></div>
          <StatusPill tone={incident.assignedVolunteerId ? "info" : "neutral"}>{incident.assignedVolunteerId ? "Assigned" : "Unassigned"}</StatusPill>
        </div>
        {onTriage && incident.status === "reported" && <Button size="sm" variant="outline" className="mt-3 w-full" onClick={onTriage}>Mark reviewed</Button>}
        {onAssign && canDispatch && !incident.assignedVolunteerId && (
          <div className="mt-3 space-y-2">
            <label htmlFor="assign-volunteer" className="block text-[10px] font-semibold uppercase tracking-wide text-ink-soft">Available responders</label>
            <select id="assign-volunteer" value={volunteerId} onChange={(event) => { setVolunteerId(event.target.value); setAssignmentNotice(""); }} className="h-11 w-full border border-border bg-surface px-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
              <option value="">Choose a responder</option>
              {assignableVolunteers.map((responder) => <option key={responder.id} value={responder.id}>{responder.name} · {responder.id}</option>)}
            </select>
            <Button className="w-full" disabled={!volunteerId} onClick={() => { if (!volunteerId) return; const assigned = onAssign(volunteerId); setAssignmentSucceeded(assigned); setAssignmentNotice(assigned ? "Responder assigned in the local demo timeline." : "Assignment could not be completed. Refresh the queue and try another responder."); if (assigned) setVolunteerId(""); }}>Assign responder</Button>
            {assignableVolunteers.length === 0 && <p className="text-xs text-ink-soft">No unassigned responders are available right now.</p>}
            {assignmentNotice && <p role={assignmentSucceeded ? "status" : "alert"} className={`text-xs ${assignmentSucceeded ? "text-status-green" : "text-status-red"}`}>{assignmentNotice}</p>}
          </div>
        )}
        {volunteer && <p className="mt-3 text-xs text-ink-muted">Current responder: <strong className="text-ink">{volunteer.name} · {volunteer.id}</strong>{incident.etaMinutes ? ` · sample ETA ${incident.etaMinutes} min` : ""}</p>}
      </section>

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
