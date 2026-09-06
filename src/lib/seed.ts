import type {
  Zone,
  Facility,
  Volunteer,
  RiskSnapshot,
  Resource,
  Incident,
  AuditEvent,
  Advisory,
  FoundReport,
  PilgrimFeedback,
} from "./types";

// ---------------------------------------------------------------------------
// SIMULATION DATA
// Everything in this file is synthetic seed data for the Kumbh Setu prototype.
// It approximates the general geography of a Kumbh Mela site (ghats, temple
// perimeter, transit corridor) but does NOT represent real Nashik–
// Trimbakeshwar operational data, real crowd counts, or real facility
// locations. Coordinates are in an abstract 1000x600 map space, not GPS.
// ---------------------------------------------------------------------------

export const MAP_VIEWBOX = { width: 1000, height: 600 };

/**
 * Approximate real-world coordinates for the Nashik–Trimbakeshwar Simhastha
 * Kumbh Mela 2027 corridor. Nashik's ghats (Ramkund/Tapovan) and the
 * Trimbakeshwar temple/Kushavarta site sit ~28km apart and are both live
 * bathing locations for this Kumbh — this map deliberately shows both
 * clusters and the transit corridor between them. Coordinates are
 * approximate public landmark locations, not surveyed zone boundaries.
 */
export const ZONE_GEO: Record<string, [number, number]> = {
  z01: [19.9997, 73.7898], // Ramkund Ghat, Nashik
  z02: [20.0043, 73.7817], // Tapovan Ghat, Nashik
  z03: [19.9325, 73.532], // Kushavarta Kund, Trimbakeshwar
  z04: [19.9317, 73.531], // Trimbakeshwar Temple perimeter
  z05: [19.985, 73.755], // Transit corridor, Nashik-Trimbakeshwar route
  z06: [19.996, 73.793], // Godavari pontoon crossing, Nashik
};

export const NASHIK_CENTROID: [number, number] = [20.001, 73.786];
export const TRIMBAKESHWAR_CENTROID: [number, number] = [19.9321, 73.5315];

/**
 * A small set of REAL, publicly registered facilities near the Nashik ghats,
 * sourced from Nashik Monitor (open data compiled from the NTKMA mobility
 * plan and government registries) — https://github.com/tanmayk1234/nashik-monitor-v2
 * Shown only on the Real Map (GIS) layer as reference infrastructure. These
 * are real places; they are NOT wired into the simulated incident/dispatch
 * system — that stays clearly synthetic, per the demo's SIMULATION MODE rule.
 */
export const REAL_INFRASTRUCTURE: {
  name: string;
  type: "hospital" | "police";
  position: [number, number];
}[] = [
  { name: "Dhadiwal Hospital", type: "hospital", position: [19.9966, 73.7801] },
  { name: "Dr. Gosavi Maternity & Nursing Home", type: "hospital", position: [20.0009, 73.7833] },
  { name: "Vidula Nursing Home", type: "hospital", position: [20.0057, 73.7752] },
  { name: "College Road Police Chowki", type: "police", position: [20.0074, 73.7582] },
  { name: "Ambad Police Chowki", type: "police", position: [19.9857, 73.7237] },
];

