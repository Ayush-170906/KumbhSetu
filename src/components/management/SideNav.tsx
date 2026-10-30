"use client";

import { Icon, type IconName } from "@/components/ui/Icon";

export type ManagementView =
  | "operations"
  | "copilot"
  | "pulse"
  | "fieldreports"
  | "security"
  | "directory"
  | "advisories"
  | "lostfound"
  | "analytics"
  | "log";

type NavItem = { id: ManagementView; label: string; icon: IconName };
type NavGroup = { heading: string; items: NavItem[] };

/**
 * Grouped so the response chain reads top-to-bottom: watch operations, ask the
 * AI, read the intelligence, then the standing information and the audit trail.
 */
const GROUPS: NavGroup[] = [
  {
    heading: "Operations",
    items: [{ id: "operations", label: "Live Operations", icon: "layers" }],
  },
  {
    heading: "AI",
    items: [{ id: "copilot", label: "Ops Copilot", icon: "pilgrim" }],
  },
  {
    heading: "Intelligence",
    items: [
      { id: "pulse", label: "Kumbh Pulse", icon: "pulse" },
      { id: "fieldreports", label: "Field Reports", icon: "log" },
      { id: "analytics", label: "Analytics", icon: "chart" },
    ],
  },
  {
    heading: "Information",
    items: [
      { id: "advisories", label: "Advisories", icon: "bell" },
      { id: "lostfound", label: "Lost & Found", icon: "lost" },
      { id: "directory", label: "City Directory", icon: "map-pin" },
      { id: "security", label: "Security (concept)", icon: "shield" },
    ],
  },
  {
    heading: "Audit",
    items: [{ id: "log", label: "Event Log", icon: "clock" }],
  },
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
    <nav aria-label="Management navigation" className="w-full shrink-0 border-b border-border bg-surface lg:w-56 lg:border-b-0 lg:border-r flex flex-col lg:max-h-none max-h-[28vh]">
      <div className="flex-1 overflow-y-auto scroll-thin px-2.5 py-2 lg:py-3 space-y-3 lg:space-y-4">
        {GROUPS.map((group) => (
          <div key={group.heading} className="min-w-0">
            <div className="px-3 pb-1 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
              {group.heading}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onChange(item.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={`group relative w-full flex items-center gap-2.5 rounded-sm px-3 py-2 text-[13px] text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                      isActive
                        ? "bg-primary-soft text-primary-soft-ink font-semibold"
                        : "text-ink-muted hover:bg-surface-muted hover:text-ink"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />
                    )}
                    <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-border">
        <button
          onClick={onReset}
          className="w-full text-xs text-ink-soft hover:text-ink border border-border rounded-sm px-3 py-2 transition-colors"
        >
          Reset simulation
        </button>
        <p className="text-[10px] text-ink-soft mt-2 leading-relaxed">
          Every figure on this screen is synthetic and generated locally for demonstration.
        </p>
      </div>
    </nav>
  );
}
