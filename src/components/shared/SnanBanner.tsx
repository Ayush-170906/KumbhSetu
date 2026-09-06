"use client";

import { getSnanBriefing, CLUSTER_LABEL } from "@/lib/snanCalendar";
import { Icon } from "@/components/ui/Icon";

/**
 * "Where is the holy dip today?" — a shared banner driven by the snan calendar.
 * Shows today's principal bathing day if there is one, otherwise counts down to
 * the next. Used on the pilgrim home and the Common Operations Board.
 */
export function SnanBanner({ className = "" }: { className?: string }) {
  const b = getSnanBriefing(); // demo "today" sits inside the Simhastha window
  const day = b.today;

  return (
    <div
      className={`rounded-md border overflow-hidden ${
        day
          ? "border-primary bg-gradient-to-br from-primary-soft to-primary-soft/40"
          : "border-border bg-surface"
      } ${className}`}
    >
      <div className="flex items-start gap-3 p-3">
        <div
          className={`h-9 w-9 rounded-md flex items-center justify-center shrink-0 ${
            day ? "bg-primary text-white" : "bg-surface-muted text-ink-muted"
          }`}
        >
          <Icon name="water" className="h-5 w-5" />
        </div>

        {day ? (
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary-dark">
                Holy dip today
              </span>
              {day.peak && (
                <span className="text-[9px] uppercase tracking-wide bg-status-red text-white rounded-sm px-1 py-px">
                  Peak day
                </span>
              )}
            </div>
            <div className="text-sm font-semibold text-ink mt-0.5">{day.name}</div>
            <div className="text-[11px] text-ink-muted mt-0.5">
              {day.sects} · {day.site}
            </div>
            <div className="text-[11px] text-ink-soft mt-1 leading-snug">{day.guidance}</div>
            {b.next && (
              <div className="text-[11px] text-ink-soft mt-1">
                Next: {b.next.name}{" "}
                {b.daysToNext === 1 ? "tomorrow" : `in ${b.daysToNext} days`} ·{" "}
                {CLUSTER_LABEL[b.next.cluster]}
              </div>
            )}
          </div>
        ) : (
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">
              Next holy dip
            </div>
            {b.next ? (
              <>
                <div className="text-sm font-semibold text-ink mt-0.5">{b.next.name}</div>
                <div className="text-[11px] text-ink-muted mt-0.5">
                  {b.daysToNext === 1 ? "Tomorrow" : `In ${b.daysToNext} days`} ·{" "}
                  {b.next.sects} · {b.next.site}
                </div>
              </>
            ) : (
              <div className="text-xs text-ink-muted mt-0.5">
                No principal bathing day scheduled in the window.
              </div>
            )}
          </div>
        )}
      </div>
      <div className="px-3 pb-2 text-[10px] text-ink-soft">{b.disclaimer}</div>
    </div>
  );
}
