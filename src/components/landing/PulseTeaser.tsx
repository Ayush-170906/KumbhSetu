import Link from "next/link";
import { RISK_SNAPSHOTS, ZONES } from "@/lib/seed";
import { StatusPill, bandLabel } from "@/components/ui/StatusPill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Icon } from "@/components/ui/Icon";
import { Section } from "./Section";

export function PulseTeaser() {
  const zone = ZONES.find((z) => z.id === "z04")!;
  const snapshot = RISK_SNAPSHOTS.z04;

  return (
    <Section
      eyebrow="Kumbh Pulse"
      title="Explainable crowd-risk intelligence — not a black box."
      lede="Kumbh Pulse produces a Green / Yellow / Red zone signal from a small set of inspectable inputs: crowd activity proxies, movement change, volunteer checkpoint reports and historical pattern. Every alert shows its reasoning, its model version and its confidence — never just a number."
    >
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="border border-border bg-surface rounded-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-ink">{zone.shortName}</div>
              <div className="text-xs text-ink-muted">{zone.name}</div>
            </div>
            <StatusPill tone={snapshot.band}>{bandLabel(snapshot.band)}</StatusPill>
          </div>
          <div className="text-3xl font-semibold text-ink font-mono-num mb-1">{snapshot.score}<span className="text-base text-ink-soft"> / 100</span></div>
          <p className="text-xs text-ink-muted mb-5">{snapshot.narrative}</p>
          <div className="space-y-2.5">
            {snapshot.contributors.map((c) => (
              <div key={c.label} className="flex items-center gap-3">
                <div className="w-32 shrink-0 text-xs text-ink-muted">{c.label}</div>
                <ProgressBar percent={c.weightPercent} tone="yellow" className="flex-1" />
                <div className="w-8 text-right text-xs font-mono-num text-ink">{c.weightPercent}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <PointRow title="Human-in-the-loop" body="Kumbh Pulse recommends and prioritizes within configured rules. Authorized operators remain accountable for every decision and can override at any time." />
          <PointRow title="Green never means safe" body="Absence of an elevated signal is not a declaration of safety — it means no elevated signal has been detected from available inputs." />
          <PointRow title="Staged model progression" body="This prototype runs Stage 0 — rule-based scoring over synthetic data. Later stages introduce validated historical data, calibrated forecasting and sensor fusion, always with retained explainability." />
          <Link href="/management" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark">
            See it inside the Control Room
            <Icon name="arrow-right" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </Section>
  );
}

function PointRow({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-l-2 border-border pl-4">
      <div className="text-sm font-semibold text-ink">{title}</div>
      <p className="text-xs text-ink-muted mt-1 leading-relaxed">{body}</p>
    </div>
  );
}
