export function ProgressBar({
  percent,
  tone = "primary",
  className = "",
}: {
  percent: number;
  tone?: "primary" | "green" | "yellow" | "red" | "neutral";
  className?: string;
}) {
  const toneClass = {
    primary: "bg-primary",
    green: "bg-status-green",
    yellow: "bg-status-amber",
    red: "bg-status-red",
    neutral: "bg-ink-soft",
  }[tone];

  return (
    <div className={`h-1.5 w-full rounded-full bg-surface-sunk overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full ${toneClass} transition-[width] duration-500 ease-out`}
        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
      />
    </div>
  );
}
