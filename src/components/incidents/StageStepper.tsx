import type { IncidentStatus } from "@/lib/types";
import { INCIDENT_STAGES, statusLabel, stageIndex } from "@/lib/incidentMeta";

export function StageStepper({ status }: { status: IncidentStatus }) {
  if (status === "escalated" || status === "cancelled") {
    return <div className="text-xs font-medium text-status-red">{statusLabel(status)}</div>;
  }
  const current = stageIndex(status);

  return (
    <div className="w-full min-w-0">
      <div className="flex items-center gap-1 w-full">
        {INCIDENT_STAGES.map((stage, idx) => (
          <div
            key={stage}
            className={`h-1.5 flex-1 min-w-0 rounded-full ${idx <= current ? "bg-primary" : "bg-surface-sunk"}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs font-semibold text-ink">{statusLabel(INCIDENT_STAGES[current])}</span>
        <span className="text-[10px] text-ink-soft">
          Step {current + 1} of {INCIDENT_STAGES.length}
        </span>
      </div>
    </div>
  );
}
