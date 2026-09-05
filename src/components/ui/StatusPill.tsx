import type { RiskBand } from "@/lib/types";

type Tone = RiskBand | "neutral" | "info";

const toneClasses: Record<Tone, string> = {
  green: "bg-status-green-bg text-status-green border-status-green-border",
  yellow: "bg-status-amber-bg text-status-amber border-status-amber-border",
  red: "bg-status-red-bg text-status-red border-status-red-border",
  neutral: "bg-surface-muted text-ink-muted border-border",
  info: "bg-primary-soft text-primary-soft-ink border-primary-soft",
};

const dotClasses: Record<Tone, string> = {
  green: "bg-status-green",
  yellow: "bg-status-amber",
  red: "bg-status-red",
  neutral: "bg-ink-soft",
  info: "bg-primary",
};

export function StatusPill({
  tone,
  children,
  dot = true,
  className = "",
}: {
  tone: Tone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${toneClasses[tone]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[tone]}`} />}
      {children}
    </span>
  );
}

export function bandLabel(band: RiskBand): string {
  if (band === "green") return "Normal";
  if (band === "yellow") return "Elevated";
  return "Critical";
}
