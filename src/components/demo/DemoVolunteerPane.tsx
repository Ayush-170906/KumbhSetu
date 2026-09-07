"use client";

import { useEffect, useRef } from "react";
import type { GroundReport, Incident, Task, Volunteer, Zone } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { PaneHeader } from "./DemoPilgrimPane";
import { DemoBubble, ProposedAction, SetuProvenance } from "./DemoShared";
import {
  VOL_TRANSLATE_REQUEST,
  VOL_TRANSLATED_SITUATION,
  VOL_TRANSLATE_META,
  VOL_LOG_COMMAND,
  VOL2_NAME,
  VOL2_REPORT,
} from "@/lib/demoScript";

const TASK_COPY: Record<string, { label: string; hint: string; tone: "yellow" | "info" | "green" }> = {
  assigned: { label: "New task", hint: "Critical — awaiting your response", tone: "yellow" },
  accepted: { label: "Accepted", hint: "En route to Ghat 4", tone: "info" },
  in_progress: { label: "En route", hint: "Navigating to the incident", tone: "info" },
  arrived: { label: "On site", hint: "With the family — assessing", tone: "info" },
  resolved: { label: "Resolved", hint: "Child reunited — loop closed", tone: "green" },
  escalated: { label: "Escalated", hint: "Further response requested", tone: "yellow" },
  cancelled: { label: "Cancelled", hint: "", tone: "yellow" },
  created: { label: "Created", hint: "", tone: "yellow" },
};

