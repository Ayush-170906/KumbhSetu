"use client";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SyntheticTag } from "./DemoShared";
import { demoStep } from "@/lib/demoScript";

export function DemoControls({
  running,
  paused,
  completed,
  stepIndex,
  totalSteps,
  onStart,
  onPause,
  onResume,
  onSkip,
  onRestart,
  onExit,
}: {
  running: boolean;
  paused: boolean;
  completed: boolean;
  stepIndex: number;
  totalSteps: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onRestart: () => void;
  onExit: () => void;
}) {
  const started = running || completed;
  const shown = Math.min(Math.max(stepIndex, 1), totalSteps);
  const meta = demoStep(shown);
  const pct = completed ? 100 : Math.min(100, (stepIndex / totalSteps) * 100);

  return (
    <div className="shrink-0 border-b border-border bg-surface">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-secondary">
            <Icon name="target" className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold leading-tight text-ink">
              Kumbh Setu — From Ground Observation to Coordinated Response
            </div>
            <div className="truncate text-[11px] text-ink-soft">
              One scripted incident, driving Pilgrim · Volunteer · Management together
            </div>
          </div>
        </div>

        <SyntheticTag />

        <div className="ml-auto flex items-center gap-2">
          {!started && (
            <Button onClick={onStart}>
              <Icon name="navigation" className="h-4 w-4" /> Run Live Demo
            </Button>
          )}

          {running && !completed && stepIndex < totalSteps && (
            <>
              {paused ? (
                <Button onClick={onResume}>
                  <Icon name="navigation" className="h-4 w-4" /> Resume
                </Button>
              ) : (
                <Button variant="outline" onClick={onPause}>
                  <Icon name="clock" className="h-4 w-4" /> Pause
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onSkip}>
                Skip step <Icon name="chevron-right" className="h-3.5 w-3.5" />
              </Button>
            </>
          )}

          {completed && (
            <Button onClick={onRestart}>
              <Icon name="route" className="h-4 w-4" /> Replay
            </Button>
          )}

          {started && (
            <>
              <Button variant="ghost" size="sm" onClick={onRestart}>
                <Icon name="route" className="h-3.5 w-3.5" /> Restart
              </Button>
              <Button variant="ghost" size="sm" onClick={onExit}>
                Exit demo
              </Button>
            </>
          )}
        </div>
      </div>

      {started && (
        <div className="flex items-center gap-3 border-t border-border px-4 py-1.5">
          <span className="shrink-0 font-mono-num text-[11px] font-semibold text-ink">
            DEMO {String(shown).padStart(2, "0")} / {totalSteps}
          </span>
          <span className="shrink-0 font-mono-num text-[11px] text-ink-soft">{meta.clock}</span>
          <span className="min-w-0 flex-1 truncate text-xs text-ink">
            {meta.title}
            {paused && <span className="ml-2 font-semibold uppercase tracking-wide text-status-amber">· Paused</span>}
            {completed && <span className="ml-2 font-semibold uppercase tracking-wide text-status-green">· Complete</span>}
          </span>
          <div className="h-1.5 w-40 shrink-0 overflow-hidden rounded-full bg-surface-sunk">
            <div
              className={`h-full transition-[width] duration-500 ${paused ? "bg-status-amber" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
