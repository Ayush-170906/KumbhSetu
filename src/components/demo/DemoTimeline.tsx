import type { DemoLogEntry } from "@/store/useAppStore";
import { formatClock } from "@/lib/format";

export function DemoTimeline({ log }: { log: DemoLogEntry[] }) {
  return (
    <div className="space-y-0">
      {log.length === 0 && (
        <p className="text-xs text-ink-soft px-3 py-4">Press &ldquo;Run Live Demo&rdquo; to start the scripted scenario.</p>
      )}
      {log.map((entry, idx) => (
        <div
          key={entry.id}
          className={`flex items-center gap-3 px-3 py-2 text-xs border-b border-border last:border-0 ${
            idx === log.length - 1 ? "bg-primary-soft/40" : ""
          }`}
        >
          <span className="font-mono-num text-ink-soft shrink-0 w-20">{formatClock(entry.time)}</span>
          <span className="text-ink">{entry.label}</span>
        </div>
      ))}
    </div>
  );
}
