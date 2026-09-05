"use client";

import { useState } from "react";
import type { Advisory, AdvisorySeverity, Zone } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { StatusPill } from "@/components/ui/StatusPill";
import { SimTag } from "@/components/ui/SimTag";
import { formatClock } from "@/lib/format";

const severityOptions: { id: AdvisorySeverity; label: string }[] = [
  { id: "info", label: "Notice" },
  { id: "advisory", label: "Advisory" },
  { id: "warning", label: "Police Warning" },
];

export function AdvisoriesView({
  zones,
  advisories,
  onPublish,
  onRetract,
}: {
  zones: Zone[];
  advisories: Advisory[];
  onPublish: (input: { zoneId: string; severity: AdvisorySeverity; message: string }) => void;
  onRetract: (id: string) => void;
}) {
  const [zoneId, setZoneId] = useState<string>("all");
  const [severity, setSeverity] = useState<AdvisorySeverity>("advisory");
  const [message, setMessage] = useState("");

  const active = advisories.filter((a) => a.active);
  const past = advisories.filter((a) => !a.active);

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-editorial text-xl text-ink">Advisories &amp; Broadcasts</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Publish a guidance notice that appears instantly on every connected Pilgrim screen for the selected zone.
          </p>
        </div>
        <SimTag label="LIVE TO ALL TABS" />
      </div>

      <Panel>
        <PanelHeader title="Publish new advisory" />
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-wide text-ink-soft">Zone</label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="w-full mt-1 text-sm border border-border rounded-sm px-2.5 py-1.5 bg-surface focus:outline-none focus:border-primary"
              >
                <option value="all">All zones</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.shortName}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-wide text-ink-soft">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as AdvisorySeverity)}
                className="w-full mt-1 text-sm border border-border rounded-sm px-2.5 py-1.5 bg-surface focus:outline-none focus:border-primary"
              >
                {severityOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-ink-soft">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Avoid the Ghat 4 approach between 3–4 PM — police-directed diversion in effect."
              className="w-full mt-1 min-h-20 text-sm border border-border rounded-sm p-2.5 bg-surface placeholder:text-ink-soft focus:outline-none focus:border-primary resize-none"
            />
          </div>
          <Button
            disabled={message.trim().length === 0}
            onClick={() => {
              onPublish({ zoneId, severity, message: message.trim() });
              setMessage("");
            }}
          >
            Publish advisory
          </Button>
        </div>
      </Panel>

      <div>
        <PanelHeader title={`Active (${active.length})`} />
        {active.length === 0 ? (
          <p className="text-xs text-ink-soft">No active advisories.</p>
        ) : (
          <div className="space-y-2">
            {active.map((a) => (
              <AdvisoryRow key={a.id} advisory={a} zones={zones} onRetract={onRetract} />
            ))}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <PanelHeader title="Retracted" />
          <div className="space-y-2 opacity-60">
            {past.map((a) => (
              <AdvisoryRow key={a.id} advisory={a} zones={zones} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AdvisoryRow({
  advisory,
  zones,
  onRetract,
}: {
  advisory: Advisory;
  zones: Zone[];
  onRetract?: (id: string) => void;
}) {
  const zoneName = advisory.zoneId === "all" ? "All zones" : zones.find((z) => z.id === advisory.zoneId)?.shortName ?? advisory.zoneId;
  const tone = advisory.severity === "warning" ? "red" : advisory.severity === "advisory" ? "yellow" : "info";
  return (
    <div className="flex items-start justify-between gap-3 border border-border bg-surface rounded-sm px-3 py-2.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <StatusPill tone={tone}>{advisory.severity}</StatusPill>
          <span className="text-xs text-ink-soft">{zoneName} · {formatClock(advisory.createdAt)}</span>
        </div>
        <p className="text-sm text-ink mt-1.5">{advisory.message}</p>
      </div>
      {onRetract && (
        <Button size="sm" variant="outline" onClick={() => onRetract(advisory.id)} className="shrink-0">
          Retract
        </Button>
      )}
    </div>
  );
}
