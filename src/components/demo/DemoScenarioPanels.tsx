"use client";

import type { DemoPanel, DemoScenario } from "@/lib/demoScript";
import type { Incident, Task, Volunteer, Zone } from "@/lib/types";
import { IncidentTimeline } from "@/components/incidents/IncidentTimeline";
import { StageStepper } from "@/components/incidents/StageStepper";
import { StatusPill } from "@/components/ui/StatusPill";
import { Icon, type IconName } from "@/components/ui/Icon";
import { severityLabel, severityTone, typeLabel } from "@/lib/incidentMeta";
import { PaneHeader } from "./DemoPilgrimPane";
import { DEMO_SCENARIOS } from "@/lib/demoScript";

export function DemoScenarioPanels({
  scenario,
  stepIndex,
  activePanel,
  incident,
  task,
  volunteer,
  zone,
}: {
  scenario: DemoScenario;
  stepIndex: number;
  activePanel: DemoPanel;
  incident?: Incident;
  task?: Task;
  volunteer?: Volunteer;
  zone?: Zone;
}) {
  const config = DEMO_SCENARIOS[scenario];
  const incidentTypeIcon: IconName = config.icon;
  const statusText: Record<string, string> = {
    assigned: "Awaiting acknowledgement",
    accepted: "Acknowledged · responding",
    arrived: "On scene",
    resolved: "Resolved",
    escalated: "Escalated",
  };

  return (
    <div className="grid h-full grid-cols-1 divide-y divide-border overflow-y-auto md:grid-cols-3 md:divide-x md:divide-y-0 md:overflow-visible">
      <section className={`flex min-h-0 flex-col overflow-hidden p-4 transition-shadow ${activePanel === "pilgrim" ? "ring-2 ring-inset ring-primary/60" : ""}`}>
        <PaneHeader icon="pilgrim" title="Pilgrim" subtitle="Synthetic report · DEMO DATA" />
        {stepIndex < 2 || !incident ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm text-ink-muted">
            <Icon name="pilgrim" className="h-8 w-8 text-ink-soft" />
            Waiting for the synthetic pilgrim report.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-status-amber">
              <Icon name={incidentTypeIcon} className="h-4 w-4" /> Synthetic scenario
            </div>
            <h2 className="text-base font-semibold text-ink">{config.title}</h2>
            <p className="text-sm leading-relaxed text-ink-muted">{incident.summary}</p>
            <div className="rounded-sm border border-border bg-surface p-3 text-xs">
              <div className="text-ink-soft">Incident reference</div>
              <div className="mt-1 font-mono-num font-semibold text-ink">{incident.code}</div>
              <div className="mt-2 text-ink-muted">{zone?.name ?? incident.zoneId}</div>
            </div>
            <StageStepper status={incident.status} />
          </div>
        )}
      </section>

      <section className={`flex min-h-0 flex-col overflow-y-auto p-4 transition-shadow ${activePanel === "management" ? "ring-2 ring-inset ring-primary/60" : ""}`}>
        <PaneHeader icon="management" title="Control room" subtitle="Shared incident state" />
        {incident ? (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono-num text-sm font-semibold text-ink">{incident.code}</span>
              <StatusPill tone={severityTone(incident.severity)}>{severityLabel(incident.severity)}</StatusPill>
            </div>
            <div className="text-sm font-semibold text-ink">{typeLabel(incident.type)}</div>
            <div className="text-xs text-ink-muted">{zone?.shortName ?? incident.zoneId} · {incident.status.replaceAll("_", " ")}</div>
            <div className="rounded-sm border border-border bg-surface-muted px-3 py-2 text-xs">
              <div className="text-ink-soft">Assignment</div>
              <div className="mt-1 font-medium text-ink">
                {incident.assignedVolunteerId
                  ? `${volunteer?.name ?? incident.assignedVolunteerId} · ${incident.assignedVolunteerId}`
                  : stepIndex >= 4 ? "No available volunteer assigned" : "Awaiting dispatch"}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ink-soft">Incident timeline</h3>
              <IncidentTimeline incident={incident} />
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink-muted">The incident queue is ready for a report.</p>
        )}
      </section>

      <section className={`flex min-h-0 flex-col overflow-hidden p-4 transition-shadow ${activePanel === "volunteer" ? "ring-2 ring-inset ring-primary/60" : ""}`}>
        <PaneHeader icon="volunteer" title="Volunteer" subtitle="Field response" />
        {incident && task && volunteer ? (
          <div className="mt-4 space-y-4">
            <StatusPill tone={task.state === "resolved" ? "green" : "info"}>
              {statusText[task.state] ?? task.state}
            </StatusPill>
            <div>
              <div className="text-xs text-ink-soft">Assigned responder</div>
              <div className="mt-1 text-sm font-semibold text-ink">{volunteer.name} · {volunteer.id}</div>
              <div className="mt-1 text-xs text-ink-muted">{zone?.shortName ?? incident.zoneId} · {zone?.name}</div>
            </div>
            <ol className="space-y-2 border-l border-border pl-3 text-xs">
              {[
                ["assigned", "Assignment sent"],
                ["accepted", "Acknowledged"],
                ["arrived", "Arrived on scene"],
                ["resolved", "Resolved"],
              ].map(([state, label]) => {
                const order = ["assigned", "accepted", "arrived", "resolved"];
                const reached = order.indexOf(task.state) >= order.indexOf(state);
                return <li key={state} className={reached ? "font-medium text-ink" : "text-ink-soft"}>{label}</li>;
              })}
            </ol>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-ink-muted">
            <Icon name="volunteer" className="h-8 w-8 text-ink-soft" />
            {incident ? "Waiting for control-room assignment." : "No field task yet."}
          </div>
        )}
      </section>
    </div>
  );
}
