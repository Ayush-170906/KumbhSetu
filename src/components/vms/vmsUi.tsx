"use client";

import type { ReactNode } from "react";
import { StatusPill } from "@/components/ui/StatusPill";
import type { FieldDutyStatus, IdentityVerificationStatus } from "@/lib/types";
import type { NgoStatus, TrainingVolunteerStatus } from "@/lib/volunteerTypes";
import { FIELD_STATUS_LABELS, IDENTITY_STATUS_LABELS, NGO_STATUS_LABELS } from "@/lib/volunteerTypes";

export function DemoDataBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-700 shadow-sm">
      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
      DEMO DATA · 120+ SYNTHETIC VOLUNTEERS
    </span>
  );
}

export function SyntheticTag({ isSynthetic }: { isSynthetic?: boolean }) {
  if (isSynthetic) {
    return (
      <span className="inline-flex items-center rounded border border-amber-400/50 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-800">
        Demo Record
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded border border-emerald-400/50 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-800">
      Official
    </span>
  );
}

export function VmsBanner() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-status-amber-border bg-status-amber-bg/70 px-3.5 py-2.5 text-xs text-ink">
      <div className="flex items-center gap-2">
        <DemoDataBadge />
        <span className="text-[11px] text-ink-muted">
          All metrics derive from isolated synthetic session data. No raw Aadhaar/OTP numbers stored.
        </span>
      </div>
    </div>
  );
}

export function VmsStat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "green" | "amber" | "red";
}) {
  const color =
    tone === "green" ? "text-status-green" : tone === "amber" ? "text-status-amber" : tone === "red" ? "text-status-red" : "text-ink";
  return (
    <div className="border border-border bg-surface p-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">{label}</div>
      <div className={`mt-1 font-mono-num text-2xl font-semibold tabular-nums ${color}`}>{value}</div>
      {hint && <div className="mt-1 text-[11px] text-ink-soft">{hint}</div>}
    </div>
  );
}

export function BarChart({ items, max }: { items: { label: string; value: number }[]; max?: number }) {
  const ceiling = max ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-0.5 flex justify-between text-[11px] text-ink-muted">
            <span>{item.label}</span>
            <span className="font-mono-num">{item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-sm bg-surface-muted">
            <div className="h-full bg-primary" style={{ width: `${Math.round((item.value / ceiling) * 100)}%` }} />
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-xs text-ink-soft">No records in this range.</p>}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="text-xs text-ink-muted">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-[11px] text-ink-soft">{hint}</p>}
    </label>
  );
}

export const inputClass =
  "h-10 w-full border border-border bg-surface px-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";

export function identityTone(status: IdentityVerificationStatus | undefined) {
  if (status === "verified") return "green" as const;
  if (status === "failed") return "red" as const;
  if (status === "manual_review" || status === "verification_pending" || status === "consent_pending") return "yellow" as const;
  return "neutral" as const;
}

export function fieldTone(status: FieldDutyStatus | undefined) {
  if (status === "on_duty" || status === "checked_in") return "green" as const;
  if (status === "needs_assistance" || status === "absent") return "red" as const;
  if (status === "awaiting_checkin" || status === "assigned") return "yellow" as const;
  return "neutral" as const;
}

export function IdentityBadge({ status }: { status?: IdentityVerificationStatus }) {
  const value = status ?? "not_initiated";
  return <StatusPill tone={identityTone(value)}>{IDENTITY_STATUS_LABELS[value]}</StatusPill>;
}

export function FieldBadge({ status }: { status?: FieldDutyStatus }) {
  const value = status ?? "not_deployed";
  return <StatusPill tone={fieldTone(value)}>{FIELD_STATUS_LABELS[value]}</StatusPill>;
}

export function NgoBadge({ status }: { status: NgoStatus }) {
  const tone = status === "approved" ? "green" : status === "rejected" ? "red" : status === "draft" ? "neutral" : "yellow";
  return <StatusPill tone={tone}>{NGO_STATUS_LABELS[status]}</StatusPill>;
}

export function TrainingBadge({ status }: { status: TrainingVolunteerStatus }) {
  const tone = status === "completed" ? "green" : status === "incomplete" ? "red" : status === "not_enrolled" ? "neutral" : "yellow";
  return <StatusPill tone={tone}>{status.replace("_", " ")}</StatusPill>;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-dashed border-border bg-surface p-6 text-center">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-xs text-ink-muted">{body}</p>
    </div>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-border bg-surface p-5 shadow-lift">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="font-editorial text-lg text-ink">{title}</h2>
          <button type="button" className="text-xs text-ink-soft hover:text-ink" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
