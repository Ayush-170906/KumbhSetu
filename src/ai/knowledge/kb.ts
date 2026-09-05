// Verified Kumbh knowledge base + transparent retrieval (§23/§46).
//
// These entries are the "verified knowledge" Setu is allowed to state as fact.
// They are synthetic reference content written for this prototype — clearly a
// demo knowledge set, not an official NTKMA document. Retrieval is keyword +
// field-weighted scoring (a real build would swap in embeddings + a vector
// store behind `retrieve()` with the same return shape).

import type { SetuIntent } from "@/ai/intents";

export interface KBEntry {
  id: string;
  title: string;
  body: string;
  /** Where a real deployment would cite this from. */
  source: string;
  tags: string[];
  intents: SetuIntent[];
}

export const KB: KBEntry[] = [
  {
    id: "kb-medical-escalation",
    title: "Medical escalation — when to call the response team",
    body: "Call the medical response team immediately for: unconsciousness, chest pain, difficulty breathing, heavy bleeding, seizure, suspected stroke (face droop / arm weakness / slurred speech), or heat stroke (hot dry skin, confusion). Do not move a collapsed person unless they are in immediate danger. Stay with them, keep the airway clear, note the time. For non-urgent cases (minor cuts, mild dehydration, blisters) escort or direct the person to the nearest medical camp.",
    source: "Kumbh Setu volunteer SOP — Medical (demo knowledge base)",
    tags: ["medical", "escalation", "first aid", "emergency", "unconscious", "breathing"],
    intents: ["medical", "emergency"],
  },
  {
    id: "kb-medical-heat",
    title: "Heat exhaustion and heat stroke",
    body: "Heat exhaustion: heavy sweating, weakness, cool clammy skin, nausea. Move the person to shade, loosen clothing, give sips of water, fan them. Heat stroke is an emergency: body very hot, skin may be dry, confusion or fainting — cool aggressively (wet cloths, fanning) and call the medical response team now. Peak risk is 11:00–16:00 near open ghats.",
    source: "Kumbh Setu volunteer SOP — Medical (demo knowledge base)",
    tags: ["medical", "heat", "dehydration", "water", "fainting"],
    intents: ["medical"],
  },
  {
    id: "kb-lost-child",
    title: "Lost child / missing person — first actions",
    body: "1) Keep the child with you and stay where you are first, then move to the nearest Help Desk. 2) Do not hand the child to anyone claiming to be a relative without Help Desk verification. 3) Note age, clothing colour, last-seen location and time. 4) Open a missing-person case (Setu can do this) with a photo only if the child is safe and it is appropriate. 5) Reassure the child; give water. Reunification is coordinated by the control room against found-person reports.",
    source: "Kumbh Setu volunteer SOP — Lost & Found (demo knowledge base)",
    tags: ["lost", "missing", "child", "reunification", "help desk"],
    intents: ["lost_person"],
  },
  {
    id: "kb-crowd-pressure",
    title: "Reading and reporting crowd pressure",
    body: "Warning signs: movement slows to a shuffle, you cannot raise your arms, involuntary swaying, shockwaves through the crowd. Do NOT push against flow. Report the location and direction of pressure immediately — control room can hold inflow upstream and open release routes. Encourage diagonal movement toward edges. Never announce 'do not panic' over a PA; give a specific instruction instead ('move left toward the blue gate').",
    source: "Kumbh Setu volunteer SOP — Crowd Safety (demo knowledge base)",
    tags: ["crowd", "pressure", "surge", "stampede", "density", "safety"],
    intents: ["crowd", "safety", "emergency"],
  },
  {
    id: "kb-water-points",
    title: "Drinking water points and shortages",
    body: "Every zone has at least one water point; temple-perimeter and transit zones have piaus along the main route. If a water point is dry or a tanker has not arrived, log a ground report with an estimate of people waiting — this feeds the resource team and Kumbh Pulse. Direct waiting pilgrims to the next nearest point rather than letting a queue build.",
    source: "Kumbh Setu facility guide — Water (demo knowledge base)",
    tags: ["water", "tanker", "shortage", "piau", "hydration"],
    intents: ["water", "ground_report", "resource"],
  },
  {
    id: "kb-sanitation",
    title: "Sanitation blocks",
    body: "Sanitation blocks are marked on the map in every zone. Report overflow, blocked drains or no-water conditions as a ground report with a photo where possible — sanitation crews are dispatched on report volume and severity. For accessibility, the Help Desk in each zone can direct people to the nearest accessible unit.",
    source: "Kumbh Setu facility guide — Sanitation (demo knowledge base)",
    tags: ["toilet", "sanitation", "overflow", "hygiene", "accessibility"],
    intents: ["toilet", "ground_report"],
  },
  {
    id: "kb-accessibility",
    title: "Assisting elderly and divyang pilgrims",
    body: "Wheelchairs and mobility support are staged at Help Desks and major medical camps. For a pilgrim who cannot walk the distance, request a wheelchair via the zone Help Desk or raise a task. Priority lanes for elderly and divyang pilgrims run at the main ghats — Help Desk staff can escort. Never leave a mobility-limited pilgrim alone in a dense area.",
    source: "Kumbh Setu volunteer SOP — Accessibility (demo knowledge base)",
    tags: ["accessibility", "wheelchair", "elderly", "divyang", "mobility", "escort"],
    intents: ["accessibility", "medical"],
  },
  {
    id: "kb-ghat-timings",
    title: "Bathing (snan) windows and ghat flow",
    body: "Main snan windows draw the heaviest crowds in the two hours around the muhurat; expect inflow to the ghats to peak beforehand and outflow to peak after. Between windows, ghat approaches run at moderate density. Guidance to pilgrims should route them to a less-crowded ghat when their nearest one is red, and avoid creating a new crowd by over-directing everyone to a single alternative.",
    source: "Kumbh Setu event information (demo knowledge base)",
    tags: ["snan", "aarti", "ghat", "timing", "muhurat", "darshan", "religious"],
    intents: ["religious_information", "navigation", "crowd"],
  },
  {
    id: "kb-transport",
    title: "Transport and parking",
    body: "Shuttle pickup points connect the Nashik ghats and the Trimbakeshwar cluster along the transit corridor. Parking zones are on the outer edge of each cluster; private vehicles are not allowed on ghat approaches during snan windows. Direct drivers to the signed parking zone for their cluster and to the shuttle for the last stretch.",
    source: "Kumbh Setu event information (demo knowledge base)",
    tags: ["transport", "shuttle", "parking", "bus", "corridor"],
    intents: ["transport", "navigation"],
  },
  {
    id: "kb-ground-report-quality",
    title: "What makes a good ground report",
    body: "A useful report has: a clear category (water, sanitation, medical, crowd, infrastructure, safety), the location (Setu attaches your GPS), a severity, and an estimate of people affected. A photo raises its weight. Reports start UNVERIFIED; when several volunteers report the same thing it becomes CORROBORATED and Kumbh Pulse may raise an emerging signal for the control room. Only the control room marks something VERIFIED.",
    source: "Kumbh Setu volunteer SOP — Ground Reporting (demo knowledge base)",
    tags: ["report", "ground truth", "verification", "evidence", "signal", "pulse"],
    intents: ["ground_report", "information"],
  },
  {
    id: "kb-radio-protocol",
    title: "Escalation and radio protocol",
    body: "Escalate to the control room when: a situation exceeds your training, a task needs more responders, or an incident is not resolving. Use Setu's Escalate action on an active task, or raise a new incident. Give location first, then nature, then what you need. Keep the channel short during a live incident.",
    source: "Kumbh Setu volunteer SOP — Communications (demo knowledge base)",
    tags: ["escalate", "radio", "control room", "protocol", "incident"],
    intents: ["volunteer_task", "safety", "information"],
  },
  {
    id: "kb-simulation-note",
    title: "About this environment",
    body: "This is a demonstration environment. Zones, facilities, volunteers, incidents, risk scores and this knowledge base are synthetic. Setu will tell you when it does not have verified information rather than guessing. Nothing here is live Nashik–Trimbakeshwar operational data.",
    source: "Kumbh Setu prototype",
    tags: ["simulation", "demo", "synthetic", "about"],
    intents: ["information", "other"],
  },
];

