"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { subscribeToRealtimeEvents } from "@/lib/api";
import { MobileShell } from "./MobileShell";
import { HomeScreen } from "./HomeScreen";
import { SOSFlow } from "./SOSFlow";
import { FacilitiesScreen } from "./FacilitiesScreen";
import { LostFoundScreen } from "./LostFoundScreen";
import { AssistantScreen } from "./AssistantScreen";
import { ReportIssueScreen } from "./ReportIssueScreen";
import { StubScreen } from "./StubScreen";
import { Icon } from "@/components/ui/Icon";

export type PilgrimScreen =
  | "home"
  | "sos-type"
  | "facilities"
  | "lost-found"
  | "assistant"
  | "route"
  | "report-issue";

const titles: Record<PilgrimScreen, string> = {
  home: "Kumbh Setu",
  "sos-type": "Emergency Assistance",
  facilities: "Facilities Near You",
  "lost-found": "Lost & Found",
  assistant: "Ask Kumbh Setu",
  route: "My Route",
  "report-issue": "Report an Issue",
};

export default function PilgrimApp() {
  const store = useAppStore();
  const [screen, setScreen] = useState<PilgrimScreen>("home");
  const [zoneId, setZoneId] = useState("z04");

  useEffect(() => {
    subscribeToRealtimeEvents();
  }, []);

  const zone = store.zones.find((z) => z.id === zoneId) ?? store.zones[0];
  const snapshot = store.riskSnapshots[zone.id];

  return (
    <MobileShell
      title={titles[screen]}
      onBack={screen === "home" ? undefined : () => setScreen("home")}
      right={
        store.systemStatus.connectivity !== "nominal" ? (
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase text-status-amber">
            <Icon name="wifi-off" className="h-3.5 w-3.5" />
            Degraded
          </span>
        ) : (
          <button
            onClick={() => store.setConnectivity("degraded")}
            className="text-[10px] text-ink-soft hover:text-ink-muted"
            title="Simulate degraded connectivity"
          >
            Simulate offline
          </button>
        )
      }
    >
      {screen === "home" && (
        <HomeScreen
          zone={zone}
          zones={store.zones}
          snapshot={snapshot}
          facilities={store.facilities}
          advisories={store.advisories}
          language={store.language}
          onNavigate={setScreen}
          onChangeZone={setZoneId}
          onChangeLanguage={store.setLanguage}
        />
      )}
      {screen === "sos-type" && <SOSFlow zone={zone} onClose={() => setScreen("home")} />}
      {screen === "facilities" && <FacilitiesScreen facilities={store.facilities} zones={store.zones} />}
      {screen === "lost-found" && <LostFoundScreen zone={zone} />}
      {screen === "assistant" && (
        <AssistantScreen zone={zone} snapshot={snapshot} facilities={store.facilities} onNavigate={setScreen} />
      )}
      {screen === "route" && (
        <StubScreen
          icon="route"
          title="Route guidance"
          body="Turn-by-turn routing between ghats, parking and your registered accommodation is planned for a later build once real path/accessibility data is available."
        />
      )}
      {screen === "report-issue" && <ReportIssueScreen zone={zone} onClose={() => setScreen("home")} />}

      {store.systemStatus.connectivity !== "nominal" && screen === "home" && (
        <div className="mx-4 mb-3 rounded-sm border border-status-amber-border bg-status-amber-bg px-3 py-2.5 text-xs text-status-amber flex items-start gap-2">
          <Icon name="wifi-off" className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Connectivity degraded</div>
            <div className="mt-0.5">
              Cached facility information remains available. SOS will still attempt an emergency fallback path.{" "}
              <button className="underline" onClick={() => store.setConnectivity("nominal")}>
                Restore connection
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
