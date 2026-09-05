"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SimTag } from "@/components/ui/SimTag";
import type { GroundReportDraft } from "@/ai/schemas";

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

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/**
 * Structured ground-report review (§17/§19). Setu assembles the fields; the
 * volunteer sees exactly what will be submitted, can attach a photo, and
 * confirms. Ground truth is labelled UNVERIFIED and the source is shown.
 */
export function SetuReportCard({
  draft,
  zoneName,
  ready,
  busy,
  hasPhoto,
  onAttachPhoto,
  onSubmit,
  onCancel,
}: {
  draft: GroundReportDraft;
  zoneName: string;
  /** True when Setu has everything it needs and a submit is pending. */
  ready: boolean;
  busy?: boolean;
  hasPhoto: boolean;
  onAttachPhoto: (dataUrl: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <div className="mx-3 mb-2 rounded-sm border border-border bg-surface p-3 animate-fade-in-up">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon name="log" className="h-3.5 w-3.5 text-ink-muted" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-soft">
            {ready ? "Field report — review & submit" : "Field report — Setu is still gathering"}
          </span>
        </div>
        <SimTag label="UNVERIFIED" />
      </div>

      <dl className="grid grid-cols-[92px_1fr] gap-x-3 gap-y-1 text-xs">
        <dt className="text-ink-soft">Category</dt>
        <dd className="text-ink font-medium">{CATEGORY_LABEL[draft.category] ?? draft.category}</dd>
        <dt className="text-ink-soft">Summary</dt>
        <dd className="text-ink">{draft.summary || <span className="text-ink-soft italic">pending your description</span>}</dd>
        <dt className="text-ink-soft">Severity</dt>
        <dd className="text-ink font-medium uppercase">{draft.severity}</dd>
        {draft.estimatedPeopleAffected !== undefined && (
          <>
            <dt className="text-ink-soft">Est. impact</dt>
            <dd className="text-ink">~{draft.estimatedPeopleAffected} people</dd>
          </>
        )}
        <dt className="text-ink-soft">Location</dt>
        <dd className="text-ink">{zoneName} · your GPS (auto)</dd>
        <dt className="text-ink-soft">Source</dt>
        <dd className="text-ink">Volunteer observation</dd>
        <dt className="text-ink-soft">AI confidence</dt>
        <dd className="text-ink">{(draft.aiConfidence * 100) | 0}%</dd>
      </dl>

      {draft.missing.length > 0 && (
        <div className="mt-2 text-[11px] text-status-amber">
          Setu still needs: {draft.missing.join(", ")}. Answer in the box below.
        </div>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) onAttachPhoto(await fileToDataUrl(f));
          e.target.value = "";
        }}
      />

      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInput.current?.click()}
          className="shrink-0"
        >
          <Icon name="qr" className="h-3.5 w-3.5" />
          {hasPhoto ? "Photo added" : "Add photo"}
        </Button>
        {ready && (
          <>
            <Button size="sm" onClick={onSubmit} disabled={busy} className="flex-1">
              {busy ? "Submitting…" : "Submit report"}
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel} disabled={busy}>
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
