"use client";

import type { Zone, RiskSnapshot, Facility, Advisory, LanguageCode } from "@/lib/types";
import { Icon, type IconName } from "@/components/ui/Icon";
import { StatusPill, bandLabel } from "@/components/ui/StatusPill";
import { SimTag } from "@/components/ui/SimTag";
import { OperationalMap } from "@/components/maps/OperationalMap";
import { facilityIconName, facilityLabel } from "./facilityMeta";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { t } from "@/lib/i18n";
import type { PilgrimScreen } from "./PilgrimApp";

const actions: { screen: PilgrimScreen; key: Parameters<typeof t>[0]; icon: IconName; tone?: "sos" }[] = [
  { screen: "sos-type", key: "sos", icon: "sos", tone: "sos" },
  { screen: "facilities", key: "findFacility", icon: "map-pin" },
  { screen: "route", key: "myRoute", icon: "route" },
  { screen: "lost-found", key: "lostFound", icon: "lost" },
  { screen: "report-issue", key: "reportIssue", icon: "qr" },
  { screen: "assistant", key: "askAssistant", icon: "bell" },
];

function greetingKey(): Parameters<typeof t>[0] {
  const h = new Date().getHours();
  if (h < 12) return "greetingMorning";
  if (h < 17) return "greetingAfternoon";
  return "greetingEvening";
}

export function HomeScreen({
  zone,
  zones,
  snapshot,
  facilities,
  advisories,
  language,
  onNavigate,
  onChangeZone,
  onChangeLanguage,
}: {
  zone: Zone;
  zones: Zone[];
  snapshot?: RiskSnapshot;
  facilities: Facility[];
  advisories: Advisory[];
  language: LanguageCode;
  onNavigate: (screen: PilgrimScreen) => void;
  onChangeZone: (zoneId: string) => void;
  onChangeLanguage: (l: LanguageCode) => void;
}) {
  const nearby = facilities.filter((f) => f.zoneId === zone.id).slice(0, 4);
  const activeAdvisories = advisories.filter((a) => a.active && (a.zoneId === "all" || a.zoneId === zone.id));

  return (
    <div className="flex-1 overflow-y-auto scroll-thin pb-8">
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-lg font-semibold text-ink">{t(greetingKey(), language)}</div>
            <div className="text-sm text-ink-muted">{t("howCanWeHelp", language)}</div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-2">
              <LanguageSwitcher value={language} onChange={onChangeLanguage} />
              <SimTag label="DEMO" />
            </div>
            <span className="text-[9px] text-ink-soft">Multilingual · Bhashini-ready</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Icon name="map-pin" className="h-3.5 w-3.5 text-ink-soft" />
          <span className="text-xs text-ink-muted">You are simulating a location in</span>
          <select
            value={zone.id}
            onChange={(e) => onChangeZone(e.target.value)}
            className="text-xs font-medium text-primary bg-transparent border-none focus:outline-none"
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.shortName}</option>
            ))}
          </select>
        </div>
      </div>

      {activeAdvisories.length > 0 && (
        <div className="mx-4 mt-3 space-y-2">
          {activeAdvisories.map((a) => (
            <div
              key={a.id}
              className={`rounded-sm border px-3 py-2.5 flex items-start gap-2.5 ${
                a.severity === "warning"
                  ? "border-status-red-border bg-status-red-bg text-status-red"
                  : a.severity === "advisory"
                  ? "border-status-amber-border bg-status-amber-bg text-status-amber"
                  : "border-primary-soft bg-primary-soft text-primary-soft-ink"
              }`}
            >
              <Icon name="bell" className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide">
                  {a.severity === "warning" ? "Police Warning" : a.severity === "advisory" ? "Advisory" : "Notice"} · {a.issuedBy}
                </div>
                <div className="text-xs mt-0.5">{a.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 mx-4 rounded-sm overflow-hidden border border-border h-40 bg-surface">
        <OperationalMap zones={zones} facilities={facilities} showVolunteers={false} />
      </div>

      {snapshot && (
        <div className="mx-4 mt-3 rounded-sm border border-border bg-surface p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-ink-soft">{t("currentArea", language)} · {zone.shortName}</div>
            <div className="text-sm font-medium text-ink mt-0.5">
              {zone.density === "high" || zone.density === "severe" ? "Dense crowd" : zone.density === "moderate" ? "Moderate crowd" : "Light crowd"}
            </div>
          </div>
          <StatusPill tone={snapshot.band}>{bandLabel(snapshot.band)}</StatusPill>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2.5 mx-4 mt-4">
        {actions.map((a) => (
          <button
            key={a.screen}
            onClick={() => onNavigate(a.screen)}
            className={`flex flex-col items-center justify-center gap-2 rounded-sm border py-4 transition-colors ${
              a.tone === "sos"
                ? "col-span-3 flex-row bg-primary border-primary text-white hover:bg-primary-dark"
                : "border-border bg-surface text-ink hover:bg-surface-muted"
            }`}
          >
            <Icon name={a.icon} className={a.tone === "sos" ? "h-5 w-5" : "h-5 w-5 text-ink-muted"} />
            <span className={`text-xs font-medium ${a.tone === "sos" ? "text-white text-sm" : ""}`}>{t(a.key, language)}</span>
          </button>
        ))}
      </div>

      <div className="mx-4 mt-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft mb-2">{t("nearby", language)}</div>
        <div className="space-y-2">
          {nearby.map((f) => (
            <div key={f.id} className="flex items-center gap-3 rounded-sm border border-border bg-surface px-3 py-2.5">
              <div className="h-8 w-8 rounded-sm bg-surface-muted flex items-center justify-center shrink-0">
                <Icon name={facilityIconName(f.type)} className="h-4 w-4 text-ink-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-ink truncate">{f.name}</div>
                <div className="text-[11px] text-ink-soft">{facilityLabel(f.type)}</div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-[11px] font-medium ${f.status === "open" ? "text-status-green" : "text-status-amber"}`}>
                  {f.status.toUpperCase()}
                </div>
                <div className="text-[10px] text-ink-soft">{f.load} load</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
