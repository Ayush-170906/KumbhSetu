"use client";

import type { Zone, Volunteer } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { Icon, type IconName } from "@/components/ui/Icon";
import { StatusPill, bandLabel } from "@/components/ui/StatusPill";

/**
 * "What's around me" at a glance (§37 FIELD STATUS + Nearby). Reads live store
 * state directly — the same numbers Setu quotes when asked for a zone brief.
 */
export function FieldStatus({ volunteer, zone }: { volunteer: Volunteer; zone?: Zone }) {
  const store = useAppStore();
  const zoneId = volunteer.zoneId;
  const snap = zone ? store.riskSnapshots[zoneId] : undefined;

  const openIncidents = store.incidents.filter(
    (i) => i.zoneId === zoneId && !["resolved", "cancelled", "escalated"].includes(i.status)
  );
  const medicalOpen = openIncidents.filter((i) => i.type === "medical").length;
  const zoneReports = store.groundReports.filter(
    (r) => r.zoneId === zoneId && !["resolved", "dismissed"].includes(r.status)
  );
  const waterReports = zoneReports.filter((r) => r.category === "water").length;
  const volunteersHere = store.volunteers.filter(
    (v) => v.zoneId === zoneId && v.id !== volunteer.id && v.availability === "available"
  ).length;
  const medicalCamps = store.facilities.filter((f) => f.type === "medical" && f.zoneId === zoneId).length;
  const myTasks = store.tasks.filter(
    (t) => t.assigneeId === volunteer.id && !["resolved", "escalated", "cancelled"].includes(t.state)
  ).length;
  const signals = store.emergingSignals.filter((s) => s.zoneId === zoneId);

  const stats: { label: string; value: string; tone?: "amber" | "red" }[] = [
    { label: "Crowd", value: (zone?.density ?? "—").toUpperCase(), tone: zone && (zone.density === "high" || zone.density === "severe") ? "amber" : undefined },
    { label: "Medical", value: `${medicalOpen} open`, tone: medicalOpen > 0 ? "amber" : undefined },
    { label: "Field reports", value: `${zoneReports.length}`, tone: waterReports >= 2 ? "amber" : undefined },
  ];

  return (
    <div className="space-y-2">
      <div className="rounded-sm border border-border bg-surface p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
            Field status · {zone?.shortName ?? zoneId}
          </div>
          {snap && <StatusPill tone={snap.band}>{bandLabel(snap.band)}</StatusPill>}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="rounded-sm border border-border bg-surface-muted px-2.5 py-2">
              <div className="text-[10px] uppercase tracking-wide text-ink-soft">{s.label}</div>
              <div className={`text-sm font-semibold mt-0.5 ${s.tone === "amber" ? "text-status-amber" : s.tone === "red" ? "text-status-red" : "text-ink"}`}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {signals.length > 0 && (
          <div className="mt-2 rounded-sm border border-status-amber-border bg-status-amber-bg px-2.5 py-1.5 text-[11px] text-status-amber flex items-start gap-1.5">
            <Icon name="pulse" className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>
              Kumbh Pulse is monitoring: {signals.map((s) => s.headline).join("; ")}.
            </span>
          </div>
        )}
      </div>

      <div className="rounded-sm border border-border bg-surface p-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft mb-2">Nearby</div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-muted">
          <NearbyStat icon="volunteer" value={volunteersHere} label="volunteers available" />
          <NearbyStat icon="medical" value={medicalCamps} label="medical camps" />
          <NearbyStat icon="target" value={myTasks} label="tasks assigned to me" />
        </div>
      </div>
    </div>
  );
}

function NearbyStat({ icon, value, label }: { icon: IconName; value: number; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon name={icon} className="h-3.5 w-3.5 text-ink-soft" />
      <span className="font-semibold text-ink">{value}</span> {label}
    </span>
  );
}