export const ZONES: Zone[] = [
  {
    id: "z01",
    code: "Z01",
    name: "Ramkund Ghat",
    shortName: "Ghat 1",
    polygon: [
      { x: 40, y: 50 }, { x: 280, y: 40 }, { x: 300, y: 180 },
      { x: 260, y: 250 }, { x: 60, y: 260 }, { x: 30, y: 150 },
    ],
    labelPoint: { x: 160, y: 150 },
    density: "moderate",
    densityPercent: 54,
    riskBand: "green",
    riskScore: 28,
    trend: "flat",
    capacity: 18000,
    currentOccupancy: 9700,
  },
  {
    id: "z03",
    code: "Z03",
    name: "Kushavarta Approach",
    shortName: "Kushavarta",
    polygon: [
      { x: 340, y: 40 }, { x: 580, y: 50 }, { x: 600, y: 160 },
      { x: 560, y: 250 }, { x: 360, y: 250 }, { x: 330, y: 150 },
    ],
    labelPoint: { x: 470, y: 140 },
    density: "moderate",
    densityPercent: 48,
    riskBand: "green",
    riskScore: 24,
    trend: "flat",
    capacity: 15000,
    currentOccupancy: 7200,
  },
  {
    id: "z05",
    code: "Z05",
    name: "Saraswati Nagar Transit",
    shortName: "Transit Corridor",
    polygon: [
      { x: 640, y: 45 }, { x: 880, y: 40 }, { x: 920, y: 160 },
      { x: 880, y: 250 }, { x: 660, y: 255 }, { x: 630, y: 150 },
    ],
    labelPoint: { x: 760, y: 145 },
    density: "low",
    densityPercent: 31,
    riskBand: "green",
    riskScore: 18,
    trend: "flat",
    capacity: 22000,
    currentOccupancy: 6800,
  },
  {
    id: "z02",
    code: "Z02",
    name: "Tapovan Ghat",
    shortName: "Ghat 2",
    polygon: [
      { x: 30, y: 360 }, { x: 260, y: 350 }, { x: 280, y: 470 },
      { x: 240, y: 555 }, { x: 50, y: 560 }, { x: 20, y: 460 },
    ],
    labelPoint: { x: 150, y: 460 },
    density: "moderate",
    densityPercent: 57,
    riskBand: "yellow",
    riskScore: 46,
    trend: "up",
    capacity: 16000,
    currentOccupancy: 9100,
  },
  {
    id: "z04",
    code: "Z04",
    name: "Trimbakeshwar Temple Perimeter",
    shortName: "Ghat 4",
    polygon: [
      { x: 320, y: 345 }, { x: 620, y: 340 }, { x: 650, y: 470 },
      { x: 600, y: 570 }, { x: 340, y: 575 }, { x: 300, y: 470 },
    ],
    labelPoint: { x: 470, y: 460 },
    density: "high",
    densityPercent: 78,
    riskBand: "yellow",
    riskScore: 68,
    trend: "up",
    capacity: 24000,
    currentOccupancy: 18700,
  },
  {
    id: "z06",
    code: "Z06",
    name: "Godavari Pontoon Crossing",
    shortName: "Pontoon Bridge",
    polygon: [
      { x: 660, y: 350 }, { x: 900, y: 345 }, { x: 930, y: 460 },
      { x: 890, y: 560 }, { x: 680, y: 565 }, { x: 650, y: 460 },
    ],
    labelPoint: { x: 780, y: 455 },
    density: "low",
    densityPercent: 36,
    riskBand: "green",
    riskScore: 22,
    trend: "down",
    capacity: 12000,
    currentOccupancy: 4300,
  },
];

export const FACILITIES: Facility[] = [
  { id: "f01", type: "medical", name: "Medical Camp — Ramkund", zoneId: "z01", position: { x: 170, y: 90 }, status: "open", load: "low" },
  { id: "f02", type: "water", name: "Water Point — Ramkund North", zoneId: "z01", position: { x: 220, y: 190 }, status: "open", load: "low" },
  { id: "f03", type: "toilet", name: "Sanitation Block — Ramkund", zoneId: "z01", position: { x: 90, y: 200 }, status: "open", load: "moderate" },
  { id: "f04", type: "help_desk", name: "Help Desk — Kushavarta", zoneId: "z03", position: { x: 430, y: 90 }, status: "open", load: "low" },
  { id: "f05", type: "food", name: "Langar Seva — Kushavarta", zoneId: "z03", position: { x: 520, y: 200 }, status: "open", load: "moderate" },
  { id: "f06", type: "parking", name: "Parking Zone — Saraswati Nagar", zoneId: "z05", position: { x: 760, y: 90 }, status: "open", load: "moderate" },
  { id: "f07", type: "medical", name: "Medical Camp — Tapovan", zoneId: "z02", position: { x: 130, y: 400 }, status: "open", load: "moderate" },
  { id: "f08", type: "toilet", name: "Sanitation Block — Tapovan", zoneId: "z02", position: { x: 210, y: 500 }, status: "open", load: "high" },
  { id: "f09", type: "medical", name: "Medical Camp — Ghat 4 East", zoneId: "z04", position: { x: 560, y: 400 }, status: "open", load: "high" },
  { id: "f10", type: "water", name: "Water Point — Temple Perimeter", zoneId: "z04", position: { x: 400, y: 420 }, status: "open", load: "moderate" },
  { id: "f11", type: "help_desk", name: "Help Desk — Ghat 4 Control", zoneId: "z04", position: { x: 470, y: 520 }, status: "open", load: "moderate" },
  { id: "f12", type: "toilet", name: "Sanitation Block — Pontoon", zoneId: "z06", position: { x: 800, y: 500 }, status: "limited", load: "low" },
];

