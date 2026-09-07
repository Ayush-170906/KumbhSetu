// Live Demo — scripted 3-role walkthrough (final-day demo mode).
//
// This module holds ONLY declarative metadata and scripted copy for the
// automated demo. The deterministic state effects for each step live in the
// store (see `runDemoStep` in src/store/useAppStore.ts). Nothing here calls
// an LLM — the demo is fully deterministic. Sarvam stays genuinely live in
// the real /pilgrim, /field and /management apps, which this demo does not
// touch.

export type DemoPanel = "intro" | "pilgrim" | "volunteer" | "management" | "outro";

export interface DemoStepMeta {
  /** 1-based step number shown to the audience ("DEMO 03 / 20"). */
  n: number;
  /** Approximate wall-clock position in the ~5-minute story. */
  clock: string;
  /** Which panel this beat belongs to (drives the "active panel" glow). */
  panel: DemoPanel;
  /** Short headline shown in the control bar. */
  title: string;
  /** One line appended to the Scenario Timeline / Event feed. */
  narration: string;
  /** How long the orchestrator waits before auto-advancing to the next step. */
  durationMs: number;
}

// ---------------------------------------------------------------------------
// The story: "Kumbh Setu — From Ground Observation to Coordinated Response"
// ---------------------------------------------------------------------------

export const DEMO_STEPS: DemoStepMeta[] = [
  {
    n: 1,
    clock: "0:00",
    panel: "intro",
    title: "One connected response platform",
    narration: "Demo started — Pilgrim, Volunteer and Management on one screen.",
    durationMs: 7000,
  },
  {
    n: 2,
    clock: "0:20",
    panel: "pilgrim",
    title: "A pilgrim reports a missing child (Tamil)",
    narration: "Pilgrim (Tamil): “என் குழந்தையை காணவில்லை” — “My child is missing.”",
    durationMs: 9000,
  },
  {
    n: 3,
    clock: "0:35",
    panel: "pilgrim",
    title: "Kumbh Setu Assistant responds",
    narration: "Kumbh Setu Assistant gives lost-child guidance and stays with the pilgrim.",
    durationMs: 11000,
  },
  {
    n: 4,
    clock: "0:50",
    panel: "volunteer",
    title: "Volunteer bridges the language gap",
    narration: "Volunteer: “Help me talk to a Tamil-speaking pilgrim” — Setu translates the situation.",
    durationMs: 12000,
  },
  {
    n: 5,
    clock: "1:05",
    panel: "volunteer",
    title: "Setu AI structures the report",
    narration: "Setu AI proposes: FILE GROUND REPORT — human confirmation required.",
    durationMs: 12000,
  },
  {
    n: 6,
    clock: "1:20",
    panel: "volunteer",
    title: "Volunteer confirms — first report filed",
    narration: "Ground report filed and sent to the control room.",
    durationMs: 8000,
  },
  {
    n: 7,
    clock: "1:35",
    panel: "volunteer",
    title: "A second volunteer, an independent report",
    narration: "Second volunteer: “Lost boy about 6 near Ramkund — a child is crying by Gate 3.”",
    durationMs: 12000,
  },
  {
    n: 8,
    clock: "1:50",
    panel: "volunteer",
    title: "Second report filed",
    narration: "Second ground report filed — two independent reports now in the control room.",
    durationMs: 8000,
  },
  {
    n: 9,
    clock: "2:05",
    panel: "management",
    title: "Control room sees the field reports",
    narration: "Management: two independent field reports, same area, same description.",
    durationMs: 10000,
  },
  {
    n: 10,
    clock: "2:20",
    panel: "management",
    title: "Corroboration → emerging signal",
    narration: "Two reports corroborate — Kumbh Pulse raises an emerging signal.",
    durationMs: 11000,
  },
  {
    n: 11,
    clock: "2:35",
    panel: "management",
    title: "Kumbh Pulse — Ghat 4 at risk",
    narration: "Kumbh Pulse flags Ghat 4 as an at-risk zone.",
    durationMs: 9000,
  },
  {
    n: 12,
    clock: "2:45",
    panel: "management",
    title: "Why is this zone at risk?",
    narration: "Pulse explains the score: crowd activity, movement change, checkpoint reports, historical pattern.",
    durationMs: 14000,
  },
  {
    n: 13,
    clock: "3:00",
    panel: "management",
    title: "Signal promoted to an incident",
    narration: "Corroborated signal promoted — incident created: Lost Person, Critical, Ghat 4.",
    durationMs: 11000,
  },
  {
    n: 14,
    clock: "3:20",
    panel: "management",
    title: "Ops Copilot recommends a responder",
    narration: "Ops Copilot recommends V-233 and proposes: ASSIGN VOLUNTEER — human confirmation required.",
    durationMs: 15000,
  },
  {
    n: 15,
    clock: "3:45",
    panel: "management",
    title: "Management confirms the dispatch",
    narration: "Dispatch confirmed — V-233 assigned to the incident.",
    durationMs: 8000,
  },
  {
    n: 16,
    clock: "4:00",
    panel: "volunteer",
    title: "Volunteer accepts the task",
    narration: "V-233 receives a CRITICAL task and accepts — en route.",
    durationMs: 9000,
  },
  {
    n: 17,
    clock: "4:15",
    panel: "volunteer",
    title: "Volunteer arrives on site",
    narration: "V-233 arrives on site at Ghat 4.",
    durationMs: 9000,
  },
  {
    n: 18,
    clock: "4:30",
    panel: "volunteer",
    title: "Incident resolved",
    narration: "Child reunited with the family — incident resolved.",
    durationMs: 9000,
  },
  {
    n: 19,
    clock: "4:40",
    panel: "management",
    title: "Event Log — the whole chain",
    narration: "Event Log shows the full audited chain, actor and time on every step.",
    durationMs: 12000,
  },
  {
    n: 20,
    clock: "4:55",
    panel: "outro",
    title: "One incident. Three roles. One loop.",
    narration: "Observe → Corroborate → Signal → Decide → Resolve → Audit.",
    durationMs: 12000,
  },
];

