import type { Incident, Volunteer, Zone } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { StageStepper } from "@/components/incidents/StageStepper";
import { typeLabel } from "@/lib/incidentMeta";

export function DemoPilgrimPane({
  incident,
  zone,
  responder,
}: {
  incident?: Incident;
  zone?: Zone;
  responder?: Volunteer;
}) {
  return (
    <div className="flex-1 flex flex-col p-4">
      <PaneHeader icon="pilgrim" title="Pilgrim" subtitle={zone ? `Simulated at ${zone.shortName}` : undefined} />

      {!incident ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
          <div className="h-12 w-12 rounded-full bg-surface-muted flex items-center justify-center">
            <Icon name="map-pin" className="h-5 w-5 text-ink-soft" />
          </div>
          <p className="text-xs text-ink-muted max-w-[16rem]">Waiting for a pilgrim to raise an SOS…</p>
        </div>
      ) : (
        <div className="mt-2 space-y-4 animate-fade-in-up">
          <div className="rounded-sm border border-border bg-surface p-3">
            <div className="flex items-center gap-2 text-status-red">
              <Icon name="sos" className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">{typeLabel(incident.type)} SOS Sent</span>
            </div>
            <div className="font-mono-num text-sm text-ink mt-1">{incident.code}</div>
          </div>

          <div className="rounded-sm border border-border bg-surface p-3">
            <div className="text-[10px] uppercase tracking-wide text-ink-soft mb-3">Status</div>
            <StageStepper status={incident.status} />
          </div>

          {responder && (
            <div className="rounded-sm border border-border bg-surface-muted px-3 py-2.5 text-xs">
              <div className="text-ink-soft">Responder</div>
              <div className="text-ink font-medium mt-0.5">{responder.name} · {responder.id}</div>
              {incident.etaMinutes && <div className="text-ink-soft mt-0.5">ETA {incident.etaMinutes} min</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PaneHeader({ icon, title, subtitle }: { icon: Parameters<typeof Icon>[0]["name"]; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5 pb-3 border-b border-border">
      <div className="h-8 w-8 rounded-sm bg-primary-soft flex items-center justify-center shrink-0">
        <Icon name={icon} className="h-4 w-4 text-primary-dark" />
      </div>
      <div>
        <div className="text-sm font-semibold text-ink">{title}</div>
        {subtitle && <div className="text-[11px] text-ink-soft">{subtitle}</div>}
      </div>
    </div>
  );
}
