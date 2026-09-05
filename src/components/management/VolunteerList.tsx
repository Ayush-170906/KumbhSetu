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
          <div>
            <div className="font-medium text-ink">{v.id} · {v.name}</div>
            <div className="text-ink-soft">{zoneName(v.zoneId)}</div>
          </div>
          <StatusPill tone={toneMap[v.availability]}>{labelMap[v.availability]}</StatusPill>
        </div>
      ))}
    </div>
  );
}
