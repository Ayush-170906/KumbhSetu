"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import { isAgeEligible, MIN_VOLUNTEER_AGE } from "@/lib/volunteerOps";
import { VOLUNTEER_SKILL_OPTIONS, type VolunteerRegistrationInput } from "@/lib/volunteerTypes";
import type { LanguageCode, VolunteerCategory, VolunteerGender } from "@/lib/types";
import { Field, inputClass, VmsBanner } from "./vmsUi";

const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: "mr", label: "Marathi (मराठी)" },
  { code: "hi", label: "Hindi (हिन्दी)" },
  { code: "en", label: "English" },
  { code: "ta", label: "Tamil (தமிழ்)" },
];

const CATEGORIES: { id: VolunteerCategory; label: string; desc: string }[] = [
  { id: "crowd_management", label: "Crowd Management", desc: "Ghat access, queue discipline, sector barriers" },
  { id: "medical_support", label: "First Aid & Medical Support", desc: "Assisting paramedical posts and patient transit" },
  { id: "help_desk", label: "Information & Language Desk", desc: "May I Help You counters, pilgrim translation" },
  { id: "logistics", label: "Sanitation & Logistics", desc: "Drinking water points, sanitation spot checks, supplies" },
  { id: "lost_found", label: "Missing-Person Help", desc: "Reunification booths, PA announcements, child tagging" },
  { id: "general", label: "General Seva & Escort", desc: "General pilgrim guidance and queue assistance" },
];

const STEPS = [
  { title: "Personal", desc: "Demographics & identity" },
  { title: "Contact & NGO", desc: "Location & association" },
  { title: "Skills & Role", desc: "Capabilities & experience" },
  { title: "Availability", desc: "Shifts & preferred zone" },
  { title: "Review & Consent", desc: "Verification policy & submit" },
];

