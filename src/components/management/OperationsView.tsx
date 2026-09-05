"use client";

import { useState } from "react";
import type { Zone, Facility, Volunteer, Incident, RiskSnapshot } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { OperationalMap } from "@/components/maps/OperationalMap";
import { RealMapView } from "@/components/maps/RealMapView";
import { MapLegend } from "@/components/maps/MapLegend";
import { IncidentCard } from "@/components/incidents/IncidentCard";
import { VolunteerList } from "@/components/management/VolunteerList";
import { PulsePanel } from "@/components/pulse/PulsePanel";
import { EmergingSignals } from "@/components/pulse/EmergingSignals";
import { PanelHeader } from "@/components/ui/Panel";
import { SimTag } from "@/components/ui/SimTag";

export function OperationsView({
  zones,
  facilities,
  volunteers,
  incidents,
  riskSnapshots,
  onZoneClick,
  onIncidentClick,
}: {
  zones: Zone[];
  facilities: Facility[];
  volunteers: Volunteer[];
  incidents: Incident[];
  riskSnapshots: Record<string, RiskSnapshot>;
  onZoneClick: (id: string) => void;
  onIncidentClick: (id: string) => void;
}) {
  const [mapMode, setMapMode] = useState<"abstract" | "gis">("abstract");
  const emergingSignals = useAppStore((s) => s.emergingSignals);
  const groundReports = useAppStore((s) => s.groundReports);
  const promoteReportToIncident = useAppStore((s) => s.promoteReportToIncident);

  const activeIncidents = [...incidents]
    .filter((i) => !["resolved", "cancelled"].includes(i.status))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const topRiskZone = [...zones].sort((a, b) => b.riskScore - a.riskScore)[0];

  return (
    <div className="flex flex-1 min-h-0">
      <div className="flex-1 min-w-0 flex flex-col p-4 gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">Live Operational Map</h2>
            <p className="text-xs text-ink-muted">
              {mapMode === "abstract"
                ? "Zones, facilities, volunteers and active incidents — simulated layout."
                : "Real Nashik–Trimbakeshwar geography, with simulated zones/incidents layered on top."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-sm border border-border overflow-hidden">
              <button
                onClick={() => setMapMode("abstract")}
                className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  mapMode === "abstract" ? "bg-primary text-white" : "bg-surface text-ink-muted"
                }`}
              >
                Abstract
              </button>
              <button
                onClick={() => setMapMode("gis")}
                className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  mapMode === "gis" ? "bg-primary text-white" : "bg-surface text-ink-muted"
                }`}
              >
                Real Map (GIS)
              </button>
            </div>
            <SimTag />
          </div>
        </div>
        <div className="flex-1 min-h-0 rounded-sm border border-border overflow-hidden bg-surface">
          {mapMode === "abstract" ? (
            <OperationalMap
              zones={zones}
              facilities={facilities}
              volunteers={volunteers}
              incidents={incidents}
              onZoneClick={onZoneClick}
              onIncidentClick={onIncidentClick}
            />
          ) : (
            <RealMapView zones={zones} facilities={facilities} volunteers={volunteers} incidents={incidents} />
          )}
        </div>
        <MapLegend />
      </div>

      <aside className="w-96 shrink-0 border-l border-border bg-surface flex flex-col min-h-0">
        <div className="p-4 border-b border-border">
          {riskSnapshots[topRiskZone.id] && <PulsePanel zone={topRiskZone} snapshot={riskSnapshots[topRiskZone.id]} compact />}
        </div>
        <div className="flex-1 overflow-y-auto scroll-thin p-4 space-y-4">
          {emergingSignals.length > 0 && (
            <div>
              <PanelHeader title="Emerging Signals" subtitle="From volunteer field reports via Setu" />
              <EmergingSignals
                signals={emergingSignals}
                reports={groundReports}
                zones={zones}
                onPromote={(id) => promoteReportToIncident(id)}
                compact
              />
            </div>
          )}
          <div>
            <PanelHeader title={`Active Incidents (${activeIncidents.length})`} />
            <div className="space-y-2">
              {activeIncidents.length === 0 && (
                <p className="text-xs text-ink-soft border border-dashed border-border rounded-sm p-3">
                  No active incidents. New SOS reports from the Pilgrim app will appear here immediately.
                </p>
              )}
              {activeIncidents.map((inc) => (
                <IncidentCard
                  key={inc.id}
                  incident={inc}
                  zone={zones.find((z) => z.id === inc.zoneId)}
                  onClick={() => onIncidentClick(inc.id)}
                />
              ))}
            </div>
          </div>

          <div>
            <PanelHeader title="Volunteer Roster" subtitle={`${volunteers.filter((v) => v.availability === "available").length} available now`} />
            <VolunteerList volunteers={volunteers} zones={zones} />
          </div>
        </div>
      </aside>
    </div>
  );
}
