export function MapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-ink-muted">
      <LegendDot color="var(--color-status-green)" label="Normal" />
      <LegendDot color="var(--color-status-amber)" label="Elevated" />
      <LegendDot color="var(--color-status-red)" label="Critical" />
      <span className="h-3 w-px bg-border" />
      <LegendDot color="var(--color-status-green)" label="Volunteer available" />
      <LegendDot color="var(--color-primary)" label="Volunteer on task" />
      <LegendDot color="var(--color-ink-soft)" label="Off duty" />
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
