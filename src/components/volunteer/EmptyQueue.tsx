import type { Volunteer } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

export function EmptyQueue({
  availability,
  onSimulateTask,
}: {
  availability: Volunteer["availability"];
  onSimulateTask: () => void;
}) {
  if (availability === "off_duty") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <Icon name="shield" className="h-8 w-8 text-ink-soft mb-3" />
        <h2 className="text-sm font-semibold text-ink">You&rsquo;re off duty</h2>
        <p className="text-xs text-ink-muted mt-1.5 max-w-xs">Switch to Available above to start receiving tasks.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <Icon name="check" className="h-8 w-8 text-status-green mb-3" />
      <h2 className="text-sm font-semibold text-ink">No active task</h2>
      <p className="text-xs text-ink-muted mt-1.5 max-w-xs">
        You&rsquo;ll be notified the moment a nearby SOS or incident needs a responder in your zone.
      </p>
      <Button variant="outline" size="sm" className="mt-5" onClick={onSimulateTask}>
        Simulate nearby SOS (demo)
      </Button>
    </div>
  );
}
