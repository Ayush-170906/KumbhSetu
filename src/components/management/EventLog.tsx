import type { AuditEvent } from "@/lib/types";
import { formatClock } from "@/lib/format";

export function EventLog({ events, dense = false }: { events: AuditEvent[]; dense?: boolean }) {
  return (
    <div className={dense ? "space-y-0" : "space-y-0 border border-border rounded-sm overflow-hidden"}>
      {events.length === 0 && <p className="text-xs text-ink-soft p-3">No events yet.</p>}
      {events.map((e) => (
        <div
          key={e.id}
          className="flex items-start gap-3 px-3 py-2 text-xs border-b border-border last:border-0 odd:bg-surface even:bg-surface-muted/40"
        >
          <span className="font-mono-num text-ink-soft shrink-0 w-20">{formatClock(e.timestamp)}</span>
          <span className="font-mono-num text-ink-soft shrink-0 w-16 truncate">{e.actor}</span>
          <span className="font-medium text-ink shrink-0">{e.action.replace(/_/g, " ")}</span>
          <span className="text-ink-muted truncate">
            {e.entity !== "system" && `${e.entity} ${e.entityId}`} {e.metadata ? `· ${e.metadata}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
