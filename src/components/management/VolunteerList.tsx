import type { Volunteer, Zone } from "@/lib/types";
import { StatusPill } from "@/components/ui/StatusPill";

const toneMap = { available: "green", on_task: "info", off_duty: "neutral" } as const;
const labelMap = { available: "Available", on_task: "On Task", off_duty: "Off Duty" } as const;

export function VolunteerList({ volunteers, zones }: { volunteers: Volunteer[]; zones: Zone[] }) {
  const zoneName = (id: string) => zones.find((z) => z.id === id)?.shortName ?? id;
  const sorted = [...volunteers].sort((a, b) => {
    const order = { on_task: 0, available: 1, off_duty: 2 };
    return order[a.availability] - order[b.availability];
  });

  return (
    <div className="space-y-1.5">
      {sorted.map((v) => (
        <div key={v.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border last:border-0">
          <div className="min-w-0">
            <div className="font-medium text-ink">
              {v.id} · {v.name}
              {v.kind && (
                <span className="ml-1.5 text-[9px] uppercase tracking-wide text-ink-soft border border-border rounded-sm px-1 py-px">
                  {v.kind === "professional" ? "PRO" : "GEN"}
                </span>
              )}
            </div>
            <div className="text-ink-soft truncate">
              {zoneName(v.zoneId)}
              {v.kind === "professional" && v.slots?.length
                ? ` · ${v.slots.length} slot${v.slots.length === 1 ? "" : "s"}`
                : v.shiftStart
                ? ` · ${v.shiftStart}–${v.shiftEnd}`
                : ""}
              {v.enrolledBy ? " · self-enrolled" : ""}
            </div>
          </div>
          <StatusPill tone={toneMap[v.availability]}>{labelMap[v.availability]}</StatusPill>
        </div>
      ))}
    </div>
  );
}
