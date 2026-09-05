import type { Incident } from "@/lib/types";
import { formatClock } from "@/lib/format";

export function IncidentTimeline({ incident }: { incident: Incident }) {
  return (
    <ol className="relative border-l border-border pl-4 space-y-4">
      {incident.timeline.map((event, idx) => (
        <li key={idx} className="relative">
          <span
            className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-surface ${
              idx === incident.timeline.length - 1 ? "bg-primary" : "bg-ink-soft"
            }`}
          />
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium text-ink">{event.label}</span>
            <span className="font-mono-num text-[11px] text-ink-soft shrink-0">{formatClock(event.timestamp)}</span>
          </div>
          {event.actor && <div className="text-[11px] text-ink-muted mt-0.5">{event.actor}</div>}
        </li>
      ))}
    </ol>
  );
}
