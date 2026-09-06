"use client";

import { useMemo, useState } from "react";
import { buildKumbhPlan, type KumbhPlanInput, type StayBase } from "@/lib/kumbhPlanner";
import type { LanguageCode } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SimTag } from "@/components/ui/SimTag";

const STAY: { id: StayBase; label: string }[] = [
  { id: "nashik", label: "In Nashik" },
  { id: "trimbakeshwar", label: "In Trimbakeshwar" },
  { id: "outside", label: "Outside / driving in" },
];

const TAG_META: Record<string, { label: string; tone: string }> = {
  snan: { label: "SNAN", tone: "bg-primary text-white" },
  travel: { label: "TRAVEL", tone: "bg-status-amber-bg text-status-amber" },
  darshan: { label: "DARSHAN", tone: "bg-secondary-soft text-secondary" },
  rest: { label: "REST", tone: "bg-surface-muted text-ink-muted" },
};

export function PlanScreen({ language }: { language: LanguageCode }) {
  const [from, setFrom] = useState("2027-09-10");
  const [to, setTo] = useState("2027-09-13");
  const [staying, setStaying] = useState<StayBase>("nashik");
  const [wantSnan, setWantSnan] = useState(true);
  const [size, setSize] = useState(2);
  const [elderly, setElderly] = useState(true);
  const [children, setChildren] = useState(false);
  const [wheelchair, setWheelchair] = useState(false);
  const [built, setBuilt] = useState(false);

  const input: KumbhPlanInput = useMemo(
    () => ({
      fromDate: from,
      toDate: to,
      staying,
      wantShahiSnan: wantSnan,
      group: { size, elderly, children, wheelchair },
      language,
    }),
    [from, to, staying, wantSnan, size, elderly, children, wheelchair, language]
  );
  const plan = useMemo(() => (built ? buildKumbhPlan(input) : null), [built, input]);

  if (!plan) {
    return (
      <div className="flex-1 overflow-y-auto scroll-thin p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-ink">Plan my Kumbh Mela</h1>
            <p className="text-xs text-ink-muted mt-0.5">
              A day-by-day plan for your dates — which ghat, when to go, your route and a checklist for your group.
            </p>
          </div>
          <SimTag label="DEMO DATES" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-ink-muted">
            Arriving
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="mt-1 w-full text-sm rounded-sm border border-border bg-surface px-2 py-1.5 focus:outline-none focus:border-primary" />
          </label>
          <label className="text-xs text-ink-muted">
            Leaving
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full text-sm rounded-sm border border-border bg-surface px-2 py-1.5 focus:outline-none focus:border-primary" />
          </label>
        </div>

        <div>
          <div className="text-xs text-ink-muted mb-1">Where are you staying?</div>
          <div className="flex rounded-sm border border-border overflow-hidden">
            {STAY.map((s) => (
              <button key={s.id} onClick={() => setStaying(s.id)}
                className={`flex-1 text-[11px] py-2 font-medium transition-colors ${staying === s.id ? "bg-primary text-white" : "bg-surface text-ink-muted"}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between rounded-sm border border-border bg-surface px-3 py-2.5">
          <span className="text-sm text-ink">Bathe on a principal Amrit Snan day</span>
          <input type="checkbox" checked={wantSnan} onChange={(e) => setWantSnan(e.target.checked)} className="h-4 w-4 accent-primary" />
        </label>

        <div>
          <div className="text-xs text-ink-muted mb-1.5">Your group</div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-ink">People</span>
            <input type="number" min={1} max={20} value={size} onChange={(e) => setSize(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 text-sm rounded-sm border border-border bg-surface px-2 py-1 focus:outline-none focus:border-primary" />
          </div>
          {[
            ["elderly", "Elderly pilgrim(s)", elderly, setElderly] as const,
            ["children", "Children", children, setChildren] as const,
            ["wheelchair", "Wheelchair / limited mobility", wheelchair, setWheelchair] as const,
          ].map(([id, label, val, set]) => (
            <label key={id} className="flex items-center justify-between rounded-sm border border-border bg-surface px-3 py-2 mb-1.5">
              <span className="text-sm text-ink">{label}</span>
              <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} className="h-4 w-4 accent-primary" />
            </label>
          ))}
        </div>

        <Button className="w-full" size="lg" onClick={() => setBuilt(true)}>
          Build my plan
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scroll-thin p-4 space-y-4 pb-8">
      <button onClick={() => setBuilt(false)} className="text-xs text-primary hover:text-primary-dark flex items-center gap-1">
        <Icon name="chevron-right" className="h-3 w-3 rotate-180" /> Change my details
      </button>

      <div className="rounded-sm border border-primary-soft bg-primary-soft/40 p-3">
        <div className="text-sm font-semibold text-primary-soft-ink">{plan.headline}</div>
        {plan.snanTarget && (
          <div className="text-xs text-ink-muted mt-1.5 space-y-1">
            <div>{plan.snanTarget.why}</div>
            <div className="font-medium text-ink">{plan.snanTarget.beReadyBy}</div>
          </div>
        )}
      </div>

      <Section title="Day by day">
        <div className="space-y-2">
          {plan.days.map((d) => (
            <div key={d.date} className="rounded-sm border border-border bg-surface p-3">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${TAG_META[d.tag]?.tone}`}>{TAG_META[d.tag]?.label}</span>
                <span className="text-xs text-ink-soft">{d.weekday}</span>
              </div>
              <div className="text-sm font-medium text-ink mt-1.5">{d.title}</div>
              <ul className="mt-1 space-y-1">
                {d.items.map((it, i) => (
                  <li key={i} className="text-xs text-ink-muted flex gap-1.5">
                    <span className="text-primary mt-0.5">•</span>
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Your route to the ghat">
        <ol className="space-y-1.5">
          {plan.route.map((r, i) => (
            <li key={i} className="text-xs text-ink-muted flex gap-2">
              <span className="shrink-0 h-4 w-4 rounded-full bg-surface-muted text-ink-soft text-[9px] flex items-center justify-center font-semibold">{i + 1}</span>
              {r}
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Facilities near your ghat">
        <div className="space-y-1.5">
          {plan.facilities.map((f, i) => (
            <div key={i} className="rounded-sm border border-border bg-surface px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wide text-ink-soft">{f.label}</div>
                  <div className="text-sm text-ink font-medium truncate">{f.name}</div>
                </div>
                {f.mapUrl && (
                  <a href={f.mapUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-primary hover:text-primary-dark inline-flex items-center gap-0.5 text-xs">
                    map <Icon name="arrow-up-right" className="h-3 w-3" />
                  </a>
                )}
              </div>
              {f.note && <div className="text-[11px] text-ink-soft mt-0.5">{f.note}</div>}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Checklist for your group">
        <ul className="space-y-1.5">
          {plan.checklist.map((c, i) => (
            <li key={i} className="text-xs text-ink-muted flex gap-1.5">
              <Icon name="check" className="h-3.5 w-3.5 text-status-green shrink-0 mt-0.5" />
              {c}
            </li>
          ))}
        </ul>
      </Section>

      <p className="text-[10px] text-ink-soft leading-relaxed">{plan.disclaimer}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft mb-2">{title}</div>
      {children}
    </div>
  );
}
