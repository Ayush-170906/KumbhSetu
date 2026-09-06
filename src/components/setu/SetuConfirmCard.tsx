"use client";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { PendingConfirmation } from "@/ai/orchestrator";

const RISK_LABEL: Record<PendingConfirmation["riskClass"], string> = {
  read: "Read-only",
  low_write: "Submit",
  high_write: "High-impact action",
};

/** Human-readable names for the tools Setu can propose in a confirm card. */
const TOOL_LABEL: Record<string, string> = {
  create_incident: "Create incident",
  escalate_incident: "Escalate incident",
  assign_volunteer: "Dispatch responder",
  publish_advisory: "Publish advisory",
  promote_signal_to_incident: "Promote signal to incident",
  create_ground_report: "File ground report",
  report_resource_issue: "Report resource issue",
  update_task_status: "Update task status",
};

function toolLabel(name: string): string {
  return TOOL_LABEL[name] ?? name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

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
        <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${high ? "text-status-amber" : "text-ink-soft"}`}>
          Setu proposed: {toolLabel(pending.tool.name)}
        </span>
      </div>
      <p className="text-sm text-ink leading-relaxed">{pending.prompt}</p>
      <div className={`mt-2 text-[10px] font-medium ${high ? "text-status-amber" : "text-ink-soft"}`}>
        {high ? "High-impact action · human confirmation required" : `${RISK_LABEL[pending.riskClass]} · your confirmation required`}
      </div>
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
