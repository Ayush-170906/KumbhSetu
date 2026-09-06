"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { login } from "@/lib/auth";
import { LANGUAGE_LABELS } from "@/lib/i18n";
import type { LanguageCode, VolunteerKind, AvailabilitySlot } from "@/lib/types";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SimTag } from "@/components/ui/SimTag";

const SKILLS = [
  { id: "first_aid", label: "First aid" },
  { id: "crowd_marshal", label: "Crowd marshalling" },
  { id: "medical_escort", label: "Medical escort" },
  { id: "logistics", label: "Logistics" },
  { id: "translation", label: "Translation help" },
];
const LANGS: LanguageCode[] = ["en", "hi", "mr", "ta"];

function mkSlot(): AvailabilitySlot {
  return { id: `s${Date.now()}${Math.random().toString(36).slice(2, 5)}`, date: "", start: "09:00", end: "13:00" };
}

function EnrollInner() {
  const router = useRouter();
  const zones = useAppStore((s) => s.zones);
  const enrollVolunteer = useAppStore((s) => s.enrollVolunteer);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "z01");
  const [kind, setKind] = useState<VolunteerKind>("general");
  const [langs, setLangs] = useState<LanguageCode[]>(["mr"]);
  const [skills, setSkills] = useState<string[]>(["first_aid"]);
  const [shiftStart, setShiftStart] = useState("10:00");
  const [shiftEnd, setShiftEnd] = useState("18:00");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([mkSlot()]);
  const [done, setDone] = useState<{ id: string } | null>(null);

  const toggle = <T,>(arr: T[], v: T, set: (a: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const valid =
    name.trim().length >= 2 &&
    (kind === "general" || slots.some((s) => s.date));

  function submit() {
    const v = enrollVolunteer({
      name,
      phone,
      zoneId,
      kind,
      skills,
      languages: langs,
      slots: kind === "professional" ? slots.filter((s) => s.date) : undefined,
      shiftStart: kind === "general" ? shiftStart : undefined,
      shiftEnd: kind === "general" ? shiftEnd : undefined,
      enrolledBy: "self",
    });
    setDone({ id: v.id });
  }

  if (done) {
    return (
      <Shell>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <div className="h-14 w-14 rounded-full bg-status-green-bg flex items-center justify-center mb-4">
            <Icon name="check" className="h-6 w-6 text-status-green" />
          </div>
          <h1 className="text-lg font-semibold text-ink">You&rsquo;re enrolled</h1>
          <p className="font-mono-num text-sm text-ink-muted mt-1">{done.id}</p>
          <p className="text-xs text-ink-muted mt-3 max-w-xs">
            Your details are now with the control room. On shift, open the field app and pick your ID from the
            switcher.
          </p>
          <Button
            className="mt-6"
            onClick={() => {
              login("volunteer", "kumbh2027");
              router.replace("/field");
            }}
          >
            Open the field app
          </Button>
          <Link href="/" className="text-xs text-ink-soft hover:text-ink mt-3">
            Back to home
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex-1 overflow-y-auto scroll-thin p-4 space-y-4 pb-8">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-base font-semibold text-ink">Enroll as a volunteer</h1>
            <p className="text-xs text-ink-muted mt-0.5">Add your details and when you can serve. The control room sees this on the roster.</p>
          </div>
          <SimTag label="DEMO" />
        </div>

        <Field label="Full name">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. R. Kulkarni"
            className="w-full text-sm rounded-sm border border-border bg-surface px-3 py-2 focus:outline-none focus:border-primary" />
        </Field>
        <Field label="Phone (optional)">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="10-digit mobile"
            className="w-full text-sm rounded-sm border border-border bg-surface px-3 py-2 focus:outline-none focus:border-primary" />
        </Field>
        <Field label="Preferred zone">
          <select value={zoneId} onChange={(e) => setZoneId(e.target.value)}
            className="w-full text-sm rounded-sm border border-border bg-surface px-3 py-2 focus:outline-none focus:border-primary">
            {zones.map((z) => <option key={z.id} value={z.id}>{z.shortName} — {z.name}</option>)}
          </select>
        </Field>

        <Field label="Volunteer type">
          <div className="flex rounded-sm border border-border overflow-hidden">
            {([["general", "General"], ["professional", "Working professional"]] as const).map(([id, lbl]) => (
              <button key={id} onClick={() => setKind(id)}
                className={`flex-1 text-xs py-2 font-medium transition-colors ${kind === id ? "bg-primary text-white" : "bg-surface text-ink-muted"}`}>
                {lbl}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-ink-soft mt-1">
            {kind === "general"
              ? "A standing shift — set your usual hours below."
              : "You pick specific dates and time windows you can commit to."}
          </p>
        </Field>

        {kind === "general" ? (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Shift start"><input type="time" value={shiftStart} onChange={(e) => setShiftStart(e.target.value)}
              className="w-full text-sm rounded-sm border border-border bg-surface px-2 py-1.5 focus:outline-none focus:border-primary" /></Field>
            <Field label="Shift end"><input type="time" value={shiftEnd} onChange={(e) => setShiftEnd(e.target.value)}
              className="w-full text-sm rounded-sm border border-border bg-surface px-2 py-1.5 focus:outline-none focus:border-primary" /></Field>
          </div>
        ) : (
          <Field label="Your available slots">
            <div className="space-y-2">
              {slots.map((s) => (
                <div key={s.id} className="flex items-center gap-1.5">
                  <input type="date" value={s.date}
                    onChange={(e) => setSlots(slots.map((x) => x.id === s.id ? { ...x, date: e.target.value } : x))}
                    className="flex-1 min-w-0 text-xs rounded-sm border border-border bg-surface px-2 py-1.5 focus:outline-none focus:border-primary" />
                  <input type="time" value={s.start}
                    onChange={(e) => setSlots(slots.map((x) => x.id === s.id ? { ...x, start: e.target.value } : x))}
                    className="w-[72px] text-xs rounded-sm border border-border bg-surface px-1.5 py-1.5 focus:outline-none focus:border-primary" />
                  <span className="text-ink-soft text-xs">–</span>
                  <input type="time" value={s.end}
                    onChange={(e) => setSlots(slots.map((x) => x.id === s.id ? { ...x, end: e.target.value } : x))}
                    className="w-[72px] text-xs rounded-sm border border-border bg-surface px-1.5 py-1.5 focus:outline-none focus:border-primary" />
                  {slots.length > 1 && (
                    <button onClick={() => setSlots(slots.filter((x) => x.id !== s.id))} className="text-ink-soft hover:text-status-red p-1">
                      <Icon name="close" className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => setSlots([...slots, mkSlot()])} className="text-xs text-primary hover:text-primary-dark">
                + Add another slot
              </button>
            </div>
          </Field>
        )}

        <Field label="Languages you can help in">
          <div className="flex flex-wrap gap-1.5">
            {LANGS.map((l) => (
              <button key={l} onClick={() => toggle(langs, l, setLangs)}
                className={`text-xs rounded-sm border px-2.5 py-1 transition-colors ${langs.includes(l) ? "border-primary bg-primary-soft text-primary-soft-ink" : "border-border bg-surface text-ink-muted"}`}>
                {LANGUAGE_LABELS[l]}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Skills">
          <div className="flex flex-wrap gap-1.5">
            {SKILLS.map((s) => (
              <button key={s.id} onClick={() => toggle(skills, s.id, setSkills)}
                className={`text-xs rounded-sm border px-2.5 py-1 transition-colors ${skills.includes(s.id) ? "border-primary bg-primary-soft text-primary-soft-ink" : "border-border bg-surface text-ink-muted"}`}>
                {s.label}
              </button>
            ))}
          </div>
        </Field>

        <Button className="w-full" size="lg" disabled={!valid} onClick={submit}>
          Enroll
        </Button>
      </div>
    </Shell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-ink-muted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-ivory flex flex-col border-x border-border">
        <header className="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-border bg-surface sticky top-0 z-20">
          <Link href="/login" className="p-1 -ml-1 text-ink-muted" aria-label="Back">
            <Icon name="chevron-right" className="h-5 w-5 rotate-180" />
          </Link>
          <div className="text-sm font-semibold text-ink">Volunteer enrollment</div>
        </header>
        {children}
      </div>
    </div>
  );
}

export default function EnrollPage() {
  return (
    <ClientOnly fallback={<div className="min-h-screen flex items-center justify-center bg-ivory text-ink-muted text-sm">Loading…</div>}>
      <EnrollInner />
    </ClientOnly>
  );
}
