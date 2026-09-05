import { Icon } from "./Icon";

export function SimTag({ label = "SIMULATION MODE", className = "" }: { label?: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border border-border-strong bg-surface-sunk px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-muted ${className}`}
      title="This screen uses synthetic/demo data — not real operational Kumbh data."
    >
      <Icon name="layers" className="h-3 w-3" />
      {label}
    </span>
  );
}
