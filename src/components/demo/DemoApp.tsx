"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAppStore } from "@/store/useAppStore";
import { subscribeToRealtimeEvents } from "@/lib/api";
import { DemoControls } from "./DemoControls";
import { DemoTimeline } from "./DemoTimeline";
import { DemoPilgrimPane } from "./DemoPilgrimPane";
import { DemoManagementPane } from "./DemoManagementPane";
import { DemoVolunteerPane } from "./DemoVolunteerPane";
import { Icon } from "@/components/ui/Icon";

export default function DemoApp() {
  const store = useAppStore();

  useEffect(() => {
    subscribeToRealtimeEvents();
  }, []);

  const incident = store.demo.activeIncidentId ? store.incidents.find((i) => i.id === store.demo.activeIncidentId) : undefined;
  const task = store.demo.activeTaskId ? store.tasks.find((t) => t.id === store.demo.activeTaskId) : undefined;
  const focusZone = store.zones.find((z) => z.id === (incident?.zoneId ?? "z04")) ?? store.zones[0];
  const responder = incident?.assignedVolunteerId ? store.volunteers.find((v) => v.id === incident.assignedVolunteerId) : undefined;

  return (
    <div className="h-screen flex flex-col bg-ivory">
      <div className="h-12 shrink-0 border-b border-border bg-surface flex items-center px-4 gap-2">
        <Link href="/" className="p-1 -ml-1 text-ink-muted" aria-label="Home">
          <Icon name="map-pin" className="h-4 w-4" />
        </Link>
        <span className="text-xs font-semibold text-ink">Kumbh Setu</span>
        <span className="text-xs text-ink-soft">/ Demo</span>
        <div className="ml-auto flex items-center gap-3 text-xs">
          <Link href="/pilgrim" className="text-ink-muted hover:text-ink">Open Pilgrim</Link>
          <Link href="/volunteer" className="text-ink-muted hover:text-ink">Open Volunteer</Link>
          <Link href="/management" className="text-ink-muted hover:text-ink">Open Management</Link>
        </div>
      </div>

      <DemoControls
        running={store.demo.running}
        completed={store.demo.completed}
        stepIndex={store.demo.stepIndex}
        totalSteps={store.demo.totalSteps}
        onStart={() => store.startDemo()}
      />

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border overflow-y-auto md:overflow-visible">
        <DemoPilgrimPane incident={incident} zone={focusZone} responder={responder} />
        <DemoManagementPane
          zones={store.zones}
          facilities={store.facilities}
          volunteers={store.volunteers}
          incidents={store.incidents}
          focusZone={focusZone}
          focusSnapshot={store.riskSnapshots[focusZone.id]}
        />
        <DemoVolunteerPane volunteer={responder} task={task} incident={incident} zone={focusZone} />
      </div>

      <div className="h-40 shrink-0 border-t border-border bg-surface overflow-y-auto scroll-thin">
        <div className="sticky top-0 bg-surface px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft border-b border-border">
          Scenario Timeline
        </div>
        <DemoTimeline log={store.demo.log} />
      </div>
    </div>
  );
}
