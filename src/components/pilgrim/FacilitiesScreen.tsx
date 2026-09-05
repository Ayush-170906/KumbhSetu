"use client";

import { useState } from "react";
import type { Facility, FacilityType, Zone } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { facilityIconName, facilityLabel } from "./facilityMeta";

const filters: { id: FacilityType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "medical", label: "Medical" },
  { id: "water", label: "Water" },
  { id: "toilet", label: "Sanitation" },
  { id: "food", label: "Food" },
  { id: "parking", label: "Parking" },
  { id: "help_desk", label: "Help Desk" },
];

export function FacilitiesScreen({ facilities, zones }: { facilities: Facility[]; zones: Zone[] }) {
  const [filter, setFilter] = useState<FacilityType | "all">("all");
  const zoneName = (id: string) => zones.find((z) => z.id === id)?.shortName ?? id;
  const list = facilities.filter((f) => filter === "all" || f.type === filter);

  return (
    <div className="flex-1 overflow-y-auto scroll-thin">
      <div className="flex gap-2 overflow-x-auto px-4 py-3 border-b border-border scroll-thin">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.id ? "bg-primary text-white border-primary" : "border-border text-ink-muted bg-surface"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="p-4 space-y-2">
        {list.map((f) => (
          <div key={f.id} className="flex items-center gap-3 rounded-sm border border-border bg-surface px-3 py-3">
            <div className="h-9 w-9 rounded-sm bg-surface-muted flex items-center justify-center shrink-0">
              <Icon name={facilityIconName(f.type)} className="h-4 w-4 text-ink-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-ink truncate">{f.name}</div>
              <div className="text-[11px] text-ink-soft">{facilityLabel(f.type)} · {zoneName(f.zoneId)}</div>
            </div>
            <div className="text-right shrink-0">
              <div className={`text-[11px] font-semibold uppercase ${f.status === "open" ? "text-status-green" : f.status === "limited" ? "text-status-amber" : "text-status-red"}`}>
                {f.status}
              </div>
              <div className="text-[10px] text-ink-soft">{f.load} load</div>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-xs text-ink-soft text-center py-8">No facilities of this type in the current dataset.</p>}
      </div>
    </div>
  );
}