export const DEMO_TOTAL = DEMO_STEPS.length;

/** Returns the meta for a 1-based step number, clamped. */
export function demoStep(n: number): DemoStepMeta {
  return DEMO_STEPS[Math.max(0, Math.min(DEMO_STEPS.length - 1, n - 1))];
}

// ---------------------------------------------------------------------------
// The closed-loop stages shown on the intro and outro cards.
// ---------------------------------------------------------------------------

export const RESPONSE_LOOP: { key: string; label: string; blurb: string }[] = [
  { key: "observe", label: "Observe", blurb: "A pilgrim or volunteer reports something on the ground." },
  { key: "corroborate", label: "Corroborate", blurb: "Independent reports are cross-checked, not taken at face value." },
  { key: "signal", label: "Signal", blurb: "Kumbh Pulse raises one explainable signal worth a human's attention." },
  { key: "decide", label: "Decide", blurb: "The control room promotes it to an incident and chooses a responder." },
  { key: "resolve", label: "Resolve", blurb: "A volunteer accepts, arrives and closes the loop on the ground." },
  { key: "audit", label: "Audit", blurb: "Every step is logged with actor and time in the Event Log." },
];

/** Which loop stage each step lights up (index into RESPONSE_LOOP), or -1. */
export function loopStageForStep(n: number): number {
  if (n <= 1) return -1;
  if (n <= 8) return 0; // observe
  if (n <= 10) return 1; // corroborate
  if (n <= 12) return 2; // signal
  if (n <= 15) return 3; // decide
  if (n <= 18) return 4; // resolve
  if (n <= 19) return 5; // audit
  return -1;
}

// ---------------------------------------------------------------------------
// Scripted copy (deterministic — never generated at runtime).
// ---------------------------------------------------------------------------

export const PILGRIM_TAMIL = "என் குழந்தையை காணவில்லை";
export const PILGRIM_TAMIL_GLOSS = "My child is missing.";

export const SETU_PILGRIM_REPLY =
  "I'm here with you. Stay exactly where you are so your child can find you — the nearest Help Desk is Ghat 4 Control, just behind you.\n\n" +
  "Tell me: how old is your child, and what are they wearing? A volunteer near you is being alerted now, and a lost-child report is being prepared for the control room.";

export const SETU_PILGRIM_INTENT = "Lost person · child";

export const VOL_TRANSLATE_REQUEST = "Help me talk to a Tamil-speaking pilgrim";
export const VOL_TRANSLATED_SITUATION =
  "Pilgrim (Tamil → English): “My 6-year-old son is missing. He was near the Ramkund steps about ten minutes ago. He is wearing a red shirt.”";
export const VOL_TRANSLATE_META = "Tamil → English · phrasebook · 96%";

export const VOL_LOG_COMMAND =
  "Log this as a lost child report: 6-year-old boy in a red shirt, missing near Ramkund.";
export const VOL_REPORT_SUMMARY = "Lost child — 6-year-old boy, red shirt, last seen near Ramkund steps (Ghat 4).";

export const VOL2_NAME = "R. Kamble · V-241";
export const VOL2_REPORT =
  "I also have a report — a lost boy about 6 near Ramkund. Someone found a child crying by Gate 3.";
export const VOL2_REPORT_SUMMARY =
  "Lost child — boy ~6 near Ramkund; a crying child seen unattended near Gate 3 (Ghat 4).";

export const SETU_PROVENANCE = "Powered by Sarvam · Grounded in Kumbh Setu data";
export const SETU_DEMO_NOTE = "Scripted demo narration — deterministic, not a live generation";

export const OPS_PROMPT =
  "Recommend a responder for this incident. The family only speaks Tamil.";
export const OPS_REASONING: string[] = [
  "Incident is a lost child at Ghat 4, marked Critical — needs a responder already inside the zone.",
  "V-233 (K. Bhosale) is available, ~120 m from the Ramkund steps, crowd-marshal trained — shortest ETA.",
  "Family speaks Tamil only; V-233 speaks Hindi — pair with a Tamil phrasebook / Setu translation on arrival.",
  "V-218 is closer to the medical camp and better held back for medical calls.",
];
export const OPS_RECOMMENDATION = "Recommend: dispatch V-233, with Setu translation bridged for the family.";
export const OPS_DISPATCH_CMD = "Dispatch V-233 to this incident.";

export const OUTRO_LINES = [
  "One incident. Three roles. One connected response loop.",
  "Setu AI helps people understand and act.",
  "Kumbh Pulse helps the control room understand what is happening.",
];
export const OUTRO_WORDMARK = "KUMBH SETU";
export const OUTRO_TAGLINE = "Connected response infrastructure for mass gatherings.";

export const SYNTHETIC_DATA_LABEL = "Data: Synthetic / Simulation";