export function VmsRegister({
  onDone,
  onCancel,
}: {
  onDone: (id: string) => void;
  onCancel: () => void;
}) {
  const store = useAppStore();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<VolunteerRegistrationInput>({
    name: "",
    yearOfBirth: "2000",
    gender: "undisclosed",
    preferredLanguage: "mr",
    phone: "",
    email: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    addressLine: "",
    state: "Maharashtra",
    district: "Nashik",
    ngoId: store.ngos[0]?.id || "",
    category: "crowd_management",
    skills: ["crowd_marshal"],
    languages: ["mr", "hi"],
    experience: "",
    availabilityWindow: "full_time",
    preferredArea: "Ramkund Ghat",
    zoneId: store.zones[0]?.id || "z01",
    shiftStart: "06:00",
    shiftEnd: "14:00",
    kind: "general",
    hasAccessibilityNeed: false,
    accommodationsNote: "",
    identityConsent: true,
    enrolledBy: "management",
  });

  function toggleSkill(skillId: string) {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skillId)
        ? prev.skills.filter((s) => s !== skillId)
        : [...prev.skills, skillId],
    }));
  }

  function toggleLanguage(lang: LanguageCode) {
    setForm((prev) => {
      const exists = prev.languages.includes(lang);
      const next = exists ? prev.languages.filter((l) => l !== lang) : [...prev.languages, lang];
      return {
        ...prev,
        languages: next.length ? next : [lang],
        preferredLanguage: next.includes(prev.preferredLanguage) ? prev.preferredLanguage : next[0],
      };
    });
  }

  function validateStep(idx: number): boolean {
    setError(null);
    if (idx === 0) {
      if (!form.name.trim() || form.name.trim().length < 2) {
        setError("Please enter the volunteer's full name (at least 2 characters).");
        return false;
      }
      if (form.yearOfBirth && !isAgeEligible(form.yearOfBirth)) {
        setError(`Volunteer must be at least ${MIN_VOLUNTEER_AGE} years of age as per Kumbh guidelines.`);
        return false;
      }
    }
    if (idx === 1) {
      if (form.phone && form.phone.replace(/\D/g, "").length !== 10) {
        setError("Please enter a valid 10-digit mobile number, or leave blank.");
        return false;
      }
    }
    if (idx === 2) {
      if (form.skills.length === 0) {
        setError("Please select at least one primary skill.");
        return false;
      }
    }
    if (idx === 4) {
      if (!form.identityConsent) {
        setError("Identity consent is mandatory to initiate verification and roster deployment.");
        return false;
      }
    }
    return true;
  }

  function handleNext() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  function handleBack() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  function handleSubmit() {
    if (!validateStep(4)) return;
    const res = store.registerVolunteerProfile(form);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    onDone(res.id);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">Intake Workflow</p>
          <h1 className="font-editorial text-2xl text-ink">Volunteer Registration</h1>
          <p className="text-xs text-ink-muted">Onboard ground personnel with skill, language and demographic eligibility checks.</p>
        </div>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <VmsBanner />

      {/* Stepper Header */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {STEPS.map((s, idx) => (
          <div
            key={s.title}
            onClick={() => idx < step && setStep(idx)}
            className={`cursor-pointer border-t-2 pt-2 transition-colors ${
              idx === step
                ? "border-primary text-primary"
                : idx < step
                ? "border-status-green text-status-green"
                : "border-border text-ink-soft"
            }`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider">Step {idx + 1}</div>
            <div className="text-xs font-semibold text-ink">{s.title}</div>
            <div className="hidden text-[10px] text-ink-soft sm:block">{s.desc}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-sm border border-status-red-border bg-status-red-bg p-3 text-xs text-status-red">
          <Icon name="warning" className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Content */}
      <div className="border border-border bg-surface p-5 shadow-card sm:p-6">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-ink">Personal Information & Eligibility</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name *" hint="Official name as per Government photo ID">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Rajesh Narayan Patil"
                  className={inputClass}
                />
              </Field>
              <Field label="Year of Birth *" hint={`Minimum age requirement: ${MIN_VOLUNTEER_AGE} years`}>
                <input
                  type="number"
                  min="1940"
                  max="2009"
                  value={form.yearOfBirth || ""}
                  onChange={(e) => setForm({ ...form, yearOfBirth: e.target.value })}
                  placeholder="e.g., 1998"
                  className={inputClass}
                />
              </Field>
              <Field label="Gender">
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value as VolunteerGender })}
                  className={inputClass}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="undisclosed">Prefer not to say</option>
                </select>
              </Field>
              <Field label="Primary Preferred Language">
                <select
                  value={form.preferredLanguage}
                  onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value as LanguageCode })}
                  className={inputClass}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-ink">Contact Details & NGO Affiliation</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mobile Number" hint="10-digit number for SMS roster & field broadcasts">
                <input
                  type="tel"
                  maxLength={10}
                  value={form.phone || ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                  placeholder="98XXXXXXXX"
                  className={inputClass}
                />
              </Field>
              <Field label="Email Address" hint="For training materials and certification">
                <input
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="volunteer@example.com"
                  className={inputClass}
                />
              </Field>
              <Field label="Associated NGO / Organization" hint="Select the sponsoring accredited NGO">
                <select
                  value={form.ngoId || ""}
                  onChange={(e) => setForm({ ...form, ngoId: e.target.value || undefined })}
                  className={inputClass}
                >
                  <option value="">Direct Individual Volunteer (No NGO)</option>
                  {store.ngos.map((ngo) => (
                    <option key={ngo.id} value={ngo.id}>
                      {ngo.name} ({ngo.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Emergency Contact Name">
                <input
                  type="text"
                  value={form.emergencyContactName || ""}
                  onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
                  placeholder="e.g., Sunita Patil (Spouse / Parent)"
                  className={inputClass}
                />
              </Field>
              <Field label="Emergency Contact Phone">
                <input
                  type="tel"
                  maxLength={10}
                  value={form.emergencyContactPhone || ""}
                  onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value.replace(/\D/g, "") })}
                  placeholder="98XXXXXXXX"
                  className={inputClass}
                />
              </Field>
              <Field label="Address / Hometown">
                <input
                  type="text"
                  value={form.addressLine || ""}
                  onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                  placeholder="Panchavati, Nashik"
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-ink">Skills, Languages & Volunteer Category</h2>
            <Field label="Operational Duty Category">
              <div className="grid gap-2 sm:grid-cols-2">
                {CATEGORIES.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => setForm({ ...form, category: cat.id })}
                    className={`cursor-pointer border p-3 transition-colors ${
                      form.category === cat.id
                        ? "border-primary bg-primary-soft/30 text-ink"
                        : "border-border bg-surface text-ink-muted hover:bg-surface-muted"
                    }`}
                  >
                    <div className="text-xs font-semibold">{cat.label}</div>
                    <div className="text-[11px] text-ink-soft">{cat.desc}</div>
                  </div>
                ))}
              </div>
            </Field>

            <div>
              <span className="text-xs text-ink-muted">Certified / Practical Skills (Select all that apply)</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {VOLUNTEER_SKILL_OPTIONS.map((sk) => {
                  const active = form.skills.includes(sk.id);
                  return (
                    <button
                      key={sk.id}
                      type="button"
                      onClick={() => toggleSkill(sk.id)}
                      className={`rounded-sm border px-3 py-1.5 text-xs transition-colors ${
                        active
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-surface text-ink-muted hover:bg-surface-muted"
                      }`}
                    >
                      {active ? "✓ " : "+ "}
                      {sk.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="text-xs text-ink-muted">Spoken Languages for Pilgrim Assistance</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {LANGUAGES.map((l) => {
                  const active = form.languages.includes(l.code);
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => toggleLanguage(l.code)}
                      className={`rounded-sm border px-3 py-1.5 text-xs transition-colors ${
                        active
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-surface text-ink-muted hover:bg-surface-muted"
                      }`}
                    >
                      {l.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label="Prior Kumbh or Mass Gathering Experience" hint="Optional past deployments or certifications">
              <input
                type="text"
                value={form.experience || ""}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
                placeholder="e.g., Haridwar 2021 Seva, Red Cross volunteer 3 yrs"
                className={inputClass}
              />
            </Field>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs text-ink">
                <input
                  type="checkbox"
                  checked={form.hasAccessibilityNeed}
                  onChange={(e) => setForm({ ...form, hasAccessibilityNeed: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
                <span>Volunteer requires physical accessibility considerations or low-mobility post</span>
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-ink">Availability & Zone Preferences</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Availability Window">
                <select
                  value={form.availabilityWindow}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      availabilityWindow: e.target.value as VolunteerRegistrationInput["availabilityWindow"],
                    })
                  }
                  className={inputClass}
                >
                  <option value="full_time">Full Event (All Days)</option>
                  <option value="weekends">Weekends & Shahi Snan Peak Days Only</option>
                  <option value="weekdays">Weekdays Only</option>
                  <option value="custom">Custom Rotation</option>
                </select>
              </Field>

              <Field label="Preferred Geographic Zone">
                <select
                  value={form.zoneId}
                  onChange={(e) => setForm({ ...form, zoneId: e.target.value })}
                  className={inputClass}
                >
                  {store.zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} ({z.shortName})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Preferred Landmark / Ghat Area">
                <input
                  type="text"
                  value={form.preferredArea || ""}
                  onChange={(e) => setForm({ ...form, preferredArea: e.target.value })}
                  placeholder="e.g., Ramkund, Trimbak Temple Ring, Sadhugram"
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Preferred Shift Start">
                  <input
                    type="time"
                    value={form.shiftStart}
                    onChange={(e) => setForm({ ...form, shiftStart: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Shift End">
                  <input
                    type="time"
                    value={form.shiftEnd}
                    onChange={(e) => setForm({ ...form, shiftEnd: e.target.value })}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-sm font-semibold text-ink">Review & Verification Consent</h2>

            <div className="grid gap-4 rounded-sm border border-border bg-surface-muted/50 p-4 text-xs sm:grid-cols-2">
              <div>
                <span className="font-semibold text-ink-soft">Full Name:</span> <span className="font-medium text-ink">{form.name}</span>
              </div>
              <div>
                <span className="font-semibold text-ink-soft">Age / Birth:</span>{" "}
                <span className="font-medium text-ink">{form.yearOfBirth || "N/A"}</span>
              </div>
              <div>
                <span className="font-semibold text-ink-soft">Contact:</span>{" "}
                <span className="font-medium text-ink">{form.phone || "No phone"} | {form.email || "No email"}</span>
              </div>
              <div>
                <span className="font-semibold text-ink-soft">NGO:</span>{" "}
                <span className="font-medium text-ink">
                  {store.ngos.find((n) => n.id === form.ngoId)?.name || "Individual"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-ink-soft">Category:</span>{" "}
                <span className="font-medium text-ink">{form.category.replace("_", " ").toUpperCase()}</span>
              </div>
              <div>
                <span className="font-semibold text-ink-soft">Skills:</span>{" "}
                <span className="font-medium text-ink">{form.skills.join(", ")}</span>
              </div>
              <div>
                <span className="font-semibold text-ink-soft">Languages:</span>{" "}
                <span className="font-medium text-ink">{form.languages.join(", ").toUpperCase()}</span>
              </div>
              <div>
                <span className="font-semibold text-ink-soft">Zone:</span>{" "}
                <span className="font-medium text-ink">{store.zones.find((z) => z.id === form.zoneId)?.name}</span>
              </div>
            </div>

            <div className="rounded-sm border border-border bg-surface p-4 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.identityConsent}
                  onChange={(e) => setForm({ ...form, identityConsent: e.target.checked })}
                  className="mt-0.5 rounded text-primary focus:ring-primary"
                />
                <div className="text-xs text-ink leading-relaxed">
                  <span className="font-semibold text-ink">Volunteer Consent & Verification Authorization:</span>
                  <p className="mt-1 text-ink-muted">
                    I confirm that the demographic details provided are accurate and that the candidate has consented to physical document review and identity verification by the Kumbh Mela Administration. No Aadhaar numbers or biometrics will be stored insecurely.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Form Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={step === 0 ? onCancel : handleBack}
          >
            {step === 0 ? "Cancel" : "Back"}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button type="button" variant="primary" size="sm" onClick={handleNext}>
              Next: {STEPS[step + 1].title}
            </Button>
          ) : (
            <Button type="button" variant="primary" size="sm" onClick={handleSubmit}>
              Submit & Issue Volunteer ID
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
