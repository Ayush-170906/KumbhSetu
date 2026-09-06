"use client";

import { Icon, type IconName } from "@/components/ui/Icon";

export type ManagementView =
  | "operations"
  | "copilot"
  | "pulse"
  | "fieldreports"
  | "security"
  | "advisories"
  | "lostfound"
  | "analytics"
  | "log";

const items: { id: ManagementView; label: string; icon: IconName }[] = [
  { id: "operations", label: "Live Operations", icon: "layers" },
  { id: "copilot", label: "Ops Copilot", icon: "pilgrim" },
  { id: "pulse", label: "Kumbh Pulse", icon: "pulse" },
  { id: "fieldreports", label: "Field Reports", icon: "log" },
  { id: "security", label: "Security Intelligence", icon: "shield" },
  { id: "advisories", label: "Advisories", icon: "bell" },
  { id: "lostfound", label: "Lost & Found", icon: "lost" },
  { id: "analytics", label: "Analytics", icon: "chart" },
  { id: "log", label: "Event Log", icon: "log" },
];

export function SideNav({
  active,
  onChange,
  onReset,
}: {
  active: ManagementView;
  onChange: (v: ManagementView) => void;
  onReset: () => void;
}) {
  return (
    <nav className="w-52 shrink-0 border-r border-border bg-surface flex flex-col">
      <div className="p-3 space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`w-full flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm text-left transition-colors ${
              active === item.id ? "bg-primary-soft text-primary-soft-ink font-medium" : "text-ink-muted hover:bg-surface-muted"
            }`}
          >
            <Icon name={item.icon} className="h-4 w-4 shrink-0" />
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-auto p-3 border-t border-border">
        <button
          onClick={onReset}
          className="w-full text-xs text-ink-soft hover:text-ink border border-border rounded-sm px-3 py-2 transition-colors"
        >
          Reset simulation
        </button>
        <p className="text-[10px] text-ink-soft mt-2 leading-relaxed">
          All data on this screen is synthetic and generated locally for demonstration.
        </p>
      </div>
    </nav>
  );
}
