"use client";

import { useState } from "react";
import type { Zone } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { textMatchScore } from "@/lib/dispatch";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

type Mode = "menu" | "missing-form" | "missing-sent" | "found-form" | "found-sent" | "qr-info";

const MATCH_THRESHOLD = 25;

export function LostFoundScreen({ zone }: { zone: Zone }) {
  const submitSOS = useAppStore((s) => s.submitSOS);
  const reportFoundPerson = useAppStore((s) => s.reportFoundPerson);
  const incidents = useAppStore((s) => s.incidents);
  const [mode, setMode] = useState<Mode>("menu");
  const [description, setDescription] = useState("");
  const [caseCode, setCaseCode] = useState<string | null>(null);
  const [matchedCode, setMatchedCode] = useState<string | null>(null);

  const openMissingCases = incidents.filter((i) => i.type === "lost_person" && !["resolved", "cancelled"].includes(i.status));

  if (mode === "menu") {
    return (
      <div className="flex-1 p-4 space-y-3">
        <div className="rounded-sm border border-border bg-surface-muted px-3 py-2.5 flex items-start gap-2.5">
          <Icon name="shield" className="h-4 w-4 text-ink-muted shrink-0 mt-0.5" />
          <p className="text-[11px] text-ink-muted leading-relaxed">
            Lost &amp; Found cases involve personal information. Access is restricted to authorized volunteers and
            control-room staff, and reports feed directly into the incident system.
          </p>
        </div>
        <MenuCard icon="lost" title="Report Missing Person" body="Raise a case for someone separated from you." onClick={() => setMode("missing-form")} />
        <MenuCard icon="check" title="Report Found Person" body="Someone found who needs to be reunited." onClick={() => setMode("found-form")} />
        <MenuCard icon="qr" title="Scan QR Wristband" body="Identify a child via their registered wristband." onClick={() => setMode("qr-info")} />
        {openMissingCases.length > 0 && (
          <div className="text-[11px] text-ink-soft pt-1">
            {openMissingCases.length} missing-person case{openMissingCases.length > 1 ? "s" : ""} currently open across all zones.
          </div>
        )}
      </div>
    );
  }

  if (mode === "missing-form") {
    return (
      <div className="flex-1 p-4 flex flex-col">
        <h1 className="text-base font-semibold text-ink">Report a Missing Person</h1>
        <p className="text-xs text-ink-muted mt-1 mb-4">
          This creates a case visible to volunteers and the control room near {zone.shortName}. Provide identifying
          details — age, clothing, last seen location.
        </p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Elderly woman, saffron saree, last seen near the Ramkund steps 10 minutes ago."
          className="flex-1 min-h-32 rounded-sm border border-border bg-surface p-3 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:border-primary resize-none"
        />
        <div className="space-y-2 mt-4">
          <Button
            className="w-full"
            size="lg"
            disabled={description.trim().length === 0}
            onClick={() => {
              const incident = submitSOS({
                type: "lost_person",
                severity: "moderate",
                zoneId: zone.id,
                reportedBy: { role: "pilgrim", label: `Pilgrim · ${zone.shortName}` },
                summary: `Missing person reported near ${zone.shortName}: ${description.trim()}`,
              });
              setCaseCode(incident.code);
              setDescription("");
              setMode("missing-sent");
            }}
          >
            Submit Case
          </Button>
          <Button className="w-full" size="lg" variant="ghost" onClick={() => setMode("menu")}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "missing-sent") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
        <div className="h-14 w-14 rounded-full bg-status-green-bg flex items-center justify-center mb-4">
          <Icon name="check" className="h-6 w-6 text-status-green" />
        </div>
        <h1 className="text-lg font-semibold text-ink">Case Registered</h1>
        <p className="font-mono-num text-sm text-ink-muted mt-1">{caseCode}</p>
        <p className="text-xs text-ink-muted mt-3 max-w-xs">
          Nearby volunteers and the control room have been notified. You can track this case in the incident timeline
          from the control room view.
        </p>
        <Button className="mt-6" onClick={() => setMode("menu")}>
          Done
        </Button>
      </div>
    );
  }

  if (mode === "found-form") {
    return (
      <div className="flex-1 p-4 flex flex-col">
        <h1 className="text-base font-semibold text-ink">Report a Found Person</h1>
        <p className="text-xs text-ink-muted mt-1 mb-4">
          Describe who you found and where. This is automatically checked against open missing-person cases near{" "}
          {zone.shortName}.
        </p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Young boy, around 8 years old, blue shirt, found near the Kushavarta help desk."
          className="flex-1 min-h-32 rounded-sm border border-border bg-surface p-3 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:border-primary resize-none"
        />
        <div className="space-y-2 mt-4">
          <Button
            className="w-full"
            size="lg"
            disabled={description.trim().length === 0}
            onClick={() => {
              const report = reportFoundPerson({ zoneId: zone.id, description: description.trim() });
              const best = openMissingCases
                .map((i) => ({ incident: i, score: textMatchScore(i.summary, report.description) }))
                .sort((a, b) => b.score - a.score)[0];
              setMatchedCode(best && best.score >= MATCH_THRESHOLD ? best.incident.code : null);
              setCaseCode(report.code);
              setDescription("");
              setMode("found-sent");
            }}
          >
            Submit Report
          </Button>
          <Button className="w-full" size="lg" variant="ghost" onClick={() => setMode("menu")}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "found-sent") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
        <div className="h-14 w-14 rounded-full bg-status-green-bg flex items-center justify-center mb-4">
          <Icon name="check" className="h-6 w-6 text-status-green" />
        </div>
        <h1 className="text-lg font-semibold text-ink">Found Report Logged</h1>
        <p className="font-mono-num text-sm text-ink-muted mt-1">{caseCode}</p>
        {matchedCode ? (
          <div className="mt-4 rounded-sm border border-status-amber-border bg-status-amber-bg px-3 py-2.5 text-xs text-status-amber max-w-xs">
            Possible match found with open case <span className="font-mono-num font-semibold">{matchedCode}</span>.
            The control room has been flagged to confirm and reunite.
          </div>
        ) : (
          <p className="text-xs text-ink-muted mt-3 max-w-xs">
            No open case matched automatically yet — this report stays visible to the control room for manual
            matching as new cases come in.
          </p>
        )}
        <Button className="mt-6" onClick={() => setMode("menu")}>
          Done
        </Button>
      </div>
    );
  }

  if (mode === "qr-info") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
        <div className="h-14 w-14 rounded-full bg-surface-muted flex items-center justify-center mb-4">
          <Icon name="qr" className="h-6 w-6 text-ink-muted" />
        </div>
        <h1 className="text-lg font-semibold text-ink">Scan QR Wristband</h1>
        <p className="text-xs text-ink-muted mt-3 max-w-xs leading-relaxed">
          Requires a physical wristband-issuance program and a camera-based scanner, neither of which exist in this
          prototype. In a real deployment this would look up a pre-registered child profile instantly instead of
          relying on a text description.
        </p>
        <Button className="mt-6" variant="outline" onClick={() => setMode("menu")}>
          Back
        </Button>
      </div>
    );
  }

  return null;
}

function MenuCard({ icon, title, body, onClick }: { icon: IconName; title: string; body: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 rounded-sm border border-border bg-surface p-4 text-left hover:border-primary transition-colors">
      <div className="h-10 w-10 rounded-sm bg-primary-soft flex items-center justify-center shrink-0">
        <Icon name={icon} className="h-[18px] w-[18px] text-primary-dark" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-ink">{title}</div>
        <div className="text-[11px] text-ink-soft mt-0.5">{body}</div>
      </div>
      <Icon name="chevron-right" className="h-4 w-4 text-ink-soft shrink-0" />
    </button>
  );
}