export function DemoVolunteerPane({
  stepIndex,
  volunteer,
  task,
  incident,
  reportOne,
  reportTwo,
}: {
  stepIndex: number;
  volunteer?: Volunteer;
  task?: Task;
  incident?: Incident;
  zone?: Zone;
  reportOne?: GroundReport;
  reportTwo?: GroundReport;
}) {
  const idle = stepIndex < 4;
  const inTask = stepIndex >= 16 && !!task;
  const activeVolunteer = stepIndex >= 7 && stepIndex <= 8 ? VOL2_NAME : volunteer ? `${volunteer.name} · ${volunteer.id}` : "M. Joshi · V-218";

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [stepIndex]);

  return (
    <div className="flex flex-1 flex-col p-4">
      <PaneHeader icon="volunteer" title="Volunteer" subtitle="Acts on the ground" />

      {idle ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-green-bg">
            <Icon name="check" className="h-5 w-5 text-status-green" />
          </div>
          <p className="max-w-[16rem] text-xs text-ink-muted">On shift at Ghat 4 — standing by, available.</p>
        </div>
      ) : (
        <div ref={scrollRef} className="mt-3 space-y-2.5 overflow-y-auto scroll-thin pr-0.5">
          <div className="text-[10px] uppercase tracking-[0.12em] text-ink-soft">
            {inTask ? "Task" : `Setu AI · ${activeVolunteer}`}
          </div>

          {!inTask && (
            <>
              {/* Step 4 — translation workflow */}
              <DemoBubble from="volunteer" label="Volunteer">
                {VOL_TRANSLATE_REQUEST}
              </DemoBubble>
              <div>
                <DemoBubble from="assistant" label="Setu AI · Translate">
                  {VOL_TRANSLATED_SITUATION}
                </DemoBubble>
                <div className="mt-1 flex items-center gap-1 px-1 text-[10px] text-ink-soft">
                  <Icon name="layers" className="h-3 w-3" /> {VOL_TRANSLATE_META}
                </div>
              </div>

              {/* Step 5+ — Setu AI structures the report */}
              {stepIndex >= 5 && (
                <div className="animate-fade-in-up space-y-2">
                  <DemoBubble from="volunteer" label="Volunteer">
                    {VOL_LOG_COMMAND}
                  </DemoBubble>
                  <div className="rounded-sm border border-border bg-surface p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-soft">
                      Setu AI · structured report
                    </div>
                    <dl className="mt-1.5 space-y-1 text-xs text-ink">
                      <Row k="Category" v="Lost person · child" />
                      <Row k="Zone" v="Ghat 4 · near Ramkund steps" />
                      <Row k="Description" v="Boy, ~6 years, red shirt" />
                      <Row k="Severity" v="High" />
                      <Row k="Source" v="Volunteer observation (translated)" />
                    </dl>
                    <SetuProvenance />
                  </div>
                  <ProposedAction
                    tool="File ground report"
                    prompt="File this as a lost-child ground report for Ghat 4 and send it to the control room?"
                    state={stepIndex >= 6 ? "confirmed" : "pending"}
                  />
                </div>
              )}

              {/* Step 6 — first report filed */}
              {stepIndex >= 6 && reportOne && (
                <FiledCard code={reportOne.code} label="First report submitted to the control room" />
              )}

              {/* Step 7 — second volunteer, independent report */}
              {stepIndex >= 7 && (
                <div className="animate-fade-in-up space-y-2 border-t border-border pt-2.5">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                    Second volunteer · {VOL2_NAME}
                  </div>
                  <DemoBubble from="volunteer" label="Volunteer">
                    {VOL2_REPORT}
                  </DemoBubble>
                  <ProposedAction
                    tool="File ground report"
                    prompt="File a second lost-child ground report for the Ghat 4 / Gate 3 area?"
                    state={stepIndex >= 8 ? "confirmed" : "pending"}
                  />
                </div>
              )}

              {/* Step 8 — second report filed */}
              {stepIndex >= 8 && reportTwo && (
                <FiledCard code={reportTwo.code} label="Second report submitted — control room now has two" />
              )}

              {/* Steps 9–15 — waiting for the control room */}
              {stepIndex >= 9 && stepIndex < 16 && (
                <div className="animate-fade-in-up rounded-sm border border-border bg-surface-muted px-3 py-2.5 text-xs text-ink-muted">
                  <Icon name="clock" className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
                  Reports filed. Standing by for the control room to corroborate and decide.
                </div>
              )}
            </>
          )}

          {/* Steps 16–20 — the task lifecycle */}
          {inTask && task && incident && (
            <div className="animate-fade-in-up space-y-3">
              <div className="flex items-center justify-between rounded-sm border border-border bg-surface p-3">
                <div>
                  <div className="text-xs text-ink-soft">Ghat 4 · {incident.code}</div>
                  <div className="mt-0.5 text-sm font-semibold text-ink">{TASK_COPY[task.state]?.label ?? task.state}</div>
                </div>
                <StatusPill tone={TASK_COPY[task.state]?.tone ?? "info"}>
                  {task.state === "assigned" ? "Critical" : task.state === "resolved" ? "Done" : "Active"}
                </StatusPill>
              </div>
              <p className="text-xs text-ink-muted">{TASK_COPY[task.state]?.hint}</p>

              <ol className="space-y-1.5 text-xs">
                {(["assigned", "accepted", "arrived", "resolved"] as const).map((st) => {
                  const order = ["assigned", "accepted", "arrived", "resolved"];
                  const reached = order.indexOf(task.state) >= order.indexOf(st);
                  return (
                    <li key={st} className="flex items-center gap-2">
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full border text-[9px] ${
                          reached ? "border-status-green bg-status-green text-white" : "border-border text-ink-soft"
                        }`}
                      >
                        {reached ? "✓" : ""}
                      </span>
                      <span className={reached ? "text-ink" : "text-ink-soft"}>
                        {st === "assigned" ? "Dispatched" : st === "accepted" ? "Accepted — en route" : st === "arrived" ? "Arrived on site" : "Resolved"}
                      </span>
                    </li>
                  );
                })}
              </ol>

              <div className="rounded-sm bg-surface-muted px-3 py-2 text-xs">
                <div className="text-ink-soft">Incident</div>
                <div className="mt-0.5 font-mono-num font-medium text-ink">{incident.code}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 shrink-0 text-ink-soft">{k}</dt>
      <dd className="text-ink">{v}</dd>
    </div>
  );
}

function FiledCard({ code, label }: { code: string; label: string }) {
  return (
    <div className="animate-fade-in-up rounded-sm border border-status-green-border bg-status-green-bg p-3">
      <div className="flex items-center gap-1.5 text-status-green">
        <Icon name="check" className="h-3.5 w-3.5" />
        <span className="font-mono-num text-sm font-semibold">{code}</span>
      </div>
      <div className="mt-0.5 text-[11px] text-ink-muted">{label}</div>
    </div>
  );
}
