"use client";

import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { DemoLoopDiagram, SyntheticTag } from "./DemoShared";
import { OUTRO_LINES, OUTRO_WORDMARK, OUTRO_TAGLINE } from "@/lib/demoScript";

const ROLES = [
  { icon: "pilgrim" as const, title: "Pilgrim", line: "Needs help" },
  { icon: "volunteer" as const, title: "Volunteer", line: "Acts on the ground" },
  { icon: "management" as const, title: "Management", line: "Coordinates response" },
];

/** Full-bleed cover shown before the demo starts and on step 1 (intro). */
export function DemoIntro({ onStart, started }: { onStart: () => void; started: boolean }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 overflow-y-auto bg-ivory/95 px-6 py-5 backdrop-blur-sm">
      <div className="text-center">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-soft">Kumbh Setu — Live Demo</div>
        <h1 className="mt-1 max-w-2xl text-lg font-semibold text-ink">
          From Ground Observation to Coordinated Response
        </h1>
        <p className="mt-1 text-sm text-ink-muted">One connected response platform for mass gatherings.</p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-3 gap-3">
        {ROLES.map((r) => (
          <div key={r.title} className="rounded-sm border border-border bg-surface p-3 text-center">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-sm bg-primary-soft">
              <Icon name={r.icon} className="h-4 w-4 text-primary-dark" />
            </div>
            <div className="mt-1.5 text-sm font-semibold text-ink">{r.title}</div>
            <div className="text-[11px] text-ink-soft">{r.line}</div>
          </div>
        ))}
      </div>

      <div className="w-full max-w-3xl">
        <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          The response loop
        </div>
        <DemoLoopDiagram compact />
      </div>

      <div className="flex flex-col items-center gap-2">
        <SyntheticTag />
        {!started && (
          <Button onClick={onStart}>
            <Icon name="navigation" className="h-4 w-4" /> Run Live Demo
          </Button>
        )}
        {started && <div className="text-xs text-ink-soft">Starting…</div>}
      </div>
    </div>
  );
}

/** Full-bleed closing card shown on the final step. */
export function DemoOutro({ onReplay, onExit }: { onReplay: () => void; onExit: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 overflow-y-auto bg-ink px-6 py-8 text-center text-white">
      <div className="w-full max-w-3xl">
        <DemoLoopDiagram activeIndex={-1} />
      </div>

      <div className="space-y-1">
        {OUTRO_LINES.map((l, i) => (
          <p key={l} className={i === 0 ? "text-lg font-semibold" : "text-sm text-white/70"}>
            {l}
          </p>
        ))}
      </div>

      <div className="mt-2">
        <div className="text-2xl font-semibold tracking-[0.08em]">{OUTRO_WORDMARK}</div>
        <div className="mt-1 text-sm text-white/70">{OUTRO_TAGLINE}</div>
      </div>

      <div className="flex gap-2">
        <Button onClick={onReplay}>
          <Icon name="route" className="h-4 w-4" /> Replay
        </Button>
        <Button variant="outline" className="border-white/40 text-white hover:bg-white/10" onClick={onExit}>
          Exit demo
        </Button>
      </div>
    </div>
  );
}
