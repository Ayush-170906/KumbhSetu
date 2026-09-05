"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { SimTag } from "@/components/ui/SimTag";
import { StatusPill } from "@/components/ui/StatusPill";
import type { SystemStatus } from "@/lib/types";

function useClock() {
  const [time, setTime] = useState<string>("");
  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function TopStatusBar({
  connectivity,
  activeIncidents,
  volunteersAvailable,
  zonesAtRisk,
}: {
  connectivity: SystemStatus["connectivity"];
  activeIncidents: number;
  volunteersAvailable: number;
  zonesAtRisk: number;
}) {
  const time = useClock();

  return (
    <header className="h-14 shrink-0 border-b border-border bg-surface flex items-center px-4 gap-5 text-xs">
      <Link href="/" className="flex items-center gap-2 pr-4 border-r border-border h-full shrink-0">
        <div className="h-7 w-7 rounded-sm bg-secondary flex items-center justify-center">
          <Icon name="management" className="h-4 w-4 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-ink -mb-0.5">Kumbh Setu</div>
          <div className="text-[9.5px] uppercase tracking-wide text-ink-soft">Control Room</div>
        </div>
      </Link>

      <SimTag />

      <StatItem
        label="Connectivity"
        value={connectivity === "nominal" ? "Nominal" : connectivity === "degraded" ? "Degraded" : "Offline"}
        tone={connectivity === "nominal" ? "green" : connectivity === "degraded" ? "yellow" : "red"}
      />
      <StatItem label="Active Incidents" value={String(activeIncidents)} tone={activeIncidents > 0 ? "yellow" : "green"} />
      <StatItem label="Volunteers Available" value={String(volunteersAvailable)} tone="green" />
      <StatItem label="Zones At Risk" value={String(zonesAtRisk)} tone={zonesAtRisk > 0 ? "yellow" : "green"} />

      <div className="ml-auto flex items-center gap-4 shrink-0">
        <Link
          href="/demo"
          className="hidden sm:inline-flex items-center gap-1.5 text-primary font-medium hover:text-primary-dark"
        >
          <Icon name="target" className="h-3.5 w-3.5" />
          Run Live Demo
        </Link>
        <div className="text-right leading-tight">
          <div className="text-[9.5px] uppercase tracking-wide text-ink-soft">Operations Manager</div>
          <div className="font-mono-num text-ink font-medium">{time || "--:--:--"}</div>
        </div>
      </div>
    </header>
  );
}

function StatItem({ label, value, tone }: { label: string; value: string; tone: "green" | "yellow" | "red" }) {
  return (
    <div className="hidden md:flex items-center gap-2 shrink-0">
      <span className="text-ink-soft uppercase tracking-wide text-[10px]">{label}</span>
      <StatusPill tone={tone} dot>
        {value}
      </StatusPill>
    </div>
  );
}
