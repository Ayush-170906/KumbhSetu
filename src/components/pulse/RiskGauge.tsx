import type { RiskBand } from "@/lib/types";

const bandColor: Record<RiskBand, string> = {
  green: "var(--color-status-green)",
  yellow: "var(--color-status-amber)",
  red: "var(--color-status-red)",
};

export function RiskGauge({ score, band, size = 128 }: { score: number; band: RiskBand; size?: number }) {
  const radius = 52;
  const circumference = Math.PI * radius; // half circle
  const progress = Math.max(0, Math.min(100, score)) / 100;
  const dash = circumference * progress;

  return (
    <div className="relative" style={{ width: size, height: size * 0.62 }}>
      <svg viewBox="0 0 140 80" width={size} height={size * 0.62}>
        <path
          d="M 18 74 A 52 52 0 0 1 122 74"
          fill="none"
          stroke="var(--color-surface-sunk)"
          strokeWidth={10}
          strokeLinecap="round"
        />
        <path
          d="M 18 74 A 52 52 0 0 1 122 74"
          fill="none"
          stroke={bandColor[band]}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: "stroke-dasharray 0.6s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-0.5">
        <div className="font-mono-num text-2xl font-semibold text-ink leading-none">{score}</div>
        <div className="text-[10px] uppercase tracking-wide text-ink-soft mt-0.5">/ 100</div>
      </div>
    </div>
  );
}
