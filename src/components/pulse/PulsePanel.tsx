import type { Zone, RiskSnapshot } from "@/lib/types";
import { StatusPill, bandLabel } from "@/components/ui/StatusPill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { RiskGauge } from "./RiskGauge";
import { formatClockShort } from "@/lib/format";

export function PulsePanel({
  zone,
  snapshot,
  compact = false,
}: {
  zone: Zone;
  snapshot: RiskSnapshot;
  compact?: boolean;
}) {
  const barTone = snapshot.band === "red" ? "red" : snapshot.band === "yellow" ? "yellow" : "green";

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-1">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">Kumbh Pulse</div>
          <div className="text-xs text-ink-muted -mt-0.5">Explainable crowd-risk intelligence</div>
        </div>
        <StatusPill tone={snapshot.band}>{bandLabel(snapshot.band)}</StatusPill>
      </div>

      <div className="flex items-center gap-4 mt-3">
        <RiskGauge score={snapshot.score} band={snapshot.band} size={compact ? 100 : 128} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-ink">{zone.shortName}</div>
          <div className="text-xs text-ink-muted">{zone.name}</div>
          {snapshot.forecastBand && snapshot.forecastHorizonMinutes ? (
            <div className="mt-2 text-xs text-ink-muted">
              Forecast: <span className="font-medium text-ink">{bandLabel(snapshot.forecastBand)}</span> in{" "}
              {snapshot.forecastHorizonMinutes[0]}–{snapshot.forecastHorizonMinutes[1]} min
            </div>
          ) : (
            <div className="mt-2 text-xs text-ink-muted">No elevated forecast at this time</div>
          )}
        </div>
      </div>

      <p className="text-xs text-ink-muted leading-relaxed mt-3 border-t border-border pt-3">
        {snapshot.narrative}
      </p>

      <div className="mt-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft mb-2">
          Why this zone is {bandLabel(snapshot.band).toLowerCase()}
        </div>
        <div className="space-y-2">
          {snapshot.contributors.map((c) => (
            <div key={c.label} className="flex items-center gap-2.5">
              <div className="w-32 shrink-0 text-xs text-ink-muted">{c.label}</div>
              <ProgressBar percent={c.weightPercent} tone={barTone} className="flex-1" />
              <div className="w-9 text-right text-xs font-mono-num text-ink">{c.weightPercent}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-[10px] text-ink-soft">
        <span>
          Model {snapshot.modelVersion} · confidence {Math.round(snapshot.confidence * 100)}%
        </span>
        <span>Updated {formatClockShort(snapshot.generatedAt)}</span>
      </div>
    </div>
  );
}
