"use client";

import type { Volunteer, Zone } from "@/lib/types";
import { StatusPill } from "@/components/ui/StatusPill";
import { LANGUAGE_LABELS } from "@/lib/i18n";

const options: { id: Volunteer["availability"]; label: string }[] = [
  { id: "available", label: "Available" },
  { id: "off_duty", label: "Off Duty" },
];

export function AvailabilityHeader({
  volunteer,
  zone,
  onChangeAvailability,
  locked,
}: {
  volunteer: Volunteer;
  zone?: Zone;
  onChangeAvailability: (a: Volunteer["availability"]) => void;
  locked: boolean;
}) {
  return (
    <div className="px-4 py-3 border-b border-border bg-surface">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-ink">{volunteer.name} · {volunteer.id}</div>
          <div className="text-xs text-ink-muted">{zone?.shortName ?? volunteer.zoneId} · Shift {volunteer.shiftStart}–{volunteer.shiftEnd}</div>
          <div className="flex items-center gap-1 mt-1">
            {volunteer.skills.map((s) => (
              <span key={s} className="text-[9.5px] uppercase tracking-wide bg-surface-muted text-ink-soft rounded-sm px-1.5 py-0.5">
                {s.replace("_", " ")}
              </span>
            ))}
            {volunteer.languages.map((l) => (
              <span key={l} className="text-[9.5px] uppercase tracking-wide bg-primary-soft text-primary-soft-ink rounded-sm px-1.5 py-0.5">
                {LANGUAGE_LABELS[l]}
              </span>
            ))}
          </div>
        </div>
        {volunteer.availability === "on_task" ? (
          <StatusPill tone="info">On Task</StatusPill>
        ) : (
          <div className="flex rounded-sm border border-border overflow-hidden">
            {options.map((o) => (
              <button
                key={o.id}
                disabled={locked}
                onClick={() => onChangeAvailability(o.id)}
                className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  volunteer.availability === o.id ? "bg-status-green text-white" : "bg-surface text-ink-muted"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
