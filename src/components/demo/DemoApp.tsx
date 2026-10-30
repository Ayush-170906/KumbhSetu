"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAppStore } from "@/store/useAppStore";
import { subscribeToRealtimeEvents } from "@/lib/api";
import { Icon } from "@/components/ui/Icon";
import { DEMO_SCENARIOS, demoStep, loopStageForStep, type DemoScenario } from "@/lib/demoScript";
import { DemoControls } from "./DemoControls";
import { DemoTimeline } from "./DemoTimeline";
import { DemoPilgrimPane } from "./DemoPilgrimPane";
import { DemoManagementPane } from "./DemoManagementPane";
import { DemoVolunteerPane } from "./DemoVolunteerPane";
import { DemoIntro, DemoOutro } from "./DemoStage";
import { DemoLoopDiagram } from "./DemoShared";
import { DemoScenarioPanels } from "./DemoScenarioPanels";

const FOCUS_ZONE = "z04";

export default function DemoApp() {
  const store = useAppStore();
  const { demo } = store;

  useEffect(() => {
    subscribeToRealtimeEvents();
    // A persisted, half-finished run from a previous visit shouldn't greet the
    // next viewer with a stale timeline — start from a clean pre-run state.
    const state = useAppStore.getState();
    const d = state.demo;
    const requested = new URLSearchParams(window.location.search).get("scenario");
    const requestedScenario = requested && Object.hasOwn(DEMO_SCENARIOS, requested) ? requested as DemoScenario : undefined;
    if (!d.running && requestedScenario) {
      if (d.completed || d.log.length > 0) state.resetDemo();
      useAppStore.getState().setDemoScenario(requestedScenario);
    } else if (!d.running && (d.completed || d.log.length > 0)) state.resetDemo();
  }, []);

  const step = demo.stepIndex;
  const meta = demoStep(Math.max(step, 1), demo.scenario);
  const activePanel = meta.panel;

  const incident = demo.activeIncidentId ? store.incidents.find((i) => i.id === demo.activeIncidentId) : undefined;
  const task = demo.activeTaskId ? store.tasks.find((t) => t.id === demo.activeTaskId) : undefined;
  const focusZone = store.zones.find((z) => z.id === (incident?.zoneId ?? FOCUS_ZONE)) ?? store.zones[0];
  const focusSnapshot = store.riskSnapshots[focusZone.id];
  const responder = incident?.assignedVolunteerId
    ? store.volunteers.find((v) => v.id === incident.assignedVolunteerId)
    : undefined;
  const reportOne = demo.reportOneId ? store.groundReports.find((r) => r.id === demo.reportOneId) : undefined;
  const reportTwo = demo.reportTwoId ? store.groundReports.find((r) => r.id === demo.reportTwoId) : undefined;

  const preStart = !demo.running && !demo.completed;
  const showIntro = preStart || (demo.running && step <= 1);
  const showOutro = demo.completed || step >= demo.totalSteps;

  const paneRing = (panel: string) =>
    activePanel === panel && demo.running && !demo.completed
      ? "ring-2 ring-inset ring-primary/60"
      : "";

  return (
    <div className="flex h-screen flex-col bg-ivory">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-surface px-4">
        <Link href="/" className="-ml-1 p-1 text-ink-muted" aria-label="Home">
          <Icon name="map-pin" className="h-4 w-4" />
        </Link>
        <span className="text-xs font-semibold text-ink">Kumbh Setu</span>
        <span className="text-xs text-ink-soft">/ Demo Studio</span>
        <div className="ml-auto flex items-center gap-3 text-xs">
          <span className="hidden text-ink-soft sm:inline">Open a role interface:</span>
          <Link href="/pilgrim" className="text-ink-muted hover:text-ink">Pilgrim</Link>
          <Link href="/field?tab=tasks" className="text-ink-muted hover:text-ink">Volunteer</Link>
          <Link href="/management" className="text-ink-muted hover:text-ink">Management</Link>
        </div>
      </div>

      <DemoControls
        running={demo.running}
        paused={demo.paused}
        completed={demo.completed}
        stepIndex={demo.stepIndex}
        totalSteps={demo.totalSteps}
        scenario={demo.scenario}
        onScenarioChange={(scenario: DemoScenario) => {
          if (demo.running || demo.completed) store.restartDemo(scenario);
          else store.setDemoScenario(scenario);
        }}
        onStart={() => store.startDemo(demo.scenario)}
        onPause={store.pauseDemo}
        onResume={store.resumeDemo}
        onSkip={store.skipDemoStep}
        onRestart={() => store.restartDemo(demo.scenario)}
        onExit={store.exitDemo}
      />

      {demo.running && !demo.completed && step > 1 && step < demo.totalSteps && (
        <div className="hidden shrink-0 border-b border-border bg-surface px-4 py-1.5 md:block">
          <DemoLoopDiagram activeIndex={loopStageForStep(step, demo.scenario)} compact />
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        {showIntro && <DemoIntro onStart={() => store.startDemo(demo.scenario)} onSelectScenario={store.setDemoScenario} scenario={demo.scenario} started={demo.running} />}
        {showOutro && <DemoOutro onReplay={() => store.restartDemo(demo.scenario)} onExit={store.exitDemo} />}

        {demo.scenario === "missing" ? <div className="grid h-full grid-cols-1 divide-y divide-border overflow-y-auto md:grid-cols-3 md:divide-x md:divide-y-0 md:overflow-visible">
          <div className={`flex min-h-0 flex-col overflow-hidden transition-shadow ${paneRing("pilgrim")}`}>
            <DemoPilgrimPane stepIndex={step} incident={incident} responder={responder} />
          </div>
          <div className={`flex min-h-0 flex-col overflow-hidden transition-shadow ${paneRing("management")}`}>
            <DemoManagementPane
              stepIndex={step}
              zones={store.zones}
              facilities={store.facilities}
              volunteers={store.volunteers}
              incidents={store.incidents}
              focusZone={focusZone}
              focusSnapshot={focusSnapshot}
              emergingSignals={store.emergingSignals}
              auditLog={store.auditLog}
              incident={incident}
              reportOne={reportOne}
              reportTwo={reportTwo}
            />
          </div>
          <div className={`flex min-h-0 flex-col overflow-hidden transition-shadow ${paneRing("volunteer")}`}>
            <DemoVolunteerPane
              stepIndex={step}
              volunteer={responder}
              task={task}
              incident={incident}
              zone={focusZone}
              reportOne={reportOne}
              reportTwo={reportTwo}
            />
          </div>
        </div> : <DemoScenarioPanels scenario={demo.scenario} stepIndex={step} activePanel={activePanel} incident={incident} task={task} volunteer={responder} zone={focusZone} />}
      </div>

      <div className="h-28 shrink-0 overflow-y-auto border-t border-border bg-surface scroll-thin">
        <div className="sticky top-0 border-b border-border bg-surface px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft">
          Scenario Timeline
        </div>
        <DemoTimeline log={demo.log} />
      </div>
    </div>
  );
}
