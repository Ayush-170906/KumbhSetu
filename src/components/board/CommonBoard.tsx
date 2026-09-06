"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/store/useAppStore";
import { subscribeToRealtimeEvents } from "@/lib/api";
import { formatRelative, formatClockShort } from "@/lib/format";
import { CONTACT_CENTRE } from "@/lib/contacts";
import type {
  DensityLevel,
  IncidentSeverity,
  AdvisorySeverity,
  VerificationStatus,
} from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { SimTag } from "@/components/ui/SimTag";

const densityTone: Record<DensityLevel, "green" | "yellow" | "red"> = {
  low: "green",
  moderate: "yellow",
  high: "red",
  severe: "red",
};
const severityTone: Record<IncidentSeverity, "neutral" | "yellow" | "red"> = {
  low: "neutral",
  moderate: "yellow",
  critical: "red",
};
const advisoryTone: Record<AdvisorySeverity, "info" | "yellow" | "red"> = {
  info: "info",
  advisory: "yellow",
  warning: "red",
};
const reportTone: Record<VerificationStatus, "neutral" | "yellow" | "info" | "green"> = {
  unverified: "neutral",
  reported: "neutral",
  corroborated: "yellow",
  verified: "info",
  resolved: "green",
  dismissed: "neutral",
};

