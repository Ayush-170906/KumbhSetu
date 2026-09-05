"use client";

import { useRef } from "react";
import type { Incident, Task, Volunteer, Zone } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { Icon } from "@/components/ui/Icon";
import { severityTone, severityLabel, typeLabel } from "@/lib/incidentMeta";
import { distance } from "@/lib/dispatch";
import { OperationalMap } from "@/components/maps/OperationalMap";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function metersLabel(px: number) {
  return `${Math.round(px * 3.4)} m`;
}

export function TaskDetail({
  task,
  incident,
  volunteer,
  zone,
  otherVolunteers,
  onAccept,
  onDecline,
  onArrive,
  onResolve,
  onEscalate,
  onAttachPhoto,
}: {
  task: Task;
  incident: Incident;
  volunteer: Volunteer;
  zone?: Zone;
  otherVolunteers: Volunteer[];
  onAccept: () => void;
  onDecline: () => void;
  onArrive: () => void;
  onResolve: () => void;
  onEscalate: () => void;
  onAttachPhoto: (dataUrl: string) => void;
}) {
  const distPx = distance(volunteer.position, incident.position);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onAttachPhoto(await fileToDataUrl(file));
    e.target.value = "";
  }

  if (task.state === "assigned") {
    return (
      <div className="flex-1 flex flex-col p-4">
        <div className="rounded-sm border border-status-red-border bg-status-red-bg px-3 py-2 flex items-center gap-2 mb-4">
          <span className="h-2 w-2 rounded-full bg-status-red map-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wide text-status-red">New Task</span>
        </div>

        <h1 className="text-lg font-semibold text-ink">{typeLabel(incident.type)} Assistance</h1>
        <p className="text-sm text-ink-muted mt-1">{zone?.name ?? incident.zoneId} · {metersLabel(distPx)} away</p>

        <div className="flex items-center gap-2 mt-3">
          <StatusPill tone={severityTone(incident.severity)}>{severityLabel(incident.severity)}</StatusPill>
          <span className="font-mono-num text-xs text-ink-soft">{incident.code}</span>
        </div>

        {incident.matchQuality && incident.matchQuality !== "nearest" && (
          <div className="text-[11px] text-status-green mt-2">
            You were matched on {incident.matchQuality === "skill_and_language" ? "required skill + preferred language" : incident.matchQuality === "skill" ? "required skill" : "preferred language"} — not just proximity.
          </div>
        )}

        <p className="text-sm text-ink-muted mt-4 leading-relaxed border-t border-border pt-4">{incident.summary}</p>

        <div className="mt-auto space-y-2 pt-6">
          <Button className="w-full" size="lg" onClick={onAccept}>Accept</Button>
          <Button className="w-full" size="lg" variant="outline" onClick={onDecline}>Decline</Button>
        </div>
      </div>
    );
  }

  const arrived = task.state === "arrived";

  return (
    <div className="flex-1 flex flex-col overflow-y-auto scroll-thin">
      <div className="h-40 border-b border-border shrink-0">
        <OperationalMap
          zones={zone ? [zone] : []}
          volunteers={[volunteer, ...otherVolunteers]}
          incidents={[incident]}
          showFacilities={false}
        />
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2">
          <StatusPill tone={severityTone(incident.severity)}>{severityLabel(incident.severity)}</StatusPill>
          <span className="font-mono-num text-xs text-ink-soft">{incident.code}</span>
        </div>
        <h1 className="text-lg font-semibold text-ink mt-2">{arrived ? "On Site" : "Navigate to Incident"}</h1>
        <p className="text-sm text-ink-muted mt-1">{typeLabel(incident.type)} · {zone?.name ?? incident.zoneId} · {metersLabel(distPx)}</p>

        <div className="grid grid-cols-2 gap-2.5 mt-4">
          <InfoBlock label="Requester" value={incident.reportedBy.label} />
          <InfoBlock label="Risk level" value={severityLabel(incident.severity)} />
        </div>

        <div className="mt-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft mb-2">
            Other responders nearby
          </div>
          {otherVolunteers.length === 0 ? (
            <p className="text-xs text-ink-soft">None currently listed in this zone.</p>
          ) : (
            <div className="space-y-1.5">
              {otherVolunteers.slice(0, 3).map((v) => (
                <div key={v.id} className="flex items-center justify-between text-xs border border-border rounded-sm px-2.5 py-1.5">
                  <span className="text-ink">{v.id} · {v.name}</span>
                  <StatusPill tone={v.availability === "available" ? "green" : "neutral"}>
                    {v.availability === "available" ? "Available" : v.availability === "on_task" ? "On Task" : "Off Duty"}
                  </StatusPill>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-4">
          <button className="flex items-center gap-2 text-xs text-ink-muted border border-border rounded-sm px-3 py-2 w-fit">
            <Icon name="phone" className="h-3.5 w-3.5" />
            Contact Coordinator
          </button>
          {arrived && (
            <>
              <input ref={fileInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
              <button
                onClick={() => fileInput.current?.click()}
                className="flex items-center gap-2 text-xs text-ink-muted border border-border rounded-sm px-3 py-2 w-fit"
              >
                <Icon name="qr" className="h-3.5 w-3.5" />
                Add photo evidence{incident.photoUrls?.length ? ` (${incident.photoUrls.length})` : ""}
              </button>
            </>
          )}
        </div>

        {incident.photoUrls && incident.photoUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5 mt-2">
            {incident.photoUrls.map((url, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={idx} src={url} alt="Evidence" className="w-full h-16 object-cover rounded-sm border border-border" />
            ))}
          </div>
        )}

        <div className="mt-auto pt-6 space-y-2">
          {!arrived ? (
            <Button className="w-full" size="lg" onClick={onArrive}>Mark Arrived</Button>
          ) : (
            <>
              <Button className="w-full" size="lg" onClick={onResolve}>Mark Resolved</Button>
              <Button className="w-full" size="lg" variant="outline" onClick={onEscalate}>Escalate</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border bg-surface-muted px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-ink-soft">{label}</div>
      <div className="text-sm font-medium text-ink mt-0.5 truncate">{value}</div>
    </div>
  );
}
