import type { Incident, Volunteer, Zone } from "@/lib/types";
import { ANALYTICS_BASELINE } from "@/lib/seed";
import { typeLabel } from "@/lib/incidentMeta";
import { MiniBarChart, Sparkline } from "@/components/ui/Sparkline";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { SimTag } from "@/components/ui/SimTag";

export function AnalyticsView({
  incidents,
  volunteers,
  zones,
  riskHistory,
}: {
  incidents: Incident[];
  volunteers: Volunteer[];
  zones: Zone[];
  riskHistory: Record<string, number[]>;
}) {
  const resolved = incidents.filter((i) => i.status === "resolved");
  const active = incidents.filter((i) => !["resolved", "cancelled", "escalated"].includes(i.status));

  const sessionResponseTimes = resolved
    .map((i) => {
      const created = new Date(i.createdAt).getTime();
      const ackEvent = i.timeline.find((t) => t.status === "acknowledged");
      if (!ackEvent) return null;
      return (new Date(ackEvent.timestamp).getTime() - created) / 60000;
    })
    .filter((v): v is number => v !== null);

  const avgResponse =
    sessionResponseTimes.length > 0
      ? sessionResponseTimes.reduce((a, b) => a + b, 0) / sessionResponseTimes.length
      : ANALYTICS_BASELINE.avgResponseMinutes;

  const onTaskCount = volunteers.filter((v) => v.availability === "on_task").length;
  const utilization =
    volunteers.length > 0 ? Math.round((onTaskCount / volunteers.length + ANALYTICS_BASELINE.volunteerUtilization) * 50) : 0;

  const categoryData = ANALYTICS_BASELINE.categoryBaseline.map((c) => {
    const liveCount = incidents.filter((i) => typeLabel(i.type) === c.label).length;
    return { label: c.label, value: c.value + liveCount };
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-editorial text-xl text-ink">Operational Analytics</h2>
          <p className="text-xs text-ink-muted mt-0.5">Response performance, resource allocation and activity patterns.</p>
        </div>
        <SimTag label="ILLUSTRATIVE SESSION DATA" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Avg. Response Time" value={`${avgResponse.toFixed(1)} min`} hint="Report → acknowledgement" />
        <MetricCard label="Active Incidents" value={String(active.length)} hint="Currently open" />
        <MetricCard label="Resolved (session)" value={String(resolved.length + ANALYTICS_BASELINE.resolvedToday)} hint="Cumulative" />
        <MetricCard label="Volunteer Utilization" value={`${Math.min(utilization, 100)}%`} hint="Active task time" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Panel>
          <PanelHeader title="Peak Activity by Hour" subtitle="Reported incidents across the operating day" />
          <MiniBarChart data={ANALYTICS_BASELINE.peakActivity} />
        </Panel>
        <Panel>
          <PanelHeader title="Incident Categories" subtitle="Distribution by type, including this session" />
          <MiniBarChart data={categoryData} color="var(--color-secondary)" />
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="Zone Risk Trend" subtitle="Live modeled score over the current session (Kumbh Pulse)" />
        <div className="grid sm:grid-cols-3 gap-4">
          {zones.map((z) => (
            <div key={z.id} className="flex items-center justify-between border border-border rounded-sm px-3 py-2">
              <div>
                <div className="text-xs font-medium text-ink">{z.shortName}</div>
                <div className="text-[10px] text-ink-soft">score {z.riskScore}</div>
              </div>
              <Sparkline
                values={riskHistory[z.id] ?? [z.riskScore]}
                stroke={z.riskBand === "red" ? "var(--color-status-red)" : z.riskBand === "yellow" ? "var(--color-status-amber)" : "var(--color-status-green)"}
              />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="border border-border bg-surface rounded-sm px-4 py-3">
      <div className="text-[10px] uppercase tracking-wide text-ink-soft">{label}</div>
      <div className="text-xl font-semibold text-ink font-mono-num mt-1">{value}</div>
      <div className="text-[10.5px] text-ink-soft mt-0.5">{hint}</div>
    </div>
  );
}
