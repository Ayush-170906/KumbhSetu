"use client";

import { Icon } from "@/components/ui/Icon";
import { RESPONSE_LOOP, SETU_PROVENANCE, SETU_DEMO_NOTE, SYNTHETIC_DATA_LABEL } from "@/lib/demoScript";

/** The Observe → Corroborate → Signal → Decide → Resolve → Audit loop. */
export function DemoLoopDiagram({ activeIndex = -1, compact = false }: { activeIndex?: number; compact?: boolean }) {
  return (
    <div className={`flex flex-wrap items-stretch justify-center gap-2 ${compact ? "" : "gap-3"}`}>
      {RESPONSE_LOOP.map((stage, i) => {
        const active = i === activeIndex;
        const done = activeIndex >= 0 && i < activeIndex;
        return (
          <div key={stage.key} className="flex items-center gap-2">
            <div
              className={`rounded-sm border px-3 py-2 text-center transition-colors duration-300 ${
                active
                  ? "border-primary bg-primary-soft"
                  : done
                  ? "border-status-green-border bg-status-green-bg"
                  : "border-border bg-surface"
              } ${compact ? "min-w-[84px]" : "min-w-[104px]"}`}
            >
              <div
                className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${
                  active ? "text-primary-dark" : done ? "text-status-green" : "text-ink"
                }`}
              >
                {stage.label}
              </div>
              {!compact && <div className="mt-1 text-[10px] leading-snug text-ink-soft">{stage.blurb}</div>}
            </div>
            {i < RESPONSE_LOOP.length - 1 && (
              <Icon name="arrow-right" className="h-3.5 w-3.5 shrink-0 text-ink-soft" />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Standard provenance line for a Setu AI surface, with a "scripted" caveat. */
export function SetuProvenance({ note = true }: { note?: boolean }) {
  return (
    <div className="mt-2 border-t border-border pt-1.5 text-[10px] leading-snug text-ink-soft">
      <div className="flex items-center gap-1">
        <Icon name="layers" className="h-3 w-3 shrink-0" />
        {SETU_PROVENANCE}
      </div>
      {note && <div className="mt-0.5 italic opacity-80">{SETU_DEMO_NOTE}</div>}
    </div>
  );
}

/** "Setu proposed: <tool>" confirmation strip, mirroring SetuConfirmCard. */
export function ProposedAction({
  tool,
  prompt,
  state,
}: {
  tool: string;
  prompt: string;
  state: "pending" | "confirmed";
}) {
  const confirmed = state === "confirmed";
  return (
    <div
      className={`rounded-sm border p-3 animate-fade-in-up ${
        confirmed ? "border-status-green-border bg-status-green-bg" : "border-status-amber-border bg-status-amber-bg"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <Icon name={confirmed ? "check" : "warning"} className={`h-3.5 w-3.5 ${confirmed ? "text-status-green" : "text-status-amber"}`} />
        <span
          className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${
            confirmed ? "text-status-green" : "text-status-amber"
          }`}
        >
          Setu proposed: {tool}
        </span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-ink">{prompt}</p>
      <div className={`mt-2 flex items-center gap-1.5 text-[10px] font-medium ${confirmed ? "text-status-green" : "text-status-amber"}`}>
        {confirmed ? (
          <>
            <Icon name="check" className="h-3 w-3" /> Confirmed by a human — action executed
          </>
        ) : (
          <>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-status-amber animate-pulse" />
            High-impact action · human confirmation required
          </>
        )}
      </div>
    </div>
  );
}

/** Synthetic-data disclaimer used wherever operational values are shown. */
export function SyntheticTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border border-border-strong bg-surface-sunk px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-muted ${className}`}
      title="Every value in the Live Demo is synthetic — not real operational Kumbh data."
    >
      <Icon name="layers" className="h-3 w-3" />
      {SYNTHETIC_DATA_LABEL}
    </span>
  );
}

/** A chat-style bubble for the scripted transcripts. */
export function DemoBubble({
  from,
  label,
  children,
  tone = "neutral",
}: {
  from: "pilgrim" | "assistant" | "volunteer";
  label: string;
  children: React.ReactNode;
  tone?: "neutral" | "emergency";
}) {
  const align = from === "volunteer" ? "justify-end" : "justify-start";
  const bubble =
    from === "volunteer"
      ? "bg-primary text-white"
      : tone === "emergency"
      ? "bg-status-red-bg border border-status-red-border text-status-red"
      : from === "pilgrim"
      ? "bg-secondary-soft border border-border text-ink"
      : "bg-surface border border-border text-ink";
  return (
    <div className={`flex ${align}`}>
      <div className={`max-w-[88%] rounded-sm px-3 py-2 text-sm leading-relaxed ${bubble}`}>
        <div className="mb-0.5 text-[9.5px] font-semibold uppercase tracking-wide opacity-70">{label}</div>
        <div className="whitespace-pre-line">{children}</div>
      </div>
    </div>
  );
}
