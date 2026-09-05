import { Button } from "@/components/ui/Button";
import { SimTag } from "@/components/ui/SimTag";
import { Icon } from "@/components/ui/Icon";

export function DemoControls({
  running,
  completed,
  stepIndex,
  totalSteps,
  onStart,
}: {
  running: boolean;
  completed: boolean;
  stepIndex: number;
  totalSteps: number;
  onStart: () => void;
}) {
  return (
    <div className="flex items-center gap-4 px-4 h-16 border-b border-border bg-surface shrink-0">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-sm bg-secondary flex items-center justify-center">
          <Icon name="target" className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-ink leading-tight">Live Demo — Medical Assistance, Ghat 4</div>
          <div className="text-[11px] text-ink-soft">Scripted scenario driving all three role experiences</div>
        </div>
      </div>

      <SimTag label="SIMULATED SCENARIO" className="ml-2" />

      <div className="ml-auto flex items-center gap-3">
        {(running || completed) && (
          <div className="flex items-center gap-2 w-40">
            <div className="h-1.5 flex-1 rounded-full bg-surface-sunk overflow-hidden">
              <div
                className="h-full bg-primary transition-[width] duration-500"
                style={{ width: `${Math.min(100, (stepIndex / totalSteps) * 100)}%` }}
              />
            </div>
            <span className="text-[11px] text-ink-soft font-mono-num shrink-0">{Math.min(stepIndex, totalSteps)}/{totalSteps}</span>
          </div>
        )}
        <Button onClick={onStart} disabled={running}>
          {completed ? "Replay Scenario" : running ? "Running…" : "Run Live Demo"}
        </Button>
      </div>
    </div>
  );
}
