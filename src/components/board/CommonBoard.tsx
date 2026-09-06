"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/store/useAppStore";
import { subscribeToRealtimeEvents } from "@/lib/api";
import { formatRelative, formatClockShort } from "@/lib/format";
import { CONTACT_CENTRE } from "@/lib/contacts";
import { BULLETINS, IMPORTANT_INSTRUCTIONS } from "@/lib/boardContent";
import type {
  DensityLevel,
  IncidentSeverity,
  AdvisorySeverity,
  VerificationStatus,
  FeedbackCategory,
} from "@/lib/types";
import { Icon, type IconName } from "@/components/ui/Icon";
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
const bulletinMeta: Record<string, { label: string; cls: string; icon: IconName }> = {
  news: { label: "News", cls: "bg-secondary-soft text-secondary", icon: "pulse" },
  notice: { label: "Notice", cls: "bg-status-amber-bg text-status-amber", icon: "bell" },
  report: { label: "Report", cls: "bg-primary-soft text-primary-soft-ink", icon: "chart" },
};
const FEEDBACK_CATS: FeedbackCategory[] = [
  "facilities",
  "cleanliness",
  "safety",
  "crowd",
  "staff",
  "app",
  "other",
];

function Section({
  title,
  hint,
  icon,
  children,
  right,
}: {
  title: string;
  hint?: string;
  icon: IconName;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface shadow-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-gradient-to-r from-primary-soft/50 to-transparent">
        <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shrink-0">
          <Icon name={icon} className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-ink leading-tight">{title}</h2>
          {hint && <p className="text-[11px] text-ink-soft leading-tight">{hint}</p>}
        </div>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Stat({
  value,
  label,
  tone = "ink",
}: {
  value: number | string;
  label: string;
  tone?: "ink" | "red" | "amber" | "green";
}) {
  const color =
    tone === "red"
      ? "text-status-red"
      : tone === "amber"
      ? "text-status-amber"
      : tone === "green"
      ? "text-status-green"
      : "text-ink";
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2.5">
      <div className={`text-2xl font-semibold font-mono-num leading-none ${color}`}>{value}</div>
      <div className="text-[11px] text-ink-muted mt-1">{label}</div>
    </div>
  );
}

function Stars({ n, className = "" }: { n: number; className?: string }) {
  return (
    <span className={`inline-flex gap-0.5 ${className}`} aria-label={`${n} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`h-3.5 w-3.5 ${i <= n ? "fill-primary" : "fill-border-strong"}`}
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15.9 4.8 18.6l1-5.8L1.5 8.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

export function CommonBoard() {
  const store = useAppStore();
  const [now, setNow] = useState(() => new Date().toISOString());

  // feedback form state
  const [fbRating, setFbRating] = useState(0);
  const [fbCat, setFbCat] = useState<FeedbackCategory>("facilities");
  const [fbZone, setFbZone] = useState("");
  const [fbName, setFbName] = useState("");
  const [fbMsg, setFbMsg] = useState("");
  const [fbDone, setFbDone] = useState(false);

  useEffect(() => {
    subscribeToRealtimeEvents();
    const t = setInterval(() => setNow(new Date().toISOString()), 30_000);
    return () => clearInterval(t);
  }, []);

  const activeIncidents = useMemo(
    () =>
      [...store.incidents]
        .filter((i) => !["resolved", "cancelled"].includes(i.status))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [store.incidents]
  );
  const activeAdvisories = store.advisories.filter((a) => a.active);
  const openReports = [...store.groundReports]
    .filter((r) => !["resolved", "dismissed"].includes(r.status))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const zonesAtRisk = store.zones.filter((z) => z.riskBand !== "green").length;
  const volAvailable = store.volunteers.filter((v) => v.availability === "available").length;
  const volOnTask = store.volunteers.filter((v) => v.availability === "on_task").length;
  const helpDesks = store.facilities.filter((f) => f.type === "help_desk");
  const zoneName = (id?: string) =>
    id ? store.zones.find((z) => z.id === id)?.shortName ?? id : "";
  const volName = (id?: string) =>
    id ? store.volunteers.find((v) => v.id === id)?.name ?? id : null;

  const feedback = store.pilgrimFeedback;
  const avgRating =
    feedback.length > 0
      ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1)
      : "—";

  function submitFeedback() {
    if (!fbRating || fbMsg.trim().length < 3) return;
    store.submitFeedback({
      name: fbName,
      zoneId: fbZone,
      rating: fbRating,
      category: fbCat,
      message: fbMsg,
    });
    setFbDone(true);
    setFbRating(0);
    setFbMsg("");
    setFbName("");
    setTimeout(() => setFbDone(false), 3500);
  }

  return (
    <div className="min-h-screen bg-ivory">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-border">
        <img
          src="/images/kumbh/godavari-ghats.jpg"
          alt="Pilgrims on the ghats of the Godavari at Nashik during the Kumbh Mela"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#3b1c0e]/92 via-[#7a2f14]/78 to-[#bf5326]/45" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-7 sm:py-9">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white text-xs"
              >
                <Icon name="map-pin" className="h-4 w-4" />
                Kumbh Setu
              </Link>
              <h1 className="text-white font-editorial text-2xl sm:text-3xl mt-1.5 leading-tight">
                Common Operations Board
              </h1>
              <p className="text-white/75 text-xs sm:text-sm mt-1 max-w-lg">
                One shared, live picture for everyone — pilgrims, volunteers and the control room.
                News, notices, live incidents, zone status, helplines and feedback in one place.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-2.5 py-1 text-[11px] text-white font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-status-green animate-pulse" />
                Live · synced
              </span>
              <span className="text-[11px] text-white/70 font-mono-num">{formatClockShort(now)}</span>
              <SimTag label="DEMO DATA" className="!bg-white/10 !text-white/80 !border-white/20" />
            </div>
          </div>
        </div>
        <span className="absolute bottom-1 right-2 text-[9px] text-white/45">
          Photo: Prashant Kharote · CC BY-SA 4.0 · Wikimedia Commons
        </span>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* Snapshot */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <Stat
            value={activeIncidents.length}
            label="Active incidents"
            tone={activeIncidents.length ? "red" : "green"}
          />
          <Stat
            value={zonesAtRisk}
            label="Zones above green"
            tone={zonesAtRisk ? "amber" : "green"}
          />
          <Stat value={volAvailable} label="Volunteers available" tone="green" />
          <Stat value={volOnTask} label="Volunteers on task" />
          <Stat
            value={openReports.length}
            label="Open field reports"
            tone={openReports.length ? "amber" : "green"}
          />
          <Stat
            value={activeAdvisories.length}
            label="Notices in effect"
            tone={activeAdvisories.length ? "amber" : "green"}
          />
        </div>

        {/* News & bulletins */}
        <Section
          title="News & bulletins"
          hint="Latest from the Mela administration"
          icon="pulse"
        >
          <div className="space-y-2.5">
            {BULLETINS.map((b) => {
              const m = bulletinMeta[b.kind];
              return (
                <div key={b.id} className="flex gap-3">
                  <div
                    className={`shrink-0 h-8 w-8 rounded-md flex items-center justify-center ${m.cls}`}
                  >
                    <Icon name={m.icon} className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-ink">{b.title}</span>
                      <span
                        className={`text-[9px] uppercase tracking-wide rounded-sm px-1 py-px ${m.cls}`}
                      >
                        {m.label}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{b.body}</p>
                    <div className="text-[11px] text-ink-soft mt-0.5 font-mono-num">
                      {b.date} · {b.source}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Important instructions */}
        <Section
          title="Important instructions"
          hint="Keep your group safe in the crowd"
          icon="shield"
        >
          <div className="grid sm:grid-cols-3 gap-2.5">
            {IMPORTANT_INSTRUCTIONS.map((g) => {
              const tone =
                g.tone === "do"
                  ? { border: "border-status-green-border", head: "text-status-green", dot: "text-status-green" }
                  : g.tone === "dont"
                  ? { border: "border-status-red-border", head: "text-status-red", dot: "text-status-red" }
                  : { border: "border-status-amber-border", head: "text-status-amber", dot: "text-status-amber" };
              return (
                <div
                  key={g.heading}
                  className={`rounded-md border ${tone.border} bg-surface p-3`}
                >
                  <div className={`text-xs font-bold uppercase tracking-wide ${tone.head} mb-1.5`}>
                    {g.heading}
                  </div>
                  <ul className="space-y-1.5">
                    {g.items.map((it, i) => (
                      <li key={i} className="text-[11px] text-ink-muted flex gap-1.5 leading-snug">
                        <span className={`${tone.dot} shrink-0`}>
                          {g.tone === "dont" ? "✕" : g.tone === "emergency" ? "!" : "✓"}
                        </span>
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Zone status */}
        <Section
          title="Zone status"
          hint="Crowd density and risk for every ghat and corridor"
          icon="layers"
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {store.zones.map((z) => {
              const zi = activeIncidents.filter((i) => i.zoneId === z.id).length;
              const za = activeAdvisories.filter(
                (a) => a.zoneId === z.id || a.zoneId === "all"
              ).length;
              return (
                <div key={z.id} className="rounded-md border border-border bg-surface p-3">
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
                    <span className="capitalize">
                      {z.density} · {z.densityPercent}% full
                    </span>
                    <span className="flex items-center gap-2">
                      {zi > 0 && (
                        <span className="text-status-red">
                          {zi} incident{zi > 1 ? "s" : ""}
                        </span>
                      )}
                      {za > 0 && (
                        <span className="text-status-amber">
                          {za} notice{za > 1 ? "s" : ""}
                        </span>
                      )}
                      {zi === 0 && za === 0 && <span className="text-status-green">clear</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Ongoing response */}
        <Section
          title="Ongoing response"
          hint="Open incidents and who is on them right now"
          icon="pulse"
        >
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
                  <StatusPill
                    tone={severityTone[i.severity]}
                    dot={false}
                    className="mt-0.5 shrink-0"
                  >
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
                    <div>
                      {volName(i.assignedVolunteerId) ?? "unassigned"} · {formatRelative(i.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Notices */}
        <Section
          title="Notices & advisories"
          hint="What the control room has published to everyone"
          icon="bell"
        >
          {activeAdvisories.length === 0 ? (
            <p className="text-xs text-ink-soft">No advisories in effect right now.</p>
          ) : (
            <div className="space-y-2">
              {activeAdvisories.map((a) => (
                <div key={a.id} className="flex items-start gap-3 text-xs">
                  <StatusPill
                    tone={advisoryTone[a.severity]}
                    dot={false}
                    className="mt-0.5 shrink-0"
                  >
                    {a.severity}
                  </StatusPill>
                  <div className="min-w-0 flex-1">
                    <div className="text-ink">{a.message}</div>
                    <div className="text-ink-soft mt-0.5">
                      {a.zoneId === "all" ? "All zones" : zoneName(a.zoneId)} · {a.issuedBy} ·{" "}
                      {formatRelative(a.createdAt)}
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
                      <span className="font-medium capitalize">
                        {r.category.replace(/_/g, " ")}
                      </span>{" "}
                      <span className="text-ink-muted">· {zoneName(r.zoneId)}</span>
                    </div>
                    <div className="text-ink-muted truncate">{r.summary}</div>
                  </div>
                  <div className="text-right shrink-0 text-ink-soft">
                    {r.corroborations > 0 && (
                      <div>
                        {r.corroborations} corroboration{r.corroborations > 1 ? "s" : ""}
                      </div>
                    )}
                    <div>{formatRelative(r.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Feedback */}
        <Section
          title="Pilgrim feedback"
          hint="Ratings and notes from people on the ground"
          icon="pilgrim"
          right={
            <div className="text-right shrink-0">
              <div className="text-lg font-semibold font-mono-num text-ink leading-none">
                {avgRating}
              </div>
              <div className="text-[10px] text-ink-soft">avg · {feedback.length} rating{feedback.length === 1 ? "" : "s"}</div>
            </div>
          }
        >
          <div className="grid lg:grid-cols-2 gap-4">
            {/* list */}
            <div className="space-y-2 order-2 lg:order-1">
              {feedback.slice(0, 6).map((f) => (
                <div key={f.id} className="rounded-md border border-border bg-surface p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <Stars n={f.rating} />
                    <span className="text-[11px] text-ink-soft">
                      {f.name ?? "Anonymous"}
                      {f.zoneId ? ` · ${zoneName(f.zoneId)}` : ""} · {formatRelative(f.createdAt)}
                    </span>
                  </div>
                  <div className="text-xs text-ink-muted mt-1">
                    <span className="capitalize font-medium text-ink">{f.category}</span> — {f.message}
                  </div>
                </div>
              ))}
              {feedback.length === 0 && (
                <p className="text-xs text-ink-soft">No feedback yet — be the first.</p>
              )}
            </div>

            {/* form */}
            <div className="rounded-md border border-border bg-surface-muted/40 p-3 order-1 lg:order-2">
              <div className="text-xs font-semibold text-ink mb-2">Leave feedback</div>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    onClick={() => setFbRating(i)}
                    aria-label={`${i} star${i > 1 ? "s" : ""}`}
                    className="p-0.5"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      className={`h-6 w-6 ${
                        i <= fbRating ? "fill-primary" : "fill-border-strong"
                      } hover:fill-primary-dark transition-colors`}
                    >
                      <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15.9 4.8 18.6l1-5.8L1.5 8.7l5.9-.9L10 1.5z" />
                    </svg>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <select
                  value={fbCat}
                  onChange={(e) => setFbCat(e.target.value as FeedbackCategory)}
                  className="text-xs rounded-sm border border-border bg-surface px-2 py-1.5 focus:outline-none focus:border-primary capitalize"
                >
                  {FEEDBACK_CATS.map((c) => (
                    <option key={c} value={c} className="capitalize">
                      {c}
                    </option>
                  ))}
                </select>
                <select
                  value={fbZone}
                  onChange={(e) => setFbZone(e.target.value)}
                  className="text-xs rounded-sm border border-border bg-surface px-2 py-1.5 focus:outline-none focus:border-primary"
                >
                  <option value="">Any zone</option>
                  {store.zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.shortName}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={fbMsg}
                onChange={(e) => setFbMsg(e.target.value)}
                rows={3}
                placeholder="What was good, what could be better?"
                className="w-full text-xs rounded-sm border border-border bg-surface px-2 py-1.5 focus:outline-none focus:border-primary resize-none mb-2"
              />
              <input
                value={fbName}
                onChange={(e) => setFbName(e.target.value)}
                placeholder="Your name (optional)"
                className="w-full text-xs rounded-sm border border-border bg-surface px-2 py-1.5 focus:outline-none focus:border-primary mb-2"
              />
              <button
                onClick={submitFeedback}
                disabled={!fbRating || fbMsg.trim().length < 3}
                className="w-full rounded-sm bg-primary text-white text-xs font-medium py-2 hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {fbDone ? "Thank you — added" : "Submit feedback"}
              </button>
            </div>
          </div>
        </Section>

        {/* Contact centre */}
        <Section
          title="Contact centre"
          hint="Numbers to call — and where the help desks are"
          icon="phone"
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {CONTACT_CENTRE.map((c) => (
              <a
                key={c.id}
                href={`tel:${c.number.replace(/[^0-9+]/g, "")}`}
                className="rounded-md border border-border bg-surface p-3 hover:border-primary transition-colors block"
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
              className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2.5 text-xs font-medium text-ink hover:border-primary transition-colors"
            >
              <Icon name={l.icon} className="h-4 w-4 text-primary-dark" />
              {l.label}
            </Link>
          ))}
        </div>

        <p className="text-[11px] text-ink-soft leading-relaxed pt-1">
          This board is read-only apart from feedback. Every SOS, dispatch, advisory and ground
          report raised on the pilgrim, volunteer or control-room apps appears here within the same
          browser, live-synced across tabs. Operational data and bulletins shown are synthetic and
          for demonstration only — not affiliated with any Kumbh Mela authority. Photos from
          Wikimedia Commons (see <span className="font-mono-num">public/images/kumbh/CREDITS.md</span>).
        </p>
      </main>
    </div>
  );
}
