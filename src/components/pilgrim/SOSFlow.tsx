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
import { OFFLINE_SOP } from "@/lib/emergencyPacket";

const types: { type: IncidentType; label: string; icon: IconName; severity: "critical" | "moderate" }[] = [
  { type: "medical", label: "Medical Emergency", icon: "medical", severity: "critical" },
  { type: "security", label: "Security Concern", icon: "shield", severity: "critical" },
  { type: "crowd_pressure", label: "Crowd Distress", icon: "warning", severity: "moderate" },
  { type: "other", label: "Other Assistance", icon: "help-desk", severity: "moderate" },
];

const translatedLabels: Record<IncidentType, Record<LanguageCode, string>> = {
  medical: { en: "Medical Emergency", hi: "चिकित्सा आपातकाल", mr: "वैद्यकीय आपत्काल", ta: "மருத்துவ அவசரம்" },
  security: { en: "Security Concern", hi: "सुरक्षा संबंधी चिंता", mr: "सुरक्षाविषयक चिंता", ta: "பாதுகாப்பு கவலை" },
  crowd_pressure: { en: "Crowd Distress", hi: "भीड़ में परेशानी", mr: "गर्दीतील त्रास", ta: "கூட்ட நெரிசல் சிக்கல்" },
  facility: { en: "Facility Issue", hi: "सुविधा संबंधी समस्या", mr: "सुविधेची समस्या", ta: "வசதி தொடர்பான சிக்கல்" },
  lost_person: { en: "Missing Person", hi: "लापता व्यक्ति", mr: "हरवलेली व्यक्ती", ta: "காணாமல் போனவர்" },
  other: { en: "Other Assistance", hi: "अन्य सहायता", mr: "इतर मदत", ta: "பிற உதவி" },
};

export function SOSFlow({ zone, onClose }: { zone: Zone; onClose: () => void }) {
  const submitSOS = useAppStore((s) => s.submitSOS);
  const connectivity = useAppStore((s) => s.systemStatus.connectivity);
  const incidents = useAppStore((s) => s.incidents);
  const tasks = useAppStore((s) => s.tasks);
  const volunteers = useAppStore((s) => s.volunteers);
  const zones = useAppStore((s) => s.zones);
  const language = useAppStore((s) => s.language);

  const [step, setStep] = useState<"type" | "confirm" | "sending" | "sent">("type");
  const [selected, setSelected] = useState<(typeof types)[number] | null>(null);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageCode>(language);
  const [locationZoneId, setLocationZoneId] = useState(zone.id);
  const [locationDetail, setLocationDetail] = useState("");
  const [reportError, setReportError] = useState("");

  const offline = connectivity !== "nominal";
  const reportZone = zones.find((item) => item.id === locationZoneId) ?? zone;

  const incident = incidentId ? incidents.find((i) => i.id === incidentId) : undefined;
  const task = incident ? tasks.find((t) => t.incidentId === incident.id) : undefined;
  const responder = incident?.assignedVolunteerId ? volunteers.find((v) => v.id === incident.assignedVolunteerId) : undefined;

  function handleConfirm() {
    if (!selected) return;
    if (!reportZone) {
      setReportError("Choose the nearest landmark so the sample report has a location.");
      return;
    }
    setReportError("");
    setStep("sending");
    const delay = connectivity === "nominal" ? 500 : 2200;
    setTimeout(() => {
      const incident = submitSOS({
        type: selected.type,
        severity: selected.severity,
        zoneId: reportZone.id,
        reportedBy: { role: "pilgrim", label: `Pilgrim · ${reportZone.shortName}` },
        summary: `${selected.label} reported by a pilgrim near ${reportZone.shortName}${locationDetail.trim() ? ` — ${locationDetail.trim()}` : ""}.`,
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
        <div className="mt-4 flex items-center justify-between gap-3 border-l-2 border-status-red bg-status-red-bg/60 px-3 py-2.5">
          <p className="text-[11px] leading-relaxed text-ink-muted">This prototype only saves a sample report here. For urgent real-world help, call <strong className="text-ink">112</strong>.</p>
          <a href="tel:112" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 bg-status-red px-3 text-xs font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-status-red"><Icon name="phone" className="h-3.5 w-3.5" />Call 112</a>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-5">
          {types.map((opt) => (
            <button
              key={opt.type}
              onClick={() => {
                setSelected(opt);
                setStep("confirm");
              }}
              className="flex min-h-24 flex-col items-center justify-center gap-2 border border-border bg-surface px-2 py-4 hover:border-primary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Icon name={opt.icon} className="h-6 w-6 text-primary-dark" />
              <span className="text-xs font-medium text-ink text-center">{translatedLabels[opt.type][language]}</span>
            </button>
          ))}
        </div>
          <button onClick={onClose} className="mt-4 min-h-11 px-4 text-xs text-ink-soft self-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
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
            This prototype saves a sample report in this browser only. It does not contact a responder or share your location.
          </p>

          <div className="mt-4 w-full text-left">
            <label htmlFor="sos-location" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-ink-soft">Nearest landmark or zone</label>
            <select id="sos-location" value={locationZoneId} onChange={(event) => { setLocationZoneId(event.target.value); setReportError(""); }} className="h-11 w-full border border-border bg-surface px-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
              {zones.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <p className="mt-1 text-[10px] text-ink-soft">Approximate sample zone only. GPS permission is not requested.</p>
            <label htmlFor="sos-detail" className="mb-1.5 mt-3 block text-[10px] font-semibold uppercase tracking-wide text-ink-soft">Helpful detail <span className="normal-case font-normal">(optional)</span></label>
            <textarea id="sos-detail" value={locationDetail} maxLength={160} onChange={(event) => { setLocationDetail(event.target.value); setReportError(""); }} rows={2} placeholder="A nearby gate, sign or visible landmark" className="w-full resize-none border border-border bg-surface px-3 py-2 text-xs text-ink placeholder:text-ink-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" />
          </div>

          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-wide text-ink-soft mb-1.5">Preferred language · demo setting</div>
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
                Connectivity degraded
              </div>
              <p className="text-[11px] text-ink-muted mt-1">
                This prototype has no emergency SMS service. For urgent help, call the official national emergency number.
              </p>
              <a href="tel:112" className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-status-red px-4 py-2 text-sm font-semibold text-white">Call 112</a>

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
          {reportError && <p role="alert" className="border border-status-red-border bg-status-red-bg px-3 py-2 text-xs text-status-red">{reportError}</p>}
          <Button className="w-full" size="lg" onClick={handleConfirm}>
            Create local sample report
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
          Creating a sample report…
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
          <h1 className="text-lg font-semibold text-ink">Demo report created</h1>
          <p className="font-mono-num text-sm text-ink-muted mt-1">{incident.code}</p>
          <p className="text-xs text-ink-muted mt-2 max-w-xs">Saved in this browser’s prototype session. No emergency service or authority has been contacted.</p>
        </div>

        <div className="rounded-sm border border-border bg-surface p-4 mt-2 space-y-3">
          <ChecklistRow label="Sample location attached to demo report" done />
          <ChecklistRow label="Visible in the local volunteer demo" done={!!incident.assignedVolunteerId} />
          <ChecklistRow label="Visible in the local management demo" done />
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
          {offline ? " · connectivity marked degraded in demo" : ""} · Local demo status only.
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
