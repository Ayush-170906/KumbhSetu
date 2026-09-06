"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { subscribeToRealtimeEvents } from "@/lib/api";
import { TopStatusBar } from "./TopStatusBar";
import { SideNav, type ManagementView } from "./SideNav";
import { OperationsView } from "./OperationsView";
import { PulseView } from "./PulseView";
import { FieldReportsView } from "./FieldReportsView";
import { AnalyticsView } from "./AnalyticsView";
import { EventLog } from "./EventLog";
import { AdvisoriesView } from "./AdvisoriesView";
import { LostFoundView } from "./LostFoundView";
import { Drawer } from "@/components/ui/Drawer";
import { ZoneIntelligence } from "@/components/maps/ZoneIntelligence";
import { IncidentDetail } from "@/components/incidents/IncidentDetail";
import { SetuCompanion } from "@/components/setu/SetuCompanion";

export default function ManagementApp() {
  const store = useAppStore();
  const [view, setView] = useState<ManagementView>("operations");
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  useEffect(() => {
    subscribeToRealtimeEvents({ drive: true });
  }, []);

  const activeIncidents = store.incidents.filter((i) => !["resolved", "cancelled"].includes(i.status));
  const zonesAtRisk = store.zones.filter((z) => z.riskBand !== "green").length;
  const volunteersAvailable = store.volunteers.filter((v) => v.availability === "available").length;

  const selectedZone = selectedZoneId ? store.zones.find((z) => z.id === selectedZoneId) : undefined;
  const selectedIncident = selectedIncidentId ? store.incidents.find((i) => i.id === selectedIncidentId) : undefined;
  const selectedIncidentVolunteer = selectedIncident?.assignedVolunteerId
    ? store.volunteers.find((v) => v.id === selectedIncident.assignedVolunteerId)
    : undefined;

  return (
    <div className="h-screen flex flex-col bg-ivory">
      <TopStatusBar
        connectivity={store.systemStatus.connectivity}
        activeIncidents={activeIncidents.length}
        volunteersAvailable={volunteersAvailable}
        zonesAtRisk={zonesAtRisk}
      />
      <div className="flex flex-1 min-h-0">
        <SideNav active={view} onChange={setView} onReset={() => store.resetAll()} />

        {view === "operations" && (
          <OperationsView
            zones={store.zones}
            facilities={store.facilities}
            volunteers={store.volunteers}
            incidents={store.incidents}
            riskSnapshots={store.riskSnapshots}
            onZoneClick={(id) => {
              setSelectedZoneId(id);
              setSelectedIncidentId(null);
            }}
            onIncidentClick={(id) => {
              setSelectedIncidentId(id);
              setSelectedZoneId(null);
            }}
          />
        )}

        {view === "copilot" && (
          <div className="flex-1 min-h-0 flex justify-center bg-ivory">
            <div className="w-full max-w-2xl flex flex-col min-h-0 border-x border-border">
              <SetuCompanion persona="management" variant="full" />
            </div>
          </div>
        )}

        {view === "pulse" && (
          <div className="flex-1 overflow-y-auto scroll-thin">
            <PulseView
              zones={store.zones}
              riskSnapshots={store.riskSnapshots}
              emergingSignals={store.emergingSignals}
              groundReports={store.groundReports}
              onPromote={(id) => store.promoteReportToIncident(id)}
            />
          </div>
        )}

        {view === "fieldreports" && (
          <div className="flex-1 overflow-y-auto scroll-thin">
            <FieldReportsView zones={store.zones} />
          </div>
        )}

        {view === "advisories" && (
          <div className="flex-1 overflow-y-auto scroll-thin">
            <AdvisoriesView
              zones={store.zones}
              advisories={store.advisories}
              onPublish={(input) => store.publishAdvisory({ ...input, issuedBy: "Control Room" })}
              onRetract={store.retractAdvisory}
            />
          </div>
        )}

        {view === "lostfound" && (
          <div className="flex-1 overflow-y-auto scroll-thin">
            <LostFoundView
              incidents={store.incidents}
              foundReports={store.foundReports}
              zones={store.zones}
              onConfirmMatch={store.confirmLostFoundMatch}
            />
          </div>
        )}

        {view === "analytics" && (
          <div className="flex-1 overflow-y-auto scroll-thin">
            <AnalyticsView
              incidents={store.incidents}
              volunteers={store.volunteers}
              zones={store.zones}
              riskHistory={store.riskHistory}
            />
          </div>
        )}

        {view === "log" && (
          <div className="flex-1 overflow-y-auto scroll-thin p-6 max-w-4xl">
            <h2 className="font-editorial text-xl text-ink mb-1">System Event Log</h2>
            <p className="text-xs text-ink-muted mb-4">
              Every material incident/task transition is recorded with a timestamp for later audit and analysis.
            </p>
            <EventLog events={store.auditLog} />
          </div>
        )}
      </div>

      <Drawer
        open={!!selectedZone}
        onClose={() => setSelectedZoneId(null)}
        eyebrow={selectedZone?.code}
        title={selectedZone?.name ?? ""}
      >
        {selectedZone && store.riskSnapshots[selectedZone.id] && (
          <ZoneIntelligence
            zone={selectedZone}
            snapshot={store.riskSnapshots[selectedZone.id]}
            incidents={store.incidents}
            volunteers={store.volunteers}
            facilities={store.facilities}
            onIncidentClick={(id) => {
              setSelectedIncidentId(id);
              setSelectedZoneId(null);
            }}
          />
        )}
      </Drawer>

      <Drawer
        open={!!selectedIncident}
        onClose={() => setSelectedIncidentId(null)}
        eyebrow="Incident"
        title={selectedIncident?.code ?? ""}
      >
        {selectedIncident && (
          <IncidentDetail
            incident={selectedIncident}
            zone={store.zones.find((z) => z.id === selectedIncident.zoneId)}
            volunteer={selectedIncidentVolunteer}
          />
        )}
      </Drawer>
    </div>
  );
}
