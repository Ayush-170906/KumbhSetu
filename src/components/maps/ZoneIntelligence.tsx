import type { Zone, RiskSnapshot, Incident, Volunteer, Facility } from "@/lib/types";
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
  onIncidentClick,
}: {
  zone: Zone;
  snapshot: RiskSnapshot;
  incidents: Incident[];
  volunteers: Volunteer[];
  facilities: Facility[];
  onIncidentClick?: (id: string) => void;
}) {
  const zoneIncidents = incidents.filter((i) => i.zoneId === zone.id && !["resolved", "cancelled"].includes(i.status));
  const available = volunteers.filter((v) => v.zoneId === zone.id && v.availability === "available");
  const zoneFacilities = facilities.filter((f) => f.zoneId === zone.id);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2">
        <StatBlock label="Occupancy" value={`${Math.round((zone.currentOccupancy / zone.capacity) * 100)}%`} sub={`${zone.currentOccupancy.toLocaleString("en-IN")} est.`} />
        <StatBlock label="Density" value={zone.density.toUpperCase()} />
        <StatBlock label="Volunteers" value={String(available.length)} sub="available" />
      </div>

      <PulsePanel zone={zone} snapshot={snapshot} />

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft mb-2">
          Active incidents ({zoneIncidents.length})
        </div>
        {zoneIncidents.length === 0 ? (
          <p className="text-xs text-ink-soft">No active incidents in this zone.</p>
        ) : (
          <div className="space-y-2">
            {zoneIncidents.map((inc) => (
              <IncidentCard key={inc.id} incident={inc} zone={zone} onClick={() => onIncidentClick?.(inc.id)} />
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
            <div key={f.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border last:border-0">
              <span className="flex items-center gap-2 text-ink">
                <Icon name="map-pin" className="h-3.5 w-3.5 text-ink-soft" />
                {f.name}
              </span>
              <span className="text-ink-soft">{facilityLabel(f.type)} · {f.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
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
