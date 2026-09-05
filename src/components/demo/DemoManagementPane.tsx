import type { Zone, Incident, Volunteer, Facility, RiskSnapshot } from "@/lib/types";
import { OperationalMap } from "@/components/maps/OperationalMap";
import { IncidentCard } from "@/components/incidents/IncidentCard";
import { PulsePanel } from "@/components/pulse/PulsePanel";
import { PaneHeader } from "./DemoPilgrimPane";

export function DemoManagementPane({
  zones,
  facilities,
  volunteers,
  incidents,
  focusZone,
  focusSnapshot,
}: {
  zones: Zone[];
  facilities: Facility[];
  volunteers: Volunteer[];
  incidents: Incident[];
  focusZone: Zone;
  focusSnapshot?: RiskSnapshot;
}) {
  const active = incidents.filter((i) => !["resolved", "cancelled"].includes(i.status));

  return (
    <div className="flex-1 flex flex-col p-4 min-h-0">
      <PaneHeader icon="management" title="Management" subtitle="Control room view" />
      <div className="h-40 mt-3 rounded-sm border border-border overflow-hidden shrink-0">
        <OperationalMap zones={zones} facilities={facilities} volunteers={volunteers} incidents={incidents} />
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin mt-3 space-y-3">
        {focusSnapshot && <PulsePanel zone={focusZone} snapshot={focusSnapshot} compact />}
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft mb-2">
            Active Incidents ({active.length})
          </div>
          <div className="space-y-2">
            {active.map((inc) => (
              <IncidentCard key={inc.id} incident={inc} zone={zones.find((z) => z.id === inc.zoneId)} />
            ))}
            {active.length === 0 && <p className="text-xs text-ink-soft">No active incidents.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
