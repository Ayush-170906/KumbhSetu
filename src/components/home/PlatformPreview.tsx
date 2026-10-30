"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { StatusPill } from "@/components/ui/StatusPill";
import { SimTag } from "@/components/ui/SimTag";
import { Icon } from "@/components/ui/Icon";
import { severityLabel, severityTone, typeLabel } from "@/lib/incidentMeta";
import { DEMO_SCENARIOS, type DemoScenario } from "@/lib/demoScript";
import { useAppStore } from "@/store/useAppStore";
import type { IncidentSeverity, IncidentType } from "@/lib/types";

type PreviewRole = "pilgrim" | "field" | "management";
const roles: { id: PreviewRole; label: string }[] = [
  { id: "pilgrim", label: "Pilgrim" },
  { id: "management", label: "Management" },
  { id: "field", label: "Volunteer" },
];
const scenarios: Record<DemoScenario, { type: IncidentType; severity: IncidentSeverity; zone: string; code: string; summary: string; status: string; volunteer: string }> = {
  medical: { type: "medical", severity: "critical", zone: "Ramkund Ghat · Z01", code: "DEMO-MED-01", summary: "A visitor needs assistance near the ghat approach. The control room can review and assign a sample responder.", status: "Reported · awaiting triage", volunteer: "V-101 · First aid" },
  missing: { type: "lost_person", severity: "moderate", zone: "Tapovan Ghat · Z02", code: "DEMO-LOST-01", summary: "A family is looking for a child near the sanitation block. Two sample field reports build a shared picture.", status: "Field reports · control room review", volunteer: "V-176 · Field response" },
  crowd: { type: "crowd_pressure", severity: "moderate", zone: "Transit corridor · Z05", code: "DEMO-CROWD-01", summary: "Movement is slowing along the transit route. A marshal task can be acknowledged and tracked in the demo.", status: "Reported · awaiting triage", volunteer: "V-142 · Crowd marshal" },
};

function PreviewContent() {
  const [role, setRole] = useState<PreviewRole>("management");
  const [scenario, setScenario] = useState<DemoScenario>("medical");
  const router = useRouter();
  const startDemo = useAppStore((state) => state.startDemo);
  const sample = scenarios[scenario];
  const runScenario = () => { startDemo(scenario); router.push("/demo"); };

  return (
    <section className="mx-auto max-w-6xl px-5 pb-16 pt-8 sm:px-8 sm:pb-20" aria-labelledby="product-preview-title">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="eyebrow text-primary-dark">One incident · one connected response</p><h2 id="product-preview-title" className="text-display mt-1 text-2xl text-ink sm:text-3xl">See the workflow in context</h2></div>
        <SimTag label="ILLUSTRATIVE DEMO SCENARIO" />
      </div>

      <div className="mt-5 grid overflow-hidden border border-border bg-surface shadow-panel lg:grid-cols-[15rem_1fr]">
        <aside className="border-b border-border bg-surface-muted/50 p-3 lg:border-b-0 lg:border-r">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">Choose a scenario</p>
          <div className="space-y-1">
            {(Object.keys(DEMO_SCENARIOS) as DemoScenario[]).map((id) => (
              <button key={id} type="button" aria-pressed={scenario === id} onClick={() => setScenario(id)} className={`flex min-h-11 w-full items-center justify-between border px-3 text-left text-xs font-medium ${scenario === id ? "border-primary bg-surface text-primary-dark" : "border-transparent text-ink-muted hover:bg-surface"}`}>
                {DEMO_SCENARIOS[id].title}<Icon name="chevron-right" className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
          <p className="px-2 pt-3 text-[11px] leading-relaxed text-ink-soft">All names, incident details and activity are synthetic. Starting a guided demo uses the isolated demo workflow.</p>
        </aside>

        <div className="min-w-0 p-4 sm:p-6">
          <nav aria-label="Workflow perspective" className="mb-5 flex flex-wrap gap-1 border-b border-border pb-3">
            {roles.map(({ id, label }, index) => <button key={id} type="button" aria-pressed={role === id} onClick={() => setRole(id)} className={`min-h-10 border-b-2 px-3 text-xs font-semibold ${role === id ? "border-primary text-primary-dark" : "border-transparent text-ink-soft hover:text-ink"}`}>{String(index + 1).padStart(2, "0")} · {label}</button>)}
          </nav>

          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(15rem,.85fr)] md:items-start">
            <article className="border-l-2 border-primary bg-surface-muted/60 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2"><StatusPill tone={severityTone(sample.severity)}>{severityLabel(sample.severity)}</StatusPill><span className="font-mono-num text-xs text-ink-soft">{sample.code}</span></div>
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[.12em] text-ink-soft">{role === "pilgrim" ? "Pilgrim report" : role === "field" ? "Volunteer assignment" : "Management incident"}</p>
              <h3 className="mt-1 text-lg font-semibold text-ink">{typeLabel(sample.type)} · {sample.zone}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{sample.summary}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3 text-xs text-ink-soft"><span>{sample.status}</span>{role !== "pilgrim" && <span>Suggested responder: {sample.volunteer}</span>}</div>
            </article>

            <div className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-ink-soft">How roles connect</p>
              <ol className="space-y-0">
                {[
                  { title: role === "pilgrim" ? "Describe the need" : "Report received", body: "Saved as an explicitly labelled local demo incident." },
                  { title: role === "management" ? "Review and assign" : "Control room review", body: "A human operator can inspect priority, location and context." },
                  { title: role === "field" ? "Acknowledge and respond" : "Volunteer response", body: "Assignment, arrival and resolution actions are recorded in the prototype timeline." },
                ].map((item, index) => <li key={item.title} className="relative flex gap-3 pb-4 last:pb-0"><span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center border border-border bg-surface font-mono-num text-[10px] text-primary">{index + 1}</span><span className="absolute left-3 top-6 h-[calc(100%-1rem)] border-l border-border last:hidden" aria-hidden="true"/><span><span className="block text-xs font-semibold text-ink">{item.title}</span><span className="mt-0.5 block text-[11px] leading-relaxed text-ink-muted">{item.body}</span></span></li>)}
              </ol>
              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <button type="button" onClick={runScenario} className="inline-flex min-h-11 items-center justify-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark">Play {DEMO_SCENARIOS[scenario].title}<Icon name="arrow-right" className="h-4 w-4" /></button>
                <Link href={`/demo?scenario=${scenario}`} className="inline-flex min-h-11 items-center justify-center border border-border-strong px-4 text-sm font-semibold text-ink hover:bg-surface-muted">Open demo studio</Link>
              </div>
              <p className="text-[10px] leading-relaxed text-ink-soft">Prototype only. No real emergency service, authority or responder is contacted.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PlatformPreview() {
  return <ClientOnly fallback={<div className="mx-auto my-8 h-80 max-w-6xl animate-pulse border-y border-border bg-surface-muted/50" aria-hidden="true" />}><PreviewContent /></ClientOnly>;
}