export const VOLUNTEERS: Volunteer[] = [
  { id: "V-101", name: "A. Deshmukh", zoneId: "z01", position: { x: 190, y: 140 }, availability: "available", skills: ["first_aid"], languages: ["en", "hi", "mr"], shiftStart: "10:00", shiftEnd: "18:00", lastSeen: "moments ago" },
  { id: "V-142", name: "R. Kulkarni", zoneId: "z03", position: { x: 460, y: 160 }, availability: "available", skills: ["crowd_marshal"], languages: ["hi", "mr"], shiftStart: "10:00", shiftEnd: "18:00", lastSeen: "moments ago" },
  { id: "V-176", name: "S. Pawar", zoneId: "z02", position: { x: 150, y: 430 }, availability: "on_task", skills: ["first_aid", "crowd_marshal"], languages: ["mr", "hi"], shiftStart: "08:00", shiftEnd: "16:00", lastSeen: "1 min ago" },
  { id: "V-218", name: "M. Joshi", zoneId: "z04", position: { x: 430, y: 400 }, availability: "available", skills: ["first_aid", "medical_escort"], languages: ["en", "mr"], shiftStart: "14:00", shiftEnd: "18:00", lastSeen: "moments ago" },
  { id: "V-233", name: "K. Bhosale", zoneId: "z04", position: { x: 560, y: 500 }, availability: "available", skills: ["crowd_marshal"], languages: ["hi"], shiftStart: "14:00", shiftEnd: "18:00", lastSeen: "moments ago" },
  { id: "V-260", name: "P. Nikam", zoneId: "z05", position: { x: 780, y: 140 }, availability: "off_duty", skills: ["logistics"], languages: ["en", "hi"], shiftStart: "06:00", shiftEnd: "12:00", lastSeen: "42 min ago" },
  { id: "V-284", name: "N. Shinde", zoneId: "z06", position: { x: 790, y: 470 }, availability: "available", skills: ["first_aid"], languages: ["hi", "mr", "en"], shiftStart: "10:00", shiftEnd: "18:00", lastSeen: "moments ago" },
];

export const RISK_SNAPSHOTS: Record<string, RiskSnapshot> = {
  z01: {
    zoneId: "z01", score: 28, band: "green", generatedAt: new Date().toISOString(),
    modelVersion: "pulse-rule-v0.3", confidence: 0.71,
    contributors: [
      { label: "Crowd Activity", weightPercent: 40 },
      { label: "Movement Change", weightPercent: 22 },
      { label: "Checkpoint Reports", weightPercent: 20 },
      { label: "Historical Pattern", weightPercent: 18 },
    ],
    narrative: "Density within normal range for this time window. No elevated signals.",
  },
  z03: {
    zoneId: "z03", score: 24, band: "green", generatedAt: new Date().toISOString(),
    modelVersion: "pulse-rule-v0.3", confidence: 0.69,
    contributors: [
      { label: "Crowd Activity", weightPercent: 38 },
      { label: "Movement Change", weightPercent: 19 },
      { label: "Checkpoint Reports", weightPercent: 21 },
      { label: "Historical Pattern", weightPercent: 22 },
    ],
    narrative: "Steady approach traffic. No preventive action indicated.",
  },
  z05: {
    zoneId: "z05", score: 18, band: "green", generatedAt: new Date().toISOString(),
    modelVersion: "pulse-rule-v0.3", confidence: 0.74,
    contributors: [
      { label: "Crowd Activity", weightPercent: 30 },
      { label: "Movement Change", weightPercent: 15 },
      { label: "Checkpoint Reports", weightPercent: 25 },
      { label: "Historical Pattern", weightPercent: 30 },
    ],
    narrative: "Transit corridor flowing normally.",
  },
  z02: {
    zoneId: "z02", score: 46, band: "yellow", generatedAt: new Date().toISOString(),
    modelVersion: "pulse-rule-v0.3", confidence: 0.66,
    forecastBand: "yellow", forecastHorizonMinutes: [15, 30],
    contributors: [
      { label: "Crowd Activity", weightPercent: 36 },
      { label: "Movement Change", weightPercent: 28 },
      { label: "Checkpoint Reports", weightPercent: 20 },
      { label: "Historical Pattern", weightPercent: 16 },
    ],
    narrative: "Gradual density increase near sanitation block. Volunteer checkpoint reports rising foot traffic.",
  },
  z04: {
    zoneId: "z04", score: 68, band: "yellow", generatedAt: new Date().toISOString(),
    modelVersion: "pulse-rule-v0.3", confidence: 0.72,
    forecastBand: "yellow", forecastHorizonMinutes: [15, 30],
    contributors: [
      { label: "Crowd Activity", weightPercent: 42 },
      { label: "Movement Change", weightPercent: 26 },
      { label: "Checkpoint Reports", weightPercent: 18 },
      { label: "Historical Pattern", weightPercent: 14 },
    ],
    narrative: "Elevated density expected near the temple perimeter approach. Consistent with pre-aarti historical pattern for this time window.",
  },
  z06: {
    zoneId: "z06", score: 22, band: "green", generatedAt: new Date().toISOString(),
    modelVersion: "pulse-rule-v0.3", confidence: 0.7,
    contributors: [
      { label: "Crowd Activity", weightPercent: 33 },
      { label: "Movement Change", weightPercent: 17 },
      { label: "Checkpoint Reports", weightPercent: 22 },
      { label: "Historical Pattern", weightPercent: 28 },
    ],
    narrative: "Crossing load light. No action indicated.",
  },
};

