// Vision provider (§18).
//
// A real build sends the photo to a vision model. Here we derive a plausible
// structured observation from the volunteer's spoken hint plus lightweight
// image stats (size, aspect) so the flow — photo + voice → structured draft →
// human confirm — is fully demonstrable offline. The `confidence` is always
// shown and a human always confirms (§19).

import type { VisionProvider, VisionObservation, ProviderInfo } from "./types";

interface Rule {
  keys: RegExp;
  label: string;
  categoryHint: string;
  potentialImpact: string;
  confidence: number;
}

const RULES: Rule[] = [
  {
    keys: /barricade|barrier|railing|fence/i,
    label: "Damaged or displaced barricade",
    categoryHint: "infrastructure",
    potentialImpact: "Pedestrian safety / crowd channelling",
    confidence: 0.81,
  },
  {
    keys: /water|tanker|tap|pipe|leak/i,
    label: "Water supply issue",
    categoryHint: "water",
    potentialImpact: "Hydration access for waiting pilgrims",
    confidence: 0.78,
  },
  {
    keys: /toilet|drain|sewage|overflow|garbage|waste|trash/i,
    label: "Sanitation / waste issue",
    categoryHint: "toilet",
    potentialImpact: "Hygiene and disease risk",
    confidence: 0.8,
  },
  {
    keys: /crowd|queue|line|rush|packed|congest/i,
    label: "Dense crowd build-up",
    categoryHint: "crowd",
    potentialImpact: "Crowd pressure / movement bottleneck",
    confidence: 0.72,
  },
  {
    keys: /light|lamp|dark|electric|wire|cable/i,
    label: "Lighting / electrical hazard",
    categoryHint: "safety",
    potentialImpact: "Trip and electrical hazard after dark",
    confidence: 0.75,
  },
  {
    keys: /fire|smoke|burn/i,
    label: "Possible fire / smoke",
    categoryHint: "safety",
    potentialImpact: "Fire hazard — may need immediate response",
    confidence: 0.7,
  },
  {
    keys: /sign|board|hoarding|banner/i,
    label: "Damaged or missing signage",
    categoryHint: "infrastructure",
    potentialImpact: "Wayfinding — pilgrims may take wrong routes",
    confidence: 0.68,
  },
];

export class MockVisionProvider implements VisionProvider {
  readonly info: ProviderInfo = { name: "On-device vision (simulated)", simulated: true };

  async describe(dataUrl: string, hint?: string): Promise<VisionObservation> {
    // Tiny deterministic jitter from the image payload so two different photos
    // with the same hint don't report identical confidence.
    const tail = dataUrl.slice(-24);
    let h = 0;
    for (let i = 0; i < tail.length; i++) h = (h * 31 + tail.charCodeAt(i)) >>> 0;
    const jitter = ((h % 11) - 5) / 100; // -0.05 .. +0.05

    const text = hint ?? "";
    const rule = RULES.find((r) => r.keys.test(text));
    if (rule) {
      return {
        label: rule.label,
        categoryHint: rule.categoryHint,
        potentialImpact: rule.potentialImpact,
        confidence: Math.max(0.4, Math.min(0.95, rule.confidence + jitter)),
      };
    }

    if (hint && hint.trim().length > 3) {
      return {
        label: `Field observation: ${hint.trim()}`,
        categoryHint: "other",
        potentialImpact: "Needs an operator to review",
        confidence: 0.55 + jitter,
      };
    }

    // No spoken hint at all — a bare photo. A real vision model would classify
    // the scene; here we pick a neutral category deterministically from the
    // image bytes so the report flow still works, keep confidence low, and
    // flag it clearly as unverified from the image alone (§19). We deliberately
    // avoid guessing alarming categories (fire, medical) with no corroborating
    // words — those need the volunteer to say so.
    const NEUTRAL: { label: string; categoryHint: string; potentialImpact: string }[] = [
      { label: "an infrastructure or signage issue", categoryHint: "infrastructure", potentialImpact: "Wayfinding / pedestrian flow — an operator should review" },
      { label: "a sanitation or waste issue", categoryHint: "toilet", potentialImpact: "Hygiene — an operator should review" },
      { label: "a crowd build-up", categoryHint: "crowd", potentialImpact: "Movement / crowd pressure — an operator should review" },
      { label: "a general field observation", categoryHint: "other", potentialImpact: "Needs an operator to review" },
    ];
    const pick = NEUTRAL[h % NEUTRAL.length];
    return {
      label: `${pick.label} (unverified from the image — add a note to confirm)`,
      categoryHint: pick.categoryHint,
      potentialImpact: pick.potentialImpact,
      confidence: 0.48 + jitter,
    };
  }
}
