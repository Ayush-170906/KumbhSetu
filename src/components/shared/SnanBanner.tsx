"use client";

import { getSnanBriefing, CLUSTER_LABEL } from "@/lib/snanCalendar";
import { Icon } from "@/components/ui/Icon";

/**
 * Illustrative schedule excerpt. It must not be presented as a current or
 * authority-issued bathing schedule.
 */
export function SnanBanner({ className = "" }: { className?: string }) {
  const b = getSnanBriefing();
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
                Illustrative schedule · {day.date}
              </span>
              {day.peak && (
                <span className="text-[9px] uppercase tracking-wide bg-status-red text-white rounded-sm px-1 py-px">
                  Sample peak-day label
                </span>
              )}
            </div>
            <div className="text-sm font-semibold text-ink mt-0.5">{day.name}</div>
            <div className="text-[11px] text-ink-muted mt-0.5">
              {day.sects} · {day.site}
            </div>
            <div className="text-[11px] text-ink-soft mt-1 leading-snug">Illustrative scenario entry; verify official dates and operating guidance.</div>
            {b.next && (
              <div className="text-[11px] text-ink-soft mt-1">
                Next sample date: {b.next.date} · {b.next.name} · {CLUSTER_LABEL[b.next.cluster]}
              </div>
            )}
          </div>
        ) : (
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">
              Next sample schedule entry
            </div>
            {b.next ? (
              <>
                <div className="text-sm font-semibold text-ink mt-0.5">{b.next.name}</div>
                <div className="text-[11px] text-ink-muted mt-0.5">
                  {b.next.date} · {b.next.sects} · {b.next.site}
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
