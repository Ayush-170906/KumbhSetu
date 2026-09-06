import type {
  Zone,
  RiskSnapshot,
  Incident,
  Volunteer,
  Facility,
  GroundReport,
  EmergingSignal,
} from "@/lib/types";
import { PulsePanel } from "@/components/pulse/PulsePanel";
import { IncidentCard } from "@/components/incidents/IncidentCard";
import { facilityLabel } from "@/components/pilgrim/facilityMeta";
import { Icon } from "@/components/ui/Icon";

export function ZoneIntelligence({
  zone,
  snapshot,
  incidents,
  volunteers,
  facilities,
  groundReports = [],
  emergingSignals = [],
  onIncidentClick,
  onViewFieldReports,
  onClose,
}: {
  zone: Zone;
  snapshot: RiskSnapshot;
  incidents: Incident[];
  volunteers: Volunteer[];
  facilities: Facility[];
  groundReports?: GroundReport[];
  emergingSignals?: EmergingSignal[];
  onIncidentClick?: (id: string) => void;
  onViewFieldReports?: () => void;
  onClose?: () => void;
}) {
  const zoneIncidents = incidents.filter(
    (i) => i.zoneId === zone.id && !["resolved", "cancelled"].includes(i.status)
  );
  const criticalOpen = zoneIncidents.filter((i) => i.severity === "critical");
  const available = volunteers.filter((v) => v.zoneId === zone.id && v.availability === "available");
  const zoneFacilities = facilities.filter((f) => f.zoneId === zone.id);

  const zoneReports = groundReports.filter(
    (r) => r.zoneId === zone.id && !["resolved", "dismissed"].includes(r.status)
  );
  const corroborated = zoneReports.filter((r) => ["corroborated", "verified"].includes(r.status));
  const zoneSignals = emergingSignals.filter((s) => s.zoneId === zone.id);

  const topIncident = criticalOpen[0] ?? zoneIncidents[0];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2">
        <StatBlock
          label="Occupancy"
          value={`${Math.round((zone.currentOccupancy / zone.capacity) * 100)}%`}
          sub={`${zone.currentOccupancy.toLocaleString("en-IN")} est.`}
        />
        <StatBlock label="Density" value={zone.density.toUpperCase()} />
        <StatBlock label="Volunteers" value={String(available.length)} sub="available" />
      </div>

      <PulsePanel zone={zone} snapshot={snapshot} />

      {/* Supporting signals — the evidence chain behind the score */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft mb-2">
          Supporting signals
        </div>
        <ul className="space-y-1.5 text-xs text-ink-muted">
          <Signal
            on={corroborated.length > 0}
            text={`${corroborated.length} corroborated field report${corroborated.length === 1 ? "" : "s"} in this zone`}
          />
          <Signal
            on={zoneReports.length > corroborated.length}
            text={`${zoneReports.length - corroborated.length} unverified field report${
              zoneReports.length - corroborated.length === 1 ? "" : "s"
            }`}
          />
          <Signal
            on={criticalOpen.length > 0}
            text={`${criticalOpen.length} open critical incident${criticalOpen.length === 1 ? "" : "s"}`}
          />
          {zoneSignals.map((s) => (
            <li key={s.id} className="flex items-start gap-2">
              <Icon name="pulse" className="h-3.5 w-3.5 text-status-amber shrink-0 mt-0.5" />
              <span>
                {s.headline} · {(s.confidence * 100) | 0}% confidence
              </span>
            </li>
          ))}
          <Signal
            on={zone.density === "high" || zone.density === "severe"}
            text={`Elevated crowd activity — ${zone.densityPercent}% of capacity, trend ${zone.trend}`}
          />
          {corroborated.length === 0 && zoneSignals.length === 0 && criticalOpen.length === 0 && (
            <li className="text-ink-soft">
              No field-report or incident evidence yet — score is from the model baseline only.
            </li>
          )}
        </ul>
      </div>

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft mb-2">
          Active incidents ({zoneIncidents.length})
        </div>
        {zoneIncidents.length === 0 ? (
          <p className="text-xs text-ink-soft">No active incidents in this zone.</p>
        ) : (
          <div className="space-y-2">
            {zoneIncidents.map((inc) => (
              <IncidentCard
                key={inc.id}
                incident={inc}
                zone={zone}
                onClick={() => onIncidentClick?.(inc.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft mb-2">
          Nearby facilities
        </div>
        <div className="space-y-1.5">
          {zoneFacilities.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between text-xs py-1.5 border-b border-border last:border-0"
            >
              <span className="flex items-center gap-2 text-ink">
                <Icon name="map-pin" className="h-3.5 w-3.5 text-ink-soft" />
                {f.name}
              </span>
              <span className="text-ink-soft">
                {facilityLabel(f.type)} · {f.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Drill-down actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        {onViewFieldReports && (
          <button
            onClick={onViewFieldReports}
            className="inline-flex items-center gap-1.5 rounded-sm border border-border-strong bg-surface px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-surface-muted transition-colors"
          >
            <Icon name="log" className="h-3.5 w-3.5" />
            View field reports
          </button>
        )}
        {topIncident && onIncidentClick && (
          <button
            onClick={() => onIncidentClick(topIncident.id)}
            className="inline-flex items-center gap-1.5 rounded-sm border border-border-strong bg-surface px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-surface-muted transition-colors"
          >
            <Icon name="warning" className="h-3.5 w-3.5" />
            View incident {topIncident.code}
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-sm border border-border-strong bg-surface px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-surface-muted transition-colors"
          >
            <Icon name="map-pin" className="h-3.5 w-3.5" />
            Show on map
          </button>
        )}
      </div>

      <div className="text-[10px] text-ink-soft border-t border-border pt-2">
        Model {snapshot.modelVersion} · confidence {Math.round(snapshot.confidence * 100)}% · Data:
        Synthetic / Simulation
      </div>
    </div>
  );
}

function Signal({ on, text }: { on: boolean; text: string }) {
  if (!on) return null;
  return (
    <li className="flex items-start gap-2">
      <Icon name="check" className="h-3.5 w-3.5 text-status-green shrink-0 mt-0.5" />
      <span>{text}</span>
    </li>
  );
}

function StatBlock({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-sm border border-border bg-surface-muted px-2.5 py-2">
      <div className="text-[9.5px] uppercase tracking-wide text-ink-soft">{label}</div>
      <div className="text-sm font-semibold text-ink font-mono-num mt-0.5">{value}</div>
      {sub && <div className="text-[10px] text-ink-soft">{sub}</div>}
    </div>
  );
}
