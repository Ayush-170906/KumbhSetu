import type {
  Zone,
  Incident,
  IncidentSeverity,
  IncidentType,
  Volunteer,
  RiskSnapshot,
  ZonePoint,
  LanguageCode,
} from "./types";
import { clamp } from "./format";

export function distance(a: ZonePoint, b: ZonePoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** The volunteer skill best suited to each incident type — used to profile
 * dispatch rather than matching purely on proximity (Tower 4 / "volunteers
 * that follow the crowd": route by real skill and language, not just distance). */
export function requiredSkillFor(type: IncidentType): string | undefined {
  switch (type) {
    case "medical":
      return "first_aid";
    case "crowd_pressure":
    case "security":
      return "crowd_marshal";
    default:
      return undefined;
  }
}

export interface DispatchMatch {
  volunteer: Volunteer;
  quality: "skill_and_language" | "skill" | "language" | "nearest";
}

/**
 * Finds the best available volunteer for an incident. Scores candidates by
 * required-skill match and preferred-language match first, then breaks ties
 * by straight-line map distance (same zone preferred). This mirrors a real
 * dispatch operator's reasoning — "who is both qualified and reachable" —
 * rather than nearest-only matching.
 */
export function findNearestAvailableVolunteer(
  volunteers: Volunteer[],
  zoneId: string,
  position: ZonePoint,
  excludeIds: string[] = [],
  requiredSkill?: string,
  preferredLanguage?: LanguageCode
): DispatchMatch | undefined {
  const candidates = volunteers.filter(
    (v) => v.availability === "available" && !excludeIds.includes(v.id)
  );
  if (candidates.length === 0) return undefined;

  const sameZone = candidates.filter((v) => v.zoneId === zoneId);
  const pool = sameZone.length > 0 ? sameZone : candidates;

  const scored = pool.map((v) => {
    const skillMatch = requiredSkill ? v.skills.includes(requiredSkill) : false;
    const languageMatch = preferredLanguage ? v.languages.includes(preferredLanguage) : false;
    // Lower is better: skill mismatch and language mismatch each cost more
    // than any realistic distance gap on this map, so qualification wins,
    // then distance breaks ties within the same qualification tier.
    const penalty = (requiredSkill && !skillMatch ? 1000 : 0) + (preferredLanguage && !languageMatch ? 400 : 0);
    return { v, skillMatch, languageMatch, score: penalty + distance(v.position, position) };
  });

  scored.sort((a, b) => a.score - b.score);
  const winner = scored[0];

  const quality: DispatchMatch["quality"] =
    winner.skillMatch && winner.languageMatch
      ? "skill_and_language"
      : winner.skillMatch
      ? "skill"
      : winner.languageMatch
      ? "language"
      : "nearest";

  return { volunteer: winner.v, quality };
}

/** Simple keyword-overlap scorer for matching a found-person report against
 * an open missing-person incident's description. Deliberately transparent
 * (no ML) — a human still confirms the match before it resolves anything. */
export function textMatchScore(a: string, b: string): number {
  const words = (s: string) => new Set(s.toLowerCase().match(/[a-z]{3,}/g) ?? []);
  const wa = words(a);
  const wb = words(b);
  if (wa.size === 0 || wb.size === 0) return 0;
  let overlap = 0;
  for (const w of wa) if (wb.has(w)) overlap++;
  return Math.round((overlap / Math.min(wa.size, wb.size)) * 100);
}

export function estimateEtaMinutes(distancePx: number): number {
  // Abstract map units -> a plausible on-foot ETA for a marshal on site.
  const minutes = Math.round(2 + distancePx / 60);
  return clamp(minutes, 2, 18);
}

export function severityWeight(severity: IncidentSeverity): number {
  switch (severity) {
    case "critical":
      return 22;
    case "moderate":
      return 12;
    case "low":
      return 5;
  }
}

const RISK_BAND_THRESHOLDS: [number, "green" | "yellow" | "red"][] = [
  [70, "red"],
  [40, "yellow"],
  [0, "green"],
];

export function bandForScore(score: number): "green" | "yellow" | "red" {
  for (const [min, band] of RISK_BAND_THRESHOLDS) {
    if (score >= min) return band;
  }
  return "green";
}

/**
 * Recomputes a zone's risk snapshot from its baseline signals plus the
 * additional load contributed by currently-open incidents in that zone.
 * This is intentionally a transparent, rule-based calculation (Kumbh Pulse
 * Stage 0) rather than a black-box model — every factor is inspectable.
 */
export function recomputeZoneRisk(
  zone: Zone,
  baseline: RiskSnapshot,
  openIncidentCount: number,
  incidentSeverityBoost: number,
  modelVersion: string
): RiskSnapshot {
  const baseScore = zone.densityPercent * 0.55 + baseline.contributors.reduce(
    (sum, c) => sum + c.weightPercent * 0.15,
    0
  );
  const incidentLoad = clamp(incidentSeverityBoost, 0, 30);
  const score = clamp(Math.round(baseScore * 0.5 + baseline.score * 0.3 + incidentLoad), 0, 100);
  const band = bandForScore(score);

  const contributors = [
    { label: "Crowd Activity", weightPercent: clamp(Math.round(zone.densityPercent * 0.5), 5, 60) },
    { label: "Movement Change", weightPercent: baseline.contributors[1]?.weightPercent ?? 20 },
    { label: "Checkpoint Reports", weightPercent: openIncidentCount > 0 ? clamp(18 + openIncidentCount * 6, 18, 40) : (baseline.contributors[2]?.weightPercent ?? 18) },
    { label: "Historical Pattern", weightPercent: baseline.contributors[3]?.weightPercent ?? 16 },
  ];
  const total = contributors.reduce((s, c) => s + c.weightPercent, 0) || 1;
  const normalized = contributors.map((c) => ({
    ...c,
    weightPercent: Math.round((c.weightPercent / total) * 100),
  }));

  let narrative = baseline.narrative;
  if (openIncidentCount > 0) {
    narrative = `${openIncidentCount} active incident${openIncidentCount > 1 ? "s" : ""} in this zone is contributing to elevated checkpoint reports and modeled risk.`;
  } else if (band === "yellow") {
    narrative = "Elevated density approaching historical pre-peak pattern for this time window.";
  } else if (band === "green") {
    narrative = "Density and movement signals within normal range for this time window.";
  }

  return {
    zoneId: zone.id,
    score,
    band,
    generatedAt: new Date().toISOString(),
    modelVersion,
    confidence: clamp(0.6 + (1 - Math.abs(score - 50) / 100) * 0.25, 0.5, 0.92),
    forecastBand: band === "green" ? undefined : band,
    forecastHorizonMinutes: band === "green" ? undefined : [15, 30],
    contributors: normalized,
    narrative,
  };
}

export function nextSequentialCode(seq: number): string {
  return `KS-${1000 + seq}`;
}

/**
 * Resolve a loose incident reference to a single incident.
 *
 * The reasoning model is inconsistent about where it puts the identifier: it
 * may pass "KS-1003" in the `code` field, in the `incidentId` field, or pass
 * the internal id "inc-ks-1003", or even just "1003". Incident `id` is
 * `inc-ks-1003` (lower-case) and `code` is `KS-1003`, so a naive
 * `i.id === ref || i.code === ref` misses most of these. Pass every candidate
 * reference (any order) and this matches on a normalised form.
 */
export function resolveIncident(
  incidents: Incident[],
  ...refs: (string | undefined | null)[]
): Incident | undefined {
  const norm = (s: string) =>
    s.trim().toUpperCase().replace(/\s+/g, "").replace(/^INC[-_]?/, "");
  for (const raw of refs) {
    if (typeof raw !== "string" || !raw.trim()) continue;
    const r = norm(raw);
    const rDigits = r.replace(/\D/g, "");
    const hit = incidents.find((i) => {
      const code = i.code.toUpperCase();
      const id = i.id.toUpperCase().replace(/^INC[-_]?/, "");
      if (r === code || r === id) return true;
      // digit-only fallback ("1003" -> KS-1003), but only for full-length codes
      if (rDigits.length >= 4 && rDigits === code.replace(/\D/g, "")) return true;
      return false;
    });
    if (hit) return hit;
  }
  return undefined;
}
