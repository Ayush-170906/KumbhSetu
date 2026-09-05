"use client";

import type { EmergingSignal, GroundReport, Zone } from "@/lib/types";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Icon } from "@/components/ui/Icon";
import { SimTag } from "@/components/ui/SimTag";
import { Button } from "@/components/ui/Button";
import { formatRelative } from "@/lib/format";

/**
 * Kumbh Pulse decision-support (§20). Weak field signals aggregated into one
 * item worth a human's attention — with its inputs shown, and a clear
 * "decision support, not automation" framing.
 */
export function EmergingSignals({
  signals,
  reports,
  zones,
  onPromote,
  compact,
}: {
  signals: EmergingSignal[];
  reports: GroundReport[];
  zones: Zone[];
  onPromote?: (reportId: string) => void;
  compact?: boolean;
}) {
  if (signals.length === 0) {
    return compact ? null : (
      <div className="rounded-sm border border-dashed border-border p-4 text-xs text-ink-soft">
        No emerging signals. Field reports that corroborate each other (or a single high-impact one) surface here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="pulse" className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-ink">Emerging signals</h3>
          </div>
          <SimTag label="DECISION SUPPORT · SYNTHETIC" />
        </div>
      )}

      {signals.map((s) => {
        const zone = zones.find((z) => z.id === s.zoneId);
        const backing = reports.filter((r) => s.reportIds.includes(r.id));
        const lead = backing[0];
        return (
          <div key={s.id} className="rounded-sm border border-status-amber-border bg-status-amber-bg p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-ink">{s.headline}</div>
                <div className="text-[11px] text-ink-muted mt-0.5">
                  {zone?.name ?? s.zoneId} · first seen {formatRelative(s.firstSeenAt)}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] uppercase tracking-wide text-ink-soft">Confidence</div>
                <div className="text-sm font-mono-num font-semibold text-ink">{Math.round(s.confidence * 100)}%</div>
              </div>
            </div>

            <ProgressBar percent={s.confidence * 100} tone="yellow" className="mt-2" />

            <div className="mt-2 text-[11px] text-ink-muted">
              <span className="font-medium text-ink">Signals:</span> {s.reportIds.length} volunteer report
              {s.reportIds.length === 1 ? "" : "s"}
              {s.pilgrimRequestCount > 0 ? `, ${s.pilgrimRequestCount} pilgrim request${s.pilgrimRequestCount === 1 ? "" : "s"}` : ""}
              {s.resourceFlag ? `, resource flag: ${s.resourceFlag}` : ""}.
            </div>
            <div className="mt-1 text-[11px] text-ink-muted">
              <span className="font-medium text-ink">Recommended:</span> {s.recommendedAction}
            </div>

            {onPromote && lead && !lead.linkedIncidentId && (
              <div className="mt-2.5">
                <Button size="sm" variant="outline" onClick={() => onPromote(lead.id)}>
                  Create incident from {lead.code}
                </Button>
              </div>
            )}
            {lead?.linkedIncidentId && (
              <div className="mt-2 text-[11px] text-status-green flex items-center gap-1">
                <Icon name="check" className="h-3 w-3" /> Incident raised from this signal
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
