"use client";

import { useState } from "react";
import type { Zone, IncidentType } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { StageStepper } from "@/components/incidents/StageStepper";
import { formatClockShort } from "@/lib/format";
import { t } from "@/lib/i18n";
import { LANGUAGE_LABELS } from "@/lib/i18n";
import type { LanguageCode } from "@/lib/types";
import {
  buildEmergencyPacket,
  EMERGENCY_SMS_SHORTCODE,
  OFFLINE_SOP,
} from "@/lib/emergencyPacket";

const types: { type: IncidentType; label: string; icon: IconName; severity: "critical" | "moderate" }[] = [
  { type: "medical", label: "Medical Emergency", icon: "medical", severity: "critical" },
  { type: "security", label: "Security Concern", icon: "shield", severity: "critical" },
  { type: "crowd_pressure", label: "Crowd Distress", icon: "warning", severity: "moderate" },
  { type: "other", label: "Other Assistance", icon: "help-desk", severity: "moderate" },
];

export function SOSFlow({ zone, onClose }: { zone: Zone; onClose: () => void }) {
  const submitSOS = useAppStore((s) => s.submitSOS);
  const connectivity = useAppStore((s) => s.systemStatus.connectivity);
  const incidents = useAppStore((s) => s.incidents);
  const tasks = useAppStore((s) => s.tasks);
  const volunteers = useAppStore((s) => s.volunteers);
  const language = useAppStore((s) => s.language);

  const [step, setStep] = useState<"type" | "confirm" | "sending" | "sent">("type");
  const [selected, setSelected] = useState<(typeof types)[number] | null>(null);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageCode>(language);
  const [packetCopied, setPacketCopied] = useState(false);

  const offline = connectivity !== "nominal";
  const packet = buildEmergencyPacket(zone.code, zone.id, 1);

  const incident = incidentId ? incidents.find((i) => i.id === incidentId) : undefined;
  const task = incident ? tasks.find((t) => t.incidentId === incident.id) : undefined;
  const responder = incident?.assignedVolunteerId ? volunteers.find((v) => v.id === incident.assignedVolunteerId) : undefined;

  function handleConfirm() {
    if (!selected) return;
    setStep("sending");
    const delay = connectivity === "nominal" ? 500 : 2200;
    setTimeout(() => {
      const incident = submitSOS({
        type: selected.type,
        severity: selected.severity,
        zoneId: zone.id,
        reportedBy: { role: "pilgrim", label: `Pilgrim · ${zone.shortName}` },
        summary: `${selected.label} reported by a pilgrim near ${zone.shortName}.`,
        preferredLanguage,
      });
      setIncidentId(incident.id);
      setStep("sent");
    }, delay);
  }

  if (step === "type") {
    return (
      <div className="flex-1 flex flex-col p-4">
        <h1 className="text-lg font-semibold text-ink">What&rsquo;s the emergency?</h1>
        <p className="text-xs text-ink-muted mt-1">Select the option that best matches what&rsquo;s happening.</p>
        <div className="grid grid-cols-2 gap-3 mt-5">
          {types.map((opt) => (
            <button
              key={opt.type}
              onClick={() => {
                setSelected(opt);
                setStep("confirm");
              }}
              className="flex flex-col items-center gap-2 rounded-sm border border-border bg-surface py-6 hover:border-primary transition-colors"
            >
              <Icon name={opt.icon} className="h-6 w-6 text-primary-dark" />
              <span className="text-xs font-medium text-ink text-center">{opt.label}</span>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="text-xs text-ink-soft mt-6 self-center">
          Cancel
        </button>
      </div>
    );
  }

  if (step === "confirm" && selected) {
    return (
      <div className="flex-1 flex flex-col p-4 min-h-0">
        <div className="flex-1 overflow-y-auto scroll-thin flex flex-col items-center text-center px-2">
          <div className="h-14 w-14 rounded-full bg-status-red-bg flex items-center justify-center mb-5 mt-2 shrink-0">
            <Icon name={selected.icon} className="h-6 w-6 text-status-red" />
          </div>
          <h1 className="text-lg font-semibold text-ink">{t("confirmAssistanceTitle", language)}</h1>
          <p className="text-sm text-ink-muted mt-2 max-w-xs">
            Your location ({zone.shortName}) will be shared with the nearest available response volunteer and with
            the control room.
          </p>

          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-wide text-ink-soft mb-1.5">Preferred language for your responder</div>
            <div className="flex gap-1.5 justify-center flex-wrap">
              {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map((code) => (
                <button
                  key={code}
                  onClick={() => setPreferredLanguage(code)}
                  className={`px-2.5 py-1 text-xs rounded-sm border transition-colors ${
                    preferredLanguage === code ? "bg-primary text-white border-primary" : "border-border text-ink-muted"
                  }`}
                >
                  {LANGUAGE_LABELS[code]}
                </button>
              ))}
            </div>
          </div>

          {offline && (
            <div className="mt-5 w-full text-left rounded-sm border border-status-amber-border bg-status-amber-bg/50 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-status-amber">
                <Icon name="wifi-off" className="h-3.5 w-3.5" />
                Connectivity degraded — offline fallback
              </div>
              <p className="text-[11px] text-ink-muted mt-1">
                Send this emergency packet as an SMS. It carries your zone, location and time in one
                short message the control room can act on.
              </p>
              <div className="mt-2 font-mono-num text-[11px] bg-surface border border-border rounded-sm px-2 py-1.5 break-all text-ink">
                {packet}
              </div>
              <div className="flex gap-2 mt-2">
                <a
                  href={`sms:${EMERGENCY_SMS_SHORTCODE}?body=${encodeURIComponent(packet)}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-sm bg-status-red text-white text-xs font-medium py-2 hover:bg-[#8f2c20] transition-colors"
                >
                  <Icon name="phone" className="h-3.5 w-3.5" />
                  Send as SMS
                </a>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(packet);
                      setPacketCopied(true);
                      setTimeout(() => setPacketCopied(false), 2000);
                    } catch {}
                  }}
                  className="rounded-sm border border-border bg-surface text-xs text-ink-muted px-3 hover:text-ink"
                >
                  {packetCopied ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="mt-3 space-y-2">
                <div className="text-[10px] uppercase tracking-wide text-ink-soft">
                  While you wait — cached first response
                </div>
                {OFFLINE_SOP.map((sop) => (
                  <details key={sop.id} className="rounded-sm border border-border bg-surface">
                    <summary className="text-xs font-medium text-ink px-2.5 py-1.5 cursor-pointer">
                      {sop.title}
                    </summary>
                    <ol className="px-3 pb-2 space-y-1">
                      {sop.steps.map((s, i) => (
                        <li key={i} className="text-[11px] text-ink-muted flex gap-1.5">
                          <span className="text-primary font-semibold">{i + 1}.</span>
                          {s}
                        </li>
                      ))}
                    </ol>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-2 pt-3 shrink-0">
          <Button className="w-full" size="lg" onClick={handleConfirm}>
            {t("confirmSend", language)}
          </Button>
          <Button className="w-full" size="lg" variant="ghost" onClick={() => setStep("type")}>
            {t("cancel", language)}
          </Button>
        </div>
      </div>
    );
  }

  if (step === "sending") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="h-3 w-3 rounded-full bg-primary map-pulse" />
        <p className="text-sm text-ink-muted">
          {connectivity === "nominal" ? "Sending your request…" : "Attempting emergency fallback…"}
        </p>
      </div>
    );
  }

  if (step === "sent" && incident) {
    return (
      <div className="flex-1 flex flex-col p-4 overflow-y-auto scroll-thin">
        <div className="flex flex-col items-center text-center py-4">
          <div className="h-14 w-14 rounded-full bg-status-green-bg flex items-center justify-center mb-4">
            <Icon name="check" className="h-6 w-6 text-status-green" />
          </div>
          <h1 className="text-lg font-semibold text-ink">{t("requestSent", language)}</h1>
          <p className="font-mono-num text-sm text-ink-muted mt-1">{incident.code}</p>
        </div>

        <div className="rounded-sm border border-border bg-surface p-4 mt-2 space-y-3">
          <ChecklistRow label={t("locationShared", language)} done />
          <ChecklistRow label={t("volunteerNotified", language)} done={!!incident.assignedVolunteerId} />
          <ChecklistRow label={t("managementNotified", language)} done />
        </div>

        <div className="rounded-sm border border-border bg-surface p-4 mt-3">
          <div className="text-[10px] uppercase tracking-wide text-ink-soft mb-3">Status</div>
          <StageStepper status={incident.status} />
        </div>

        {responder && (
          <div className="flex items-center justify-between rounded-sm border border-border bg-surface-muted px-3 py-2.5 mt-3">
            <div>
              <div className="text-xs text-ink-soft">Nearest responder</div>
              <div className="text-sm font-medium text-ink">{responder.name} · {responder.id}</div>
              {incident.matchQuality && incident.matchQuality !== "nearest" && (
                <div className="text-[10px] text-status-green mt-0.5">
                  Matched on {incident.matchQuality === "skill_and_language" ? "skill + language" : incident.matchQuality}
                </div>
              )}
            </div>
            {incident.etaMinutes && (
              <div className="text-right">
                <div className="text-xs text-ink-soft">ETA</div>
                <div className="text-sm font-medium text-ink font-mono-num">{incident.etaMinutes} min</div>
              </div>
            )}
          </div>
        )}

        <div className="text-[11px] text-ink-soft mt-3">
          Reported {formatClockShort(incident.createdAt)}
          {offline ? " · sent via SMS fallback — status may lag until connectivity returns" : ""} · This
          status updates automatically as the volunteer and control room respond.
        </div>

        {task?.state === "resolved" && (
          <div className="mt-3 rounded-sm border border-status-green-border bg-status-green-bg px-3 py-2.5 text-sm text-status-green font-medium">
            Response complete. Stay safe.
          </div>
        )}

        <Button className="w-full mt-6" size="lg" variant="outline" onClick={onClose}>
          Back to Home
        </Button>
      </div>
    );
  }

  return null;
}

function ChecklistRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span
        className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${
          done ? "bg-status-green text-white" : "bg-surface-sunk"
        }`}
      >
        {done && <Icon name="check" className="h-2.5 w-2.5" strokeWidth={3} />}
      </span>
      <span className={done ? "text-ink" : "text-ink-soft"}>{label}</span>
    </div>
  );
}