export const RESOURCES: Resource[] = [
  { id: "r01", type: "Stretchers", zoneId: "z04", quantity: 6, status: "adequate" },
  { id: "r02", type: "First-aid kits", zoneId: "z04", quantity: 3, status: "low" },
  { id: "r03", type: "Barricades", zoneId: "z02", quantity: 40, status: "adequate" },
  { id: "r04", type: "Drinking water (litres)", zoneId: "z01", quantity: 800, status: "adequate" },
  { id: "r05", type: "PA announcement units", zoneId: "z04", quantity: 2, status: "adequate" },
];

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: "ks-1039",
    code: "KS-1039",
    type: "lost_person",
    severity: "moderate",
    zoneId: "z02",
    position: { x: 160, y: 470 },
    createdAt: new Date(Date.now() - 47 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    status: "resolved",
    reportedBy: { role: "volunteer", label: "V-176" },
    assignedVolunteerId: "V-176",
    timeline: [
      { status: "created", label: "Reported", timestamp: new Date(Date.now() - 47 * 60 * 1000).toISOString(), actor: "V-176" },
      { status: "resolved", label: "Resolved — reunited at Help Desk", timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(), actor: "V-176" },
    ],
    summary: "Child separated from family near Tapovan sanitation block. Reunited via Help Desk.",
  },
];

export const AUDIT_SEED: AuditEvent[] = [
  {
    id: "ae-seed-1",
    actor: "system",
    action: "SIMULATION_STARTED",
    entity: "system",
    entityId: "-",
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    metadata: "Demo environment initialized with synthetic zone, facility and volunteer data.",
  },
];

export const INITIAL_ADVISORIES: Advisory[] = [];

export const INITIAL_FOUND_REPORTS: FoundReport[] = [];

// A few illustrative pilgrim ratings so the Common Board's feedback panel is
// not empty on a fresh demo. Clearly synthetic.
export const INITIAL_FEEDBACK: PilgrimFeedback[] = [
  {
    id: "fb-seed-1",
    name: "Anonymous",
    zoneId: "z01",
    rating: 4,
    category: "facilities",
    message: "Water points near Ramkund were well stocked and clearly signed. Toilets a bit far.",
    createdAt: new Date(Date.now() - 52 * 60 * 1000).toISOString(),
  },
  {
    id: "fb-seed-2",
    name: "R. Iyer",
    zoneId: "z04",
    rating: 3,
    category: "crowd",
    message: "Very heavy crowd at the temple perimeter around noon. Marshals were helpful though.",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "fb-seed-3",
    zoneId: "z03",
    rating: 5,
    category: "staff",
    message: "Volunteer at Kushavarta helped my elderly parents to the priority lane. Grateful.",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
];

export function findZone(zoneId: string): Zone | undefined {
  return ZONES.find((z) => z.id === zoneId);
}

// Illustrative session baseline so Analytics is not empty before any incident
// occurs in a fresh demo. Clearly synthetic — see SimTag on the Analytics view.
export const ANALYTICS_BASELINE = {
  avgResponseMinutes: 5.4,
  incidentsToday: 11,
  resolvedToday: 10,
  volunteerUtilization: 0.61,
  peakActivity: [
    { label: "08h", value: 14 },
    { label: "10h", value: 22 },
    { label: "12h", value: 31 },
    { label: "14h", value: 44 },
    { label: "16h", value: 38 },
    { label: "18h", value: 26 },
  ],
  categoryBaseline: [
    { label: "Medical", value: 5 },
    { label: "Lost Person", value: 3 },
    { label: "Crowd", value: 2 },
    { label: "Security", value: 1 },
    { label: "Facility", value: 0 },
  ],
};
