// Kumbh Pulse — emerging-signal aggregation (§20).
//
// Several weak field signals (ground reports + pilgrim requests + a resource
// flag) are combined into one thing worth a human operator's attention. This
// is decision SUPPORT — it never triggers an automated action, and it is
// clearly labelled as running over synthetic/demo signals.

import type {
  GroundReport,
  GroundReportCategory,
  EmergingSignal,
  Resource,
  Zone,
} from "./types";

const CATEGORY_HEADLINES: Record<GroundReportCategory, string> = {
  water: "Possible water shortage",
  food: "Food service strain",
  toilet: "Sanitation issue building",
  medical: "Cluster of medical reports",
  crowd: "Crowd pressure building",
  infrastructure: "Infrastructure fault reported",
  safety: "Safety concern building",
  lost_person: "Multiple lost-person reports",
  accessibility: "Accessibility gap reported",
  other: "Repeated field reports",
};

const CATEGORY_ACTION: Record<GroundReportCategory, string> = {
  water: "Verify tanker status and resource levels for the zone; pre-position supply.",
  food: "Check langar throughput and queue management.",
  toilet: "Dispatch sanitation crew; confirm water supply to the block.",
  medical: "Alert the medical response team; consider a forward aid point.",
  crowd: "Review inflow control upstream and open release routes.",
  infrastructure: "Send a works team; barricade the hazard if needed.",
  safety: "Notify the safety desk and nearest police post.",
  lost_person: "Prioritise reunification desk staffing; cross-check found reports.",
  accessibility: "Stage mobility support at the zone Help Desk.",
  other: "Assign an operator to review the reports and confirm.",
};

/**
 * A category+zone becomes an emerging signal when there is more than one
 * independent, still-open report, OR one corroborated report, OR a single
 * high-severity report backed by pilgrim demand. Confidence rises with the
 * number of agreeing signals and a matching resource flag.
 */
export function deriveEmergingSignals(
  reports: GroundReport[],
  resources: Resource[],
  zones: Zone[],
  pilgrimRequests: Record<string, number> = {}
): EmergingSignal[] {
  const open = reports.filter((r) => !["resolved", "dismissed"].includes(r.status));
  const groups = new Map<string, GroundReport[]>();
  for (const r of open) {
    const key = `${r.category}::${r.zoneId}`;
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }

  const signals: EmergingSignal[] = [];

  for (const [key, group] of groups) {
    const [category, zoneId] = key.split("::") as [GroundReportCategory, string];
    const distinctReports = group.length;
    const corroboration = group.reduce((s, r) => s + Math.max(1, r.corroborations), 0);
    const highSev = group.some((r) => r.severity === "high");
    const requests = pilgrimRequests[`${category}::${zoneId}`] ?? 0;

    const bigImpact = group.some((r) => (r.estimatedPeopleAffected ?? 0) >= 100);
    const qualifies =
      distinctReports >= 2 ||
      group.some((r) => r.status === "corroborated" || r.status === "verified") ||
      (highSev && (requests >= 1 || bigImpact));
    if (!qualifies) continue;

    const resourceFlag = resources.find(
      (res) => res.zoneId === zoneId && res.status !== "adequate" && matchesCategory(res.type, category)
    );

    // Confidence model (transparent): base on agreeing reports, add for
    // corroboration, pilgrim demand and a matching resource flag. Capped.
    let confidence = 0.35 + Math.min(distinctReports, 4) * 0.12;
    confidence += Math.min(corroboration - distinctReports, 4) * 0.05;
    confidence += Math.min(requests, 10) * 0.02;
    if (resourceFlag) confidence += 0.12;
    if (highSev) confidence += 0.05;
    confidence = Math.min(0.95, Math.round(confidence * 100) / 100);

    const zone = zones.find((z) => z.id === zoneId);
    const firstSeen = group.reduce((min, r) => (r.createdAt < min ? r.createdAt : min), group[0].createdAt);
    const lastUpdated = group.reduce((max, r) => (r.updatedAt > max ? r.updatedAt : max), group[0].updatedAt);

    signals.push({
      id: `sig-${category}-${zoneId}`,
      category,
      zoneId,
      headline: `${CATEGORY_HEADLINES[category]} — ${zone?.shortName ?? zoneId}`,
      confidence,
      reportIds: group.map((r) => r.id),
      pilgrimRequestCount: requests,
      resourceFlag: resourceFlag ? `${resourceFlag.type} ${resourceFlag.status}` : undefined,
      recommendedAction: CATEGORY_ACTION[category],
      firstSeenAt: firstSeen,
      lastUpdatedAt: lastUpdated,
    });
  }

  return signals.sort((a, b) => b.confidence - a.confidence);
}

function matchesCategory(resourceType: string, category: GroundReportCategory): boolean {
  const t = resourceType.toLowerCase();
  if (category === "water") return t.includes("water");
  if (category === "medical") return t.includes("first-aid") || t.includes("stretcher") || t.includes("kit");
  if (category === "crowd") return t.includes("barricade") || t.includes("pa ");
  if (category === "infrastructure") return t.includes("barricade") || t.includes("pa ");
  return false;
}
