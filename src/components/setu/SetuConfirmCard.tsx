"use client";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { PendingConfirmation } from "@/ai/orchestrator";

const RISK_LABEL: Record<PendingConfirmation["riskClass"], string> = {
  read: "Read-only",
  low_write: "Submit",
  high_write: "High-impact action",
};

/**
 * The human-in-the-loop gate (§13). No high-risk tool runs until the volunteer
 * taps Submit here.
 */
export function SetuConfirmCard({
  pending,
  busy,
  onConfirm,
  onCancel,
}: {
  pending: PendingConfirmation;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const high = pending.riskClass === "high_write";
  return (
    <div
      className={`mx-3 mb-2 rounded-sm border p-3 animate-fade-in-up ${
        high ? "border-status-amber-border bg-status-amber-bg" : "border-border bg-surface"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon name={high ? "warning" : "check"} className={`h-3.5 w-3.5 ${high ? "text-status-amber" : "text-ink-muted"}`} />
        <span className={`text-[10px] font-semibold uppercase tracking-wide ${high ? "text-status-amber" : "text-ink-soft"}`}>
          {RISK_LABEL[pending.riskClass]} · Setu needs your confirmation
        </span>
      </div>
      <p className="text-sm text-ink leading-relaxed">{pending.prompt}</p>
      <div className="flex gap-2 mt-3">
        <Button size="sm" onClick={onConfirm} disabled={busy} className="flex-1">
          {busy ? "Working…" : high ? "Submit" : "Confirm"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={busy} className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  );
}
