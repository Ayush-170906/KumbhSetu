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

type Step = "details" | "review" | "sent";

export function ReportIssueScreen({ zone, onClose }: { zone: Zone; onClose: () => void }) {
  const submitSOS = useAppStore((s) => s.submitSOS);
  const attachPhoto = useAppStore((s) => s.attachPhoto);
  const zones = useAppStore((s) => s.zones);
  const fileInput = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [zoneId, setZoneId] = useState(zone.id);
  const [step, setStep] = useState<Step>("details");
  const [caseCode, setCaseCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedZone = zones.find((item) => item.id === zoneId) ?? zone;
  const validCaption = caption.trim().length >= 8 && caption.trim().length <= 240;
  const canContinue = Boolean(photo || validCaption);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (file.size > 5 * 1024 * 1024) {
      setError("Choose a photo smaller than 5 MB.");
      e.target.value = "";
      return;
    }
    setLoading(true);
    try {
      setPhoto(await fileToDataUrl(file));
    } catch {
      setError("That photo could not be opened. Try another image or continue with a note.");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  function submit() {
    if (!canContinue || loading) {
      setError("Add a clear note of at least 8 characters or attach a photo.");
      setStep("details");
      return;
    }
    setError("");
    try {
      const incident = submitSOS({
        type: "facility",
        severity: "low",
        zoneId: selectedZone.id,
        reportedBy: { role: "pilgrim", label: `Pilgrim · ${selectedZone.shortName}` },
        summary: caption.trim() || `Facility issue reported near ${selectedZone.shortName} (photo attached).`,
      });
      if (photo) attachPhoto(incident.id, photo, `Pilgrim · ${selectedZone.shortName}`);
      setCaseCode(incident.code);
      setStep("sent");
    } catch {
      setError("The sample report could not be saved in this browser. Please try again.");
    }
  }

  if (step === "sent") {
    return <div className="flex-1 flex flex-col items-center justify-center text-center p-6" role="status"><div className="h-14 w-14 bg-status-green-bg flex items-center justify-center mb-4"><Icon name="check" className="h-6 w-6 text-status-green" /></div><p className="eyebrow text-status-green">Saved locally</p><h1 className="mt-1 text-lg font-semibold text-ink">Issue report created</h1><p className="font-mono-num text-sm text-ink-muted mt-1">{caseCode}</p><p className="text-xs text-ink-muted mt-3 max-w-xs">Saved in this browser’s prototype session only. No service team or authority has received it.</p><Button className="mt-6 min-w-36" onClick={onClose}>Done</Button></div>;
  }

  return (
    <div className="flex-1 flex flex-col p-4">
      <div className="mb-4 flex items-center justify-between gap-3"><div><p className="eyebrow text-primary-dark">Step {step === "details" ? "1" : "2"} of 2</p><h1 className="mt-1 text-base font-semibold text-ink">Report a facility issue</h1></div><span className="text-xs text-ink-soft">Local prototype</span></div>
      {step === "details" ? <>
        <p className="text-xs text-ink-muted mb-4">Add a location and a short description, or attach a photo. This report stays in this browser.</p>
        <label htmlFor="issue-location" className="mb-1.5 text-xs font-semibold text-ink">Where is the issue?</label>
        <select id="issue-location" value={zoneId} onChange={(event) => setZoneId(event.target.value)} className="mb-4 h-11 w-full border border-border bg-surface px-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
          {zones.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <p className="mb-3 border-l-2 border-primary bg-primary-soft/40 px-3 py-2 text-[11px] leading-relaxed text-ink-muted">Approximate demo zone: <strong className="text-ink">{selectedZone.name}</strong>. GPS is not requested or attached.</p>
        <label htmlFor="issue-caption" className="mb-1.5 text-xs font-semibold text-ink">What needs attention?</label>
        <textarea id="issue-caption" value={caption} maxLength={240} onChange={(event) => { setCaption(event.target.value); setError(""); }} placeholder="For example: water point is empty near the north entrance" className="min-h-24 w-full resize-none border border-border bg-surface p-3 text-sm text-ink placeholder:text-ink-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" aria-describedby="issue-caption-hint" />
        <div id="issue-caption-hint" className="mt-1 flex justify-between text-[10px] text-ink-soft"><span>{caption.trim().length > 0 && !validCaption ? "Enter 8–240 characters." : "Avoid names, faces and personal details."}</span><span>{caption.length}/240</span></div>
        <input ref={fileInput} type="file" accept="image/*" capture="environment" className="sr-only" onChange={handleFile} aria-label="Attach a photo" />
        {photo ? <div className="mt-3 flex items-center justify-between gap-3 border border-border bg-surface p-2"><span className="text-xs text-ink-muted">Photo ready to attach</span><button type="button" onClick={() => setPhoto(null)} className="min-h-10 px-3 text-xs font-semibold text-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">Remove photo</button></div> : <button type="button" disabled={loading} onClick={() => fileInput.current?.click()} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 border border-border-strong bg-surface text-xs font-semibold text-ink hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">{loading ? "Opening photo…" : "Attach a photo (optional)"}</button>}
      </> : <>
        <p className="text-xs text-ink-muted">Check the details before creating a local sample report.</p>
        <dl className="mt-4 divide-y divide-border border-y border-border bg-surface px-3"><div className="py-3"><dt className="text-[10px] uppercase tracking-wide text-ink-soft">Location</dt><dd className="mt-1 text-sm font-semibold text-ink">{selectedZone.name} · approximate demo zone</dd></div><div className="py-3"><dt className="text-[10px] uppercase tracking-wide text-ink-soft">Description</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-ink">{caption.trim() || "Facility concern (photo attached)"}</dd></div><div className="py-3"><dt className="text-[10px] uppercase tracking-wide text-ink-soft">Attachment</dt><dd className="mt-1 text-sm text-ink">{photo ? "1 local image" : "None"}</dd></div></dl>
        <p className="mt-4 border-l-2 border-status-amber bg-status-amber-bg/60 px-3 py-2.5 text-xs leading-relaxed text-ink-muted">This creates a record in the prototype only. It does not notify field teams or authorities. For urgent help, call <a href="tel:112" className="font-semibold text-status-red underline">112</a>.</p>
      </>}
      {error && <p role="alert" className="mt-3 border border-status-red-border bg-status-red-bg px-3 py-2 text-xs text-status-red">{error}</p>}
      <div className="mt-auto space-y-2 pt-5">{step === "details" ? <Button className="w-full" size="lg" disabled={!canContinue || loading} onClick={() => { setError(""); setStep("review"); }}>Review report</Button> : <Button className="w-full" size="lg" disabled={loading} onClick={submit}>{loading ? "Saving sample…" : "Create sample report"}</Button>}{step === "review" && <Button className="w-full" size="lg" variant="outline" onClick={() => setStep("details")}>Edit details</Button>}<Button className="w-full" size="lg" variant="ghost" onClick={onClose}>Cancel</Button></div>
    </div>
  );
}
