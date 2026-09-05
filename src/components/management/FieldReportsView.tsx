"use client";

import { useState } from "react";
import type { GroundReport, VerificationStatus, Zone } from "@/lib/types";
import { useAppStore, type AppState } from "@/store/useAppStore";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { StatusPill } from "@/components/ui/StatusPill";
import { SimTag } from "@/components/ui/SimTag";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { formatRelative } from "@/lib/format";
import { EmergingSignals } from "@/components/pulse/EmergingSignals";

const STATUS_TONE: Record<VerificationStatus, "neutral" | "yellow" | "green" | "red"> = {
  unverified: "neutral",
  reported: "neutral",
  corroborated: "yellow",
  verified: "green",
  resolved: "green",
  dismissed: "red",
};

const CATEGORY_LABEL: Record<string, string> = {
  water: "Water",
  food: "Food",
  toilet: "Sanitation",
  medical: "Medical",
  crowd: "Crowd",
  infrastructure: "Infrastructure",
  safety: "Safety",
  lost_person: "Lost person",
  accessibility: "Accessibility",
  other: "Other",
};

/**
 * Management view for volunteer field reports — the ground truth Setu captures
 * (§17/§19). Every row shows its source, verification status and evidence;
 * corroboration and promotion to a dispatchable incident are one click.
 */
export function FieldReportsView({ zones }: { zones: Zone[] }) {
  const store = useAppStore();
  const [filter, setFilter] = useState<"open" | "all">("open");

  const reports = [...store.groundReports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const shown = filter === "open" ? reports.filter((r) => !["resolved", "dismissed"].includes(r.status)) : reports;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-editorial text-xl text-ink">Field Reports</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Ground observations from volunteers via Setu. Source, confidence and verification status are shown on every
            report — AI inference is never presented as verified fact.
          </p>
        </div>
        <SimTag label="SYNTHETIC GROUND DATA" />
      </div>

      {store.emergingSignals.length > 0 && (
        <Panel>
          <PanelHeader title="Kumbh Pulse — emerging signals" subtitle="Aggregated from the reports below + pilgrim demand" />
          <EmergingSignals
            signals={store.emergingSignals}
            reports={store.groundReports}
            zones={zones}
            onPromote={(id) => store.promoteReportToIncident(id)}
          />
        </Panel>
      )}

      <div className="flex items-center gap-2">
        {(["open", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-2.5 py-1 rounded-sm border transition-colors ${
              filter === f ? "bg-primary text-white border-primary" : "bg-surface text-ink-muted border-border"
            }`}
          >
            {f === "open" ? "Open" : "All"} ({f === "open" ? reports.filter((r) => !["resolved", "dismissed"].includes(r.status)).length : reports.length})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Panel>
          <p className="text-xs text-ink-soft">
            No field reports yet. When a volunteer files one through Setu (voice or text), it appears here in real time.
          </p>
        </Panel>
      ) : (
        <div className="space-y-2.5">
          {shown.map((r) => (
            <ReportRow key={r.id} report={r} zones={zones} store={store} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportRow({
  report,
  zones,
  store,
}: {
  report: GroundReport;
  zones: Zone[];
  store: AppState;
}) {
  const zone = zones.find((z) => z.id === report.zoneId);
  return (
    <Panel className="!p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono-num text-xs text-ink-soft">{report.code}</span>
            <span className="text-xs font-semibold text-ink">{CATEGORY_LABEL[report.category] ?? report.category}</span>
            <StatusPill tone={report.severity === "high" ? "red" : report.severity === "moderate" ? "yellow" : "neutral"}>
              {report.severity}
            </StatusPill>
            <StatusPill tone={STATUS_TONE[report.status]}>{report.status}</StatusPill>
            {report.queuedOffline && (
              <span className="text-[10px] font-semibold uppercase text-status-amber flex items-center gap-1">
                <Icon name="wifi-off" className="h-3 w-3" /> queued
              </span>
            )}
          </div>
          <div className="text-sm text-ink mt-1">{report.summary}</div>
          <div className="text-[11px] text-ink-soft mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            <span>{zone?.shortName ?? report.zoneId}</span>
            <span>· {report.reportedBy.label}</span>
            <span>· source: {report.source.replace(/_/g, " ")}</span>
            {report.estimatedPeopleAffected !== undefined && <span>· ~{report.estimatedPeopleAffected} affected</span>}
            {report.corroborations > 1 && <span>· {report.corroborations} corroborating</span>}
            {report.aiConfidence !== undefined && <span>· AI extract {Math.round(report.aiConfidence * 100)}%</span>}
            <span>· {formatRelative(report.createdAt)}</span>
          </div>
        </div>
        {report.photoUrls && report.photoUrls[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={report.photoUrls[0]}
            alt="Field evidence"
            className="h-16 w-16 object-cover rounded-sm border border-border shrink-0"
          />
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-2.5">
        {!["resolved", "dismissed"].includes(report.status) && (
          <>
            <Button size="sm" variant="outline" onClick={() => store.corroborateGroundReport(report.id, "Control Room")}>
              Log corroborating report
            </Button>
            {!report.linkedIncidentId ? (
              <Button size="sm" variant="outline" onClick={() => store.promoteReportToIncident(report.id)}>
                Promote to incident
              </Button>
            ) : (
              <span className="text-[11px] text-status-green flex items-center gap-1 px-2 py-1">
                <Icon name="check" className="h-3 w-3" /> Incident raised
              </span>
            )}
            <Button size="sm" variant="ghost" onClick={() => store.updateGroundReportStatus(report.id, "verified")}>
              Mark verified
            </Button>
            <Button size="sm" variant="ghost" onClick={() => store.updateGroundReportStatus(report.id, "dismissed")}>
              Dismiss
            </Button>
          </>
        )}
        {report.status === "resolved" || report.status === "dismissed" ? (
          <Button size="sm" variant="ghost" onClick={() => store.updateGroundReportStatus(report.id, "reported")}>
            Reopen
          </Button>
        ) : null}
      </div>
    </Panel>
  );
}
