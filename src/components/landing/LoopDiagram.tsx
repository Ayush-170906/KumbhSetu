import { Icon, type IconName } from "@/components/ui/Icon";

const stages: { label: string; sub: string; icon: IconName }[] = [
  { label: "Pilgrim", sub: "Reports / SOS", icon: "pilgrim" },
  { label: "Incident", sub: "Created & timed", icon: "sos" },
  { label: "Kumbh Pulse", sub: "Zone risk updated", icon: "pulse" },
  { label: "Volunteer", sub: "Dispatched & responds", icon: "volunteer" },
  { label: "Management", sub: "Sees full picture", icon: "management" },
];

export function LoopDiagram() {
  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-0">
        {stages.map((s, idx) => (
          <div key={s.label} className="flex items-center md:flex-1">
            <div className="flex-1 md:flex-none flex md:flex-col items-center gap-3 md:gap-2 bg-surface border border-border rounded-sm px-4 py-3.5 md:py-5 w-full">
              <div className="h-9 w-9 rounded-sm bg-primary-soft flex items-center justify-center shrink-0">
                <Icon name={s.icon} className="h-[18px] w-[18px] text-primary-dark" />
              </div>
              <div className="md:text-center">
                <div className="text-sm font-semibold text-ink">{s.label}</div>
                <div className="text-[11px] text-ink-muted">{s.sub}</div>
              </div>
            </div>
            {idx < stages.length - 1 && (
              <div className="hidden md:flex items-center justify-center w-8 shrink-0 text-ink-soft">
                <Icon name="arrow-right" className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-[11px] text-ink-soft">
        <Icon name="route" className="h-3.5 w-3.5" />
        Each response feeds back into Kumbh Pulse and the audit log — the loop closes and the system learns.
      </div>
    </div>
  );
}
