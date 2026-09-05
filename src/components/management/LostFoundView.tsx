"use client";

import type { Incident, FoundReport, Zone } from "@/lib/types";
import { textMatchScore } from "@/lib/dispatch";
import { Button } from "@/components/ui/Button";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { StatusPill } from "@/components/ui/StatusPill";
import { SimTag } from "@/components/ui/SimTag";
import { formatClock } from "@/lib/format";

const MATCH_THRESHOLD = 25;

export function LostFoundView({
  incidents,
  foundReports,
  zones,
  onConfirmMatch,
}: {
  incidents: Incident[];
  foundReports: FoundReport[];
  zones: Zone[];
  onConfirmMatch: (incidentId: string, foundReportId: string) => void;
}) {
  const zoneName = (id: string) => zones.find((z) => z.id === id)?.shortName ?? id;
  const openCases = incidents.filter((i) => i.type === "lost_person" && !["resolved", "cancelled"].includes(i.status));
  const openFound = foundReports.filter((f) => f.status === "open");

  const matches = openCases
    .flatMap((incident) =>
      openFound.map((report) => ({
        incident,
        report,
        score: textMatchScore(incident.summary, report.description),
      }))
    )
    .filter((m) => m.score >= MATCH_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-editorial text-xl text-ink">Lost &amp; Found</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Structured missing-person and found-person reports with transparent keyword-based match suggestions — a
            human always confirms before a case closes.
          </p>
        </div>
        <SimTag label="RULE-BASED MATCHING" />
      </div>

      {matches.length > 0 && (
        <Panel className="!border-status-amber-border !bg-status-amber-bg">
          <PanelHeader title={`Possible matches (${matches.length})`} />
          <div className="space-y-2">
            {matches.map((m) => (
              <div key={`${m.incident.id}-${m.report.id}`} className="flex items-center justify-between gap-3 bg-surface border border-border rounded-sm px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono-num font-semibold text-ink">{m.incident.code}</span>
                    <span className="text-ink-soft">↔</span>
                    <span className="font-mono-num font-semibold text-ink">{m.report.code}</span>
                    <StatusPill tone="yellow">{m.score}% match</StatusPill>
                  </div>
                  <p className="text-xs text-ink-muted mt-1 truncate">{m.incident.summary}</p>
                  <p className="text-xs text-ink-muted truncate">{m.report.description}</p>
                </div>
                <Button size="sm" onClick={() => onConfirmMatch(m.incident.id, m.report.id)} className="shrink-0">
                  Confirm &amp; Reunite
                </Button>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Panel>
          <PanelHeader title={`Open missing-person cases (${openCases.length})`} />
          <div className="space-y-2">
            {openCases.length === 0 && <p className="text-xs text-ink-soft">None open.</p>}
            {openCases.map((i) => (
              <div key={i.id} className="border border-border rounded-sm px-3 py-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono-num font-semibold text-ink">{i.code}</span>
                  <span className="text-ink-soft">{zoneName(i.zoneId)} · {formatClock(i.createdAt)}</span>
                </div>
                <p className="text-xs text-ink-muted mt-1">{i.summary}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title={`Found-person reports (${openFound.length})`} />
          <div className="space-y-2">
            {openFound.length === 0 && <p className="text-xs text-ink-soft">None reported.</p>}
            {openFound.map((f) => (
              <div key={f.id} className="border border-border rounded-sm px-3 py-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono-num font-semibold text-ink">{f.code}</span>
                  <span className="text-ink-soft">{zoneName(f.zoneId)} · {formatClock(f.createdAt)}</span>
                </div>
                <p className="text-xs text-ink-muted mt-1">{f.description}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
