"use client";

import { useState } from "react";
import type { Zone, RiskSnapshot } from "@/lib/types";
import { PulsePanel } from "@/components/pulse/PulsePanel";
import { StatusPill, bandLabel } from "@/components/ui/StatusPill";
import { SimTag } from "@/components/ui/SimTag";
import { Panel } from "@/components/ui/Panel";

export function PulseView({ zones, riskSnapshots }: { zones: Zone[]; riskSnapshots: Record<string, RiskSnapshot> }) {
  const sorted = [...zones].sort((a, b) => b.riskScore - a.riskScore);
  const [selected, setSelected] = useState(sorted[0]?.id);
  const activeZone = zones.find((z) => z.id === selected) ?? zones[0];
  const activeSnapshot = riskSnapshots[activeZone.id];

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-editorial text-xl text-ink">Kumbh Pulse</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Explainable, rule-based crowd-risk intelligence — Stage 0 of a staged model progression.
          </p>
        </div>
        <SimTag label="SYNTHETIC SIGNALS" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Panel className="md:col-span-1 !p-0">
          <div className="p-3 border-b border-border text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft">
            All zones
          </div>
          <div className="divide-y divide-border">
            {sorted.map((z) => (
              <button
                key={z.id}
                onClick={() => setSelected(z.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${
                  z.id === activeZone.id ? "bg-primary-soft/40" : "hover:bg-surface-muted"
                }`}
              >
                <div>
                  <div className="text-xs font-medium text-ink">{z.shortName}</div>
                  <div className="text-[10.5px] text-ink-soft">score {z.riskScore}</div>
                </div>
                <StatusPill tone={z.riskBand}>{bandLabel(z.riskBand)}</StatusPill>
              </button>
            ))}
          </div>
        </Panel>

        <Panel className="md:col-span-2">{activeSnapshot && <PulsePanel zone={activeZone} snapshot={activeSnapshot} />}</Panel>
      </div>

      <Panel>
        <p className="text-xs text-ink-muted leading-relaxed">
          <strong className="text-ink">How to read this:</strong> Kumbh Pulse produces a 0–100 score from a small,
          inspectable set of signals — it never presents a single opaque number. Green means normal monitoring. Yellow
          means elevated attention and preventive readiness. Red means a prominent alert requiring human review. The
          model version and confidence are always shown alongside the score, and a human operator can override any
          recommendation at any time. This build uses rule-based scoring (Stage 0) over synthetic/test signals — it is
          decision support, not a certified safety determination.
        </p>
      </Panel>
    </div>
  );
}