export interface Retrieval {
  id: string;
  title: string;
  body: string;
  source: string;
  score: number;
}

const STOP = new Set([
  "the", "a", "an", "is", "are", "to", "of", "in", "on", "at", "for", "and", "or",
  "i", "me", "my", "you", "your", "it", "this", "that", "with", "what", "where",
  "how", "do", "does", "can", "should", "near", "nearest", "please", "setu",
]);

function tokens(s: string): string[] {
  return (s.toLowerCase().match(/[a-z]{3,}/g) ?? []).filter((w) => !STOP.has(w));
}

/**
 * Retrieve the most relevant KB passages for a query. Scores on tag hits
 * (weighted), title hits, body hits, and an intent-match bonus. Returns at
 * most `k`, and only entries that clear a floor — so "no verified info" is a
 * real possible outcome (§23).
 */
export function retrieve(query: string, intent: SetuIntent, k = 3): Retrieval[] {
  const q = tokens(query);
  if (q.length === 0 && intent === "other") return [];

  const scored = KB.map((e) => {
    let score = 0;
    const tagText = e.tags.join(" ");
    const titleTok = new Set(tokens(e.title));
    const bodyTok = new Set(tokens(e.body));

    for (const w of q) {
      if (e.tags.includes(w)) score += 5;
      else if (tagText.includes(w)) score += 3;
      if (titleTok.has(w)) score += 3;
      if (bodyTok.has(w)) score += 1;
    }
    if (e.intents.includes(intent)) score += 4;

    return { entry: e, score };
  });

  // Floor is above the intent-match bonus alone (4), so a passage needs real
  // keyword overlap to be retrieved — "no verified info" stays a real outcome.
  return scored
    .filter((s) => s.score >= 7)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((s) => ({
      id: s.entry.id,
      title: s.entry.title,
      body: s.entry.body,
      source: s.entry.source,
      score: s.score,
    }));
}
