"use client";

import { useEffect, useRef } from "react";
import type {
  AuditEvent,
  EmergingSignal,
  Facility,
  GroundReport,
  Incident,
  RiskSnapshot,
  Volunteer,
  Zone,
} from "@/lib/types";
import { OperationalMap } from "@/components/maps/OperationalMap";
import { IncidentCard } from "@/components/incidents/IncidentCard";
import { PulsePanel } from "@/components/pulse/PulsePanel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusPill } from "@/components/ui/StatusPill";
import { Icon } from "@/components/ui/Icon";
import { formatClock } from "@/lib/format";
import { PaneHeader } from "./DemoPilgrimPane";
import { ProposedAction, SyntheticTag } from "./DemoShared";
import { OPS_PROMPT, OPS_REASONING, OPS_RECOMMENDATION } from "@/lib/demoScript";

export function DemoManagementPane({
  stepIndex,
  zones,
  facilities,
  volunteers,
  incidents,
  focusZone,
  focusSnapshot,
  emergingSignals,
  auditLog,
  incident,
  reportOne,
  reportTwo,
}: {
  stepIndex: number;
  zones: Zone[];
  facilities: Facility[];
  volunteers: Volunteer[];
  incidents: Incident[];
  focusZone: Zone;
  focusSnapshot?: RiskSnapshot;
  emergingSignals: EmergingSignal[];
  auditLog: AuditEvent[];
  incident?: Incident;
  reportOne?: GroundReport;
  reportTwo?: GroundReport;
}) {
  const scene = managementScene(stepIndex);
  const demoReports = [reportOne, reportTwo].filter(Boolean) as GroundReport[];
  const signal = emergingSignals.find((s) => s.zoneId === focusZone.id) ?? emergingSignals[0];

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: 0, behavior: "smooth" });
  }, [stepIndex]);

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4">
      <PaneHeader icon="management" title="Management" subtitle="Coordinates response" />

      <div className="mt-3 flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">Control room</div>
        <SyntheticTag />
      </div>

      <div className="mt-2 h-32 shrink-0 overflow-hidden rounded-sm border border-border">
        <OperationalMap zones={zones} facilities={facilities} volunteers={volunteers} incidents={incidents} />
      </div>

      <div ref={scrollRef} className="mt-3 flex-1 space-y-3 overflow-y-auto scroll-thin">
        {scene === "idle" && (
          <p className="rounded-sm border border-dashed border-border p-4 text-xs text-ink-soft">
            Monitoring all zones. No active signals — waiting on the field.
          </p>
        )}

        {scene === "reports" && (
          <section className="animate-fade-in-up">
            <SectionTitle>Field reports</SectionTitle>
            <div className="space-y-2">
              {demoReports.map((r) => (
                <div key={r.id} className="rounded-sm border border-border bg-surface p-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-num font-semibold text-ink">{r.code}</span>
                    <StatusPill tone={r.status === "corroborated" ? "yellow" : "neutral"}>{r.status}</StatusPill>
                  </div>
                  <div className="mt-1 text-ink-muted">{r.summary}</div>
                  <div className="mt-1 text-[10px] text-ink-soft">
                    {r.reportedBy.label} · {r.category}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-ink-soft">
              Two independent reports, same area, same description — not yet acted on.
            </p>
          </section>
        )}

        {scene === "signal" && (
          <section className="animate-fade-in-up">
            <SectionTitle>Corroboration</SectionTitle>
            <div className="mb-2 flex flex-wrap gap-1.5 text-[11px]">
              {demoReports.map((r) => (
                <span key={r.id} className="rounded-sm border border-border bg-surface px-1.5 py-0.5 font-mono-num text-ink-muted">
                  {r.code} · {r.status}
                </span>
              ))}
            </div>
            <ChainRow a="2 independent reports" />
            <ChainRow a="Corroboration" arrow />
            <ChainRow a="Emerging signal" arrow strong />
            {signal && (
              <div className="mt-2 rounded-sm border border-status-amber-border bg-status-amber-bg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold text-ink">{signal.headline}</div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wide text-ink-soft">Confidence</div>
                    <div className="font-mono-num text-sm font-semibold text-ink">
                      {Math.round(signal.confidence * 100)}%
                    </div>
                  </div>
                </div>
                <ProgressBar percent={signal.confidence * 100} tone="yellow" className="mt-2" />
                <div className="mt-2 text-[11px] text-ink-muted">
                  Signals: {signal.reportIds.length} volunteer reports · Kumbh Pulse decision support · synthetic
                </div>
              </div>
            )}
          </section>
        )}

        {scene === "pulse" && focusSnapshot && (
          <section className="animate-fade-in-up">
            <PulsePanel zone={focusZone} snapshot={focusSnapshot} compact />
          </section>
        )}

        {scene === "drawer" && focusSnapshot && (
          <section className="animate-fade-in-up rounded-sm border border-status-red-border bg-surface p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-ink">Why is this zone at risk?</div>
              <StatusPill tone="red">Red</StatusPill>
            </div>
            <div className="mt-1 text-[11px] text-ink-soft">
              {focusZone.name} · score {focusSnapshot.score}/100 · model {focusSnapshot.modelVersion}
            </div>

            <div className="mt-3 space-y-2">
              {focusSnapshot.contributors.map((c) => (
                <div key={c.label} className="flex items-center gap-2.5">
                  <div className="w-32 shrink-0 text-xs text-ink-muted">{c.label}</div>
                  <ProgressBar percent={c.weightPercent} tone="red" className="flex-1" />
                  <div className="w-9 text-right font-mono-num text-xs text-ink">{c.weightPercent}%</div>
                </div>
              ))}
            </div>

            <div className="mt-3 border-t border-border pt-2 text-[11px] text-ink-muted">
              <div className="font-medium text-ink">Supporting signals</div>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                <li>Two corroborated field reports of a missing child on this approach</li>
                <li>Checkpoint reports of rising foot traffic pre-aarti</li>
                <li>Historical pattern: elevated density in this time window</li>
              </ul>
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
              <span className="text-[11px] text-ink-muted">Active incident in this zone</span>
              <SyntheticTag />
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
              Kumbh Pulse is explainable decision support — it shows its inputs and never acts on its own.
            </p>
          </section>
        )}

        {(scene === "incident" || scene === "dispatch" || scene === "incident-live") && incident && (
          <section className="animate-fade-in-up space-y-2">
            <SectionTitle>{scene === "incident" ? "Incident created" : "Active incident"}</SectionTitle>
            <IncidentCard incident={incident} zone={focusZone} />
            {scene === "dispatch" && (
              <div className="rounded-sm border border-status-green-border bg-status-green-bg p-2.5 text-xs">
                <Icon name="check" className="mr-1 inline h-3.5 w-3.5 align-[-2px] text-status-green" />
                <span className="font-semibold text-ink">V-233 dispatched</span> — task created, volunteer notified.
              </div>
            )}
          </section>
        )}

        {scene === "ops" && (
          <section className="animate-fade-in-up space-y-2">
            <SectionTitle>Ops Copilot</SectionTitle>
            <div className="rounded-sm border border-border bg-primary text-white">
              <div className="px-3 py-2 text-xs">{OPS_PROMPT}</div>
            </div>
            <div className="rounded-sm border border-border bg-surface p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-soft">
                Ops Copilot · reasoning
              </div>
              <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-ink-muted">
                {OPS_REASONING.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <div className="mt-2 rounded-sm bg-primary-soft px-2.5 py-1.5 text-xs font-medium text-primary-dark">
                {OPS_RECOMMENDATION}
              </div>
              <div className="mt-2 border-t border-border pt-1.5 text-[10px] leading-snug text-ink-soft">
                <div className="flex items-center gap-1">
                  <Icon name="layers" className="h-3 w-3" /> Powered by Sarvam · Grounded in Kumbh Setu data
                </div>
                <div className="mt-0.5 italic opacity-80">Scripted demo narration — deterministic, not a live generation</div>
              </div>
            </div>
            <ProposedAction
              tool="Assign volunteer"
              prompt="Dispatch V-233 (K. Bhosale) to this incident?"
              state="pending"
            />
          </section>
        )}

        {scene === "eventlog" && (
          <section className="animate-fade-in-up">
            <SectionTitle>Event Log — audited chain</SectionTitle>
            <ChainLog auditLog={auditLog} />
            <p className="mt-2 text-[11px] text-ink-soft">Every step carries an actor and a timestamp.</p>
          </section>
        )}
      </div>
    </div>
  );
}

type Scene =
  | "idle"
  | "reports"
  | "signal"
  | "pulse"
  | "drawer"
  | "incident"
  | "ops"
  | "dispatch"
  | "incident-live"
  | "eventlog";

function managementScene(stepIndex: number): Scene {
  if (stepIndex < 9) return "idle";
  if (stepIndex === 9) return "reports";
  if (stepIndex === 10) return "signal";
  if (stepIndex === 11) return "pulse";
  if (stepIndex === 12) return "drawer";
  if (stepIndex === 13) return "incident";
  if (stepIndex === 14) return "ops";
  if (stepIndex === 15) return "dispatch";
  if (stepIndex >= 16 && stepIndex <= 18) return "incident-live";
  return "eventlog";
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">{children}</div>
  );
}

function ChainRow({ a, arrow, strong }: { a: string; arrow?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {arrow && <Icon name="chevron-down" className="h-3.5 w-3.5 text-ink-soft" />}
      <span className={`text-xs ${strong ? "font-semibold text-ink" : "text-ink-muted"}`}>{a}</span>
    </div>
  );
}

const CHAIN: { label: string; match: (e: AuditEvent) => boolean; nth?: number }[] = [
  { label: "Ground report created", match: (e) => e.action === "GROUND_REPORT_CREATED" },
  { label: "Second ground report created", match: (e) => e.action === "GROUND_REPORT_CREATED", nth: 2 },
  { label: "Ground report corroborated", match: (e) => e.action === "GROUND_REPORT_CORROBORATED" },
  { label: "Signal promoted to incident", match: (e) => e.action === "GROUND_REPORT_PROMOTED_TO_INCIDENT" },
  { label: "Incident reported", match: (e) => e.action === "INCIDENT_REPORTED" },
  { label: "Incident triaged", match: (e) => e.action === "INCIDENT_TRIAGED" },
  { label: "Volunteer dispatched", match: (e) => e.action === "VOLUNTEER_DISPATCHED" },
  { label: "Task accepted", match: (e) => e.action === "TASK_ACCEPTED" },
  { label: "Task arrived", match: (e) => e.action === "TASK_ARRIVED" },
  { label: "Task resolved", match: (e) => e.action === "TASK_RESOLVED" },
];

function ChainLog({ auditLog }: { auditLog: AuditEvent[] }) {
  const asc = [...auditLog].reverse();
  return (
    <ol className="overflow-hidden rounded-sm border border-border">
      {CHAIN.map((step, i) => {
        const matches = asc.filter(step.match);
        const hit = matches[(step.nth ?? 1) - 1];
        return (
          <li
            key={i}
            className="flex items-center gap-2 border-b border-border px-2.5 py-1.5 text-[11px] last:border-0 odd:bg-surface even:bg-surface-muted/40"
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] ${
                hit ? "border-status-green bg-status-green text-white" : "border-border text-ink-soft"
              }`}
            >
              {hit ? "✓" : i + 1}
            </span>
            <span className={`flex-1 ${hit ? "text-ink" : "text-ink-soft"}`}>{step.label}</span>
            {hit && (
              <>
                <span className="font-mono-num text-ink-soft">{hit.actor}</span>
                <span className="font-mono-num text-ink-soft">{formatClock(hit.timestamp)}</span>
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}