function Section({
  title,
  hint,
  icon,
  children,
}: {
  title: string;
  hint?: string;
  icon: Parameters<typeof Icon>[0]["name"];
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-sm border border-border bg-surface shadow-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-surface-muted/40">
        <div className="h-7 w-7 rounded-sm bg-primary-soft flex items-center justify-center shrink-0">
          <Icon name={icon} className="h-4 w-4 text-primary-dark" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink leading-tight">{title}</h2>
          {hint && <p className="text-[11px] text-ink-soft leading-tight">{hint}</p>}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Stat({ value, label, tone = "ink" }: { value: number | string; label: string; tone?: "ink" | "red" | "amber" | "green" }) {
  const color =
    tone === "red" ? "text-status-red" : tone === "amber" ? "text-status-amber" : tone === "green" ? "text-status-green" : "text-ink";
  return (
    <div className="rounded-sm border border-border bg-surface px-3 py-2.5">
      <div className={`text-2xl font-semibold font-mono-num leading-none ${color}`}>{value}</div>
      <div className="text-[11px] text-ink-muted mt-1">{label}</div>
    </div>
  );
}

export function CommonBoard() {
  const store = useAppStore();
  const [now, setNow] = useState(() => new Date().toISOString());

  useEffect(() => {
    subscribeToRealtimeEvents(); // cross-tab sync only — does not drive the sim
    const t = setInterval(() => setNow(new Date().toISOString()), 30_000);
    return () => clearInterval(t);
  }, []);

  const activeIncidents = [...store.incidents]
    .filter((i) => !["resolved", "cancelled"].includes(i.status))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const activeAdvisories = store.advisories.filter((a) => a.active);
  const openReports = [...store.groundReports]
    .filter((r) => !["resolved", "dismissed"].includes(r.status))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const zonesAtRisk = store.zones.filter((z) => z.riskBand !== "green").length;
  const volAvailable = store.volunteers.filter((v) => v.availability === "available").length;
  const volOnTask = store.volunteers.filter((v) => v.availability === "on_task").length;
  const helpDesks = store.facilities.filter((f) => f.type === "help_desk");
  const zoneName = (id: string) => store.zones.find((z) => z.id === id)?.shortName ?? id;
  const volName = (id?: string) => (id ? store.volunteers.find((v) => v.id === id)?.name ?? id : null);

  return (
    <div className="min-h-screen bg-ivory">
      <header className="sticky top-0 z-20 border-b border-border bg-ivory/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/" className="h-8 w-8 rounded-sm bg-secondary flex items-center justify-center shrink-0">
              <Icon name="map-pin" className="h-4 w-4 text-white" />
            </Link>
            <div className="leading-tight min-w-0">
              <div className="text-sm font-semibold text-ink truncate">Common Operations Board</div>
              <div className="text-[11px] text-ink-soft">
                One shared picture · pilgrims · volunteers · control room
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-status-green font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-status-green animate-pulse" />
              Live · synced
            </span>
            <span className="text-[11px] text-ink-soft font-mono-num hidden sm:inline">
              {formatClockShort(now)}
            </span>
            <SimTag label="DEMO DATA" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* Snapshot */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <Stat value={activeIncidents.length} label="Active incidents" tone={activeIncidents.length ? "red" : "green"} />
          <Stat value={zonesAtRisk} label="Zones above green" tone={zonesAtRisk ? "amber" : "green"} />
          <Stat value={volAvailable} label="Volunteers available" tone="green" />
          <Stat value={volOnTask} label="Volunteers on task" />
          <Stat value={openReports.length} label="Open field reports" tone={openReports.length ? "amber" : "green"} />
          <Stat value={activeAdvisories.length} label="Notices in effect" tone={activeAdvisories.length ? "amber" : "green"} />
        </div>

        {/* Zone status */}
        <Section title="Zone status" hint="Crowd density and risk for every ghat and corridor" icon="layers">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {store.zones.map((z) => {
              const zi = activeIncidents.filter((i) => i.zoneId === z.id).length;
              const za = activeAdvisories.filter((a) => a.zoneId === z.id || a.zoneId === "all").length;
              return (
                <div key={z.id} className="rounded-sm border border-border bg-surface p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-ink truncate">
                        {z.code} · {z.shortName}
                      </div>
                      <div className="text-[11px] text-ink-soft truncate">{z.name}</div>
                    </div>
                    <StatusPill tone={z.riskBand} dot={false}>
                      {z.riskBand === "green" ? "OK" : z.riskBand === "yellow" ? "Watch" : "Alert"}
                    </StatusPill>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-surface-sunk overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        densityTone[z.density] === "green"
                          ? "bg-status-green"
                          : densityTone[z.density] === "yellow"
                          ? "bg-status-amber"
                          : "bg-status-red"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(4, z.densityPercent))}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-ink-muted">
                    <span className="capitalize">{z.density} · {z.densityPercent}% full</span>
                    <span className="flex items-center gap-2">
                      {zi > 0 && <span className="text-status-red">{zi} incident{zi > 1 ? "s" : ""}</span>}
                      {za > 0 && <span className="text-status-amber">{za} notice{za > 1 ? "s" : ""}</span>}
                      {zi === 0 && za === 0 && <span className="text-status-green">clear</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Ongoing response */}
        <Section title="Ongoing response" hint="Open incidents and who is on them right now" icon="pulse">
          {activeIncidents.length === 0 ? (
            <p className="text-xs text-ink-soft">
              No open incidents — all clear across every zone. Raise an SOS in the pilgrim app or{" "}
              <Link href="/demo" className="text-primary hover:text-primary-dark font-medium">
                run the live demo
              </Link>{" "}
              and it appears here instantly.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {activeIncidents.slice(0, 12).map((i) => (
                <div key={i.id} className="flex items-start gap-3 py-2 text-xs">
                  <StatusPill tone={severityTone[i.severity]} dot={false} className="mt-0.5 shrink-0">
                    {i.severity}
                  </StatusPill>
                  <div className="min-w-0 flex-1">
                    <div className="text-ink">
                      <span className="font-mono-num text-ink-soft">{i.code}</span>{" "}
                      <span className="font-medium capitalize">{i.type.replace(/_/g, " ")}</span>{" "}
                      <span className="text-ink-muted">· {zoneName(i.zoneId)}</span>
                    </div>
                    <div className="text-ink-muted truncate">{i.summary}</div>
                  </div>
                  <div className="text-right shrink-0 text-ink-soft">
                    <div className="capitalize text-ink-muted">{i.status.replace(/_/g, " ")}</div>
                    <div>{volName(i.assignedVolunteerId) ?? "unassigned"} · {formatRelative(i.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Notices */}
        <Section title="Notices & advisories" hint="What the control room has published to everyone" icon="bell">
          {activeAdvisories.length === 0 ? (
            <p className="text-xs text-ink-soft">No advisories in effect.</p>
          ) : (
            <div className="space-y-2">
              {activeAdvisories.map((a) => (
                <div key={a.id} className="flex items-start gap-3 text-xs">
                  <StatusPill tone={advisoryTone[a.severity]} dot={false} className="mt-0.5 shrink-0">
                    {a.severity}
                  </StatusPill>
                  <div className="min-w-0 flex-1">
                    <div className="text-ink">{a.message}</div>
                    <div className="text-ink-soft mt-0.5">
                      {a.zoneId === "all" ? "All zones" : zoneName(a.zoneId)} · {a.issuedBy} · {formatRelative(a.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Field reports */}
        <Section
          title="Field reports"
          hint="Issues volunteers and pilgrims have flagged from the ground"
          icon="warning"
        >
          {openReports.length === 0 ? (
            <p className="text-xs text-ink-soft">No open field reports.</p>
          ) : (
            <div className="divide-y divide-border">
              {openReports.slice(0, 12).map((r) => (
                <div key={r.id} className="flex items-start gap-3 py-2 text-xs">
                  <StatusPill tone={reportTone[r.status]} dot={false} className="mt-0.5 shrink-0">
                    {r.status}
                  </StatusPill>
                  <div className="min-w-0 flex-1">
                    <div className="text-ink">
                      <span className="font-medium capitalize">{r.category.replace(/_/g, " ")}</span>{" "}
                      <span className="text-ink-muted">· {zoneName(r.zoneId)}</span>
                    </div>
                    <div className="text-ink-muted truncate">{r.summary}</div>
                  </div>
                  <div className="text-right shrink-0 text-ink-soft">
                    {r.corroborations > 0 && <div>{r.corroborations} corroboration{r.corroborations > 1 ? "s" : ""}</div>}
                    <div>{formatRelative(r.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Contact centre */}
        <Section title="Contact centre" hint="Numbers to call — and where the help desks are" icon="phone">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {CONTACT_CENTRE.map((c) => (
              <a
                key={c.id}
                href={`tel:${c.number.replace(/[^0-9+]/g, "")}`}
                className="rounded-sm border border-border bg-surface p-3 hover:border-primary transition-colors block"
              >
                <div className="flex items-center gap-2">
                  <Icon name={c.icon} className="h-4 w-4 text-primary-dark shrink-0" />
                  <span className="text-xs font-semibold text-ink">{c.label}</span>
                </div>
                <div className="text-lg font-mono-num text-ink mt-1">{c.number}</div>
                <div className="text-[11px] text-ink-soft mt-0.5 leading-snug">{c.note}</div>
              </a>
            ))}
          </div>
          {helpDesks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft mb-1.5">
                Help desks on site
              </div>
              <div className="flex flex-wrap gap-1.5">
                {helpDesks.map((f) => (
                  <span
                    key={f.id}
                    className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface-muted/50 px-2 py-1 text-[11px] text-ink-muted"
                  >
                    <Icon name="help-desk" className="h-3 w-3" />
                    {f.name} · {zoneName(f.zoneId)}
                    <span className={f.status === "open" ? "text-status-green" : "text-status-amber"}>
                      {f.status}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* Jump-off links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { href: "/pilgrim", label: "Pilgrim app", icon: "pilgrim" as const },
            { href: "/field", label: "Field app", icon: "volunteer" as const },
            { href: "/management", label: "Control room", icon: "management" as const },
            { href: "/enroll", label: "Volunteer sign-up", icon: "help-desk" as const },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center gap-2 rounded-sm border border-border bg-surface px-3 py-2.5 text-xs font-medium text-ink hover:border-primary transition-colors"
            >
              <Icon name={l.icon} className="h-4 w-4 text-primary-dark" />
              {l.label}
            </Link>
          ))}
        </div>

        <p className="text-[11px] text-ink-soft leading-relaxed pt-1">
          This board is read-only. Every SOS, dispatch, advisory and ground report raised on the
          pilgrim, volunteer or control-room apps appears here within the same browser, live-synced
          across tabs. All data shown is synthetic and for demonstration only — not affiliated with
          any Kumbh Mela authority.
        </p>
      </main>
    </div>
  );
}
