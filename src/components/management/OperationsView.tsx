"use client";

import { useState } from "react";
import type { Zone, Facility, Volunteer, Incident, IncidentStatus, IncidentType, RiskSnapshot } from "@/lib/types";
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<IncidentType | "all">("all");
  const emergingSignals = useAppStore((s) => s.emergingSignals);
  const groundReports = useAppStore((s) => s.groundReports);
  const promoteReportToIncident = useAppStore((s) => s.promoteReportToIncident);

  const priority = { critical: 0, moderate: 1, low: 2 } as const;
  const activeIncidents = [...incidents]
    .filter((i) => !["resolved", "cancelled"].includes(i.status))
    .sort((a, b) => priority[a.severity] - priority[b.severity] || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const visibleIncidents = activeIncidents.filter((incident) => {
    const zone = zones.find((z) => z.id === incident.zoneId);
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [incident.code, incident.summary, incident.assignedVolunteerId, zone?.name, zone?.shortName]
      .some((value) => value?.toLowerCase().includes(query));
    return matchesSearch && (statusFilter === "all" || incident.status === statusFilter) &&
      (typeFilter === "all" || incident.type === typeFilter);
  });

  const topRiskZone = [...zones].sort((a, b) => b.riskScore - a.riskScore)[0];

  return (
    <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
      <div className="flex-1 min-w-0 min-h-[42vh] lg:min-h-0 flex flex-col p-3 sm:p-4 gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">Operational Map · Demo</h2>
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
            <SimTag label="Simulated map" />
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

      <aside className="w-full shrink-0 max-h-[36vh] border-t border-border bg-surface flex flex-col min-h-0 lg:max-h-none lg:w-96 lg:border-l lg:border-t-0">
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
            <PanelHeader title="Incident queue" subtitle={`${visibleIncidents.length} of ${activeIncidents.length} active · Critical first`} />
            <div className="mb-2 grid grid-cols-2 gap-2">
              <label className="col-span-2">
                <span className="sr-only">Search incidents</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search ID, location, responder…"
                  className="h-9 w-full rounded-sm border border-border bg-surface px-2.5 text-xs text-ink placeholder:text-ink-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                />
              </label>
              <label>
                <span className="sr-only">Filter by status</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as IncidentStatus | "all")} className="h-9 w-full rounded-sm border border-border bg-surface px-2 text-xs text-ink">
                  <option value="all">All active statuses</option>
                  {(["reported", "triaged", "dispatched", "acknowledged", "responding", "escalated"] as IncidentStatus[]).map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
                </select>
              </label>
              <label>
                <span className="sr-only">Filter by incident type</span>
                <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as IncidentType | "all")} className="h-9 w-full rounded-sm border border-border bg-surface px-2 text-xs text-ink">
                  <option value="all">All incident types</option>
                  {(["medical", "lost_person", "crowd_pressure", "security", "facility", "other"] as IncidentType[]).map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}
                </select>
              </label>
            </div>
            <div className="space-y-2">
              {visibleIncidents.length === 0 && (
                <p className="text-xs text-ink-soft border border-dashed border-border rounded-sm p-3">
                  {activeIncidents.length === 0 ? "No active incidents. New SOS reports will appear here." : "No incidents match these filters. Adjust your search or filters."}
                </p>
              )}
              {visibleIncidents.map((inc) => (
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
