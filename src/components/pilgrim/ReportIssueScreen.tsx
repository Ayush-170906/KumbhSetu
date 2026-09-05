"use client";

import { useRef, useState } from "react";
import type { Zone } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ReportIssueScreen({ zone, onClose }: { zone: Zone; onClose: () => void }) {
  const submitSOS = useAppStore((s) => s.submitSOS);
  const attachPhoto = useAppStore((s) => s.attachPhoto);
  const fileInput = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [step, setStep] = useState<"form" | "sent">("form");
  const [caseCode, setCaseCode] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setPhoto(dataUrl);
  }

  function submit() {
    const incident = submitSOS({
      type: "facility",
      severity: "low",
      zoneId: zone.id,
      reportedBy: { role: "pilgrim", label: `Pilgrim · ${zone.shortName}` },
      summary: caption.trim() || `Facility issue reported near ${zone.shortName} (photo attached).`,
    });
    if (photo) attachPhoto(incident.id, photo, `Pilgrim · ${zone.shortName}`);
    setCaseCode(incident.code);
    setStep("sent");
  }

  if (step === "sent") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
        <div className="h-14 w-14 rounded-full bg-status-green-bg flex items-center justify-center mb-4">
          <Icon name="check" className="h-6 w-6 text-status-green" />
        </div>
        <h1 className="text-lg font-semibold text-ink">Issue Reported</h1>
        <p className="font-mono-num text-sm text-ink-muted mt-1">{caseCode}</p>
        <p className="text-xs text-ink-muted mt-3 max-w-xs">
          Your photo and note are attached to a case visible to the control room — no need to describe the problem
          twice.
        </p>
        <Button className="mt-6" onClick={onClose}>Done</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4">
      <h1 className="text-base font-semibold text-ink">Report a Facility Issue</h1>
      <p className="text-xs text-ink-muted mt-1 mb-4">
        Snap a photo — an overflowing bin, a broken tap, a blocked path — near {zone.shortName}. It goes straight to
        the control room as a structured case, no queue at a help desk needed.
      </p>

      <input ref={fileInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

      {photo ? (
        <div className="relative rounded-sm overflow-hidden border border-border h-48 mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="Reported issue" className="w-full h-full object-cover" />
          <button
            onClick={() => setPhoto(null)}
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-ink/60 text-white flex items-center justify-center"
          >
            <Icon name="close" className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInput.current?.click()}
          className="flex flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed border-border-strong bg-surface h-40 mb-3 text-ink-muted hover:border-primary hover:text-primary-dark transition-colors"
        >
          <Icon name="qr" className="h-6 w-6" />
          <span className="text-xs font-medium">Tap to add a photo</span>
        </button>
      )}

      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="What's wrong here? (optional — the photo speaks for itself)"
        className="min-h-20 rounded-sm border border-border bg-surface p-3 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:border-primary resize-none"
      />

      <div className="space-y-2 mt-4">
        <Button className="w-full" size="lg" disabled={!photo && caption.trim().length === 0} onClick={submit}>
          Submit Report
        </Button>
        <Button className="w-full" size="lg" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
