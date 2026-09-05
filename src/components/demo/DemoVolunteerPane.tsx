import type { Incident, Task, Volunteer, Zone } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { PaneHeader } from "./DemoPilgrimPane";

const stateCopy: Record<Task["state"], { label: string; hint: string }> = {
  created: { label: "Created", hint: "" },
  assigned: { label: "New Task", hint: "Awaiting response" },
  accepted: { label: "Accepted", hint: "En route" },
  in_progress: { label: "En Route", hint: "Navigating to incident" },
  arrived: { label: "On Site", hint: "Assessing situation" },
  resolved: { label: "Resolved", hint: "Response complete" },
  escalated: { label: "Escalated", hint: "Further response requested" },
  cancelled: { label: "Cancelled", hint: "" },
};

export function DemoVolunteerPane({
  volunteer,
  task,
  incident,
  zone,
}: {
  volunteer?: Volunteer;
  task?: Task;
  incident?: Incident;
  zone?: Zone;
}) {
  return (
    <div className="flex-1 flex flex-col p-4">
      <PaneHeader icon="volunteer" title="Volunteer" subtitle={volunteer ? `${volunteer.name} · ${volunteer.id}` : undefined} />

      {!task || !incident ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
          <div className="h-12 w-12 rounded-full bg-status-green-bg flex items-center justify-center">
            <Icon name="check" className="h-5 w-5 text-status-green" />
          </div>
          <p className="text-xs text-ink-muted max-w-[16rem]">No active task — standing by, available.</p>
        </div>
      ) : (
        <div className="mt-2 space-y-4 animate-fade-in-up">
          <div className="rounded-sm border border-border bg-surface p-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-ink-soft">{zone?.shortName}</div>
              <div className="text-sm font-semibold text-ink mt-0.5">{stateCopy[task.state].label}</div>
            </div>
            <StatusPill tone={task.state === "resolved" ? "green" : task.state === "assigned" ? "yellow" : "info"}>
              {task.state === "assigned" ? "Pending" : task.state === "resolved" ? "Complete" : "Active"}
            </StatusPill>
          </div>
          <p className="text-xs text-ink-muted">{stateCopy[task.state].hint}</p>
          <div className="rounded-sm border border-border bg-surface-muted px-3 py-2.5 text-xs">
            <div className="text-ink-soft">Incident</div>
            <div className="text-ink font-medium mt-0.5 font-mono-num">{incident.code}</div>
          </div>
        </div>
      )}
    </div>
  );
}
