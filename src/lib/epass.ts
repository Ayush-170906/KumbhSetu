import type { EPass, EPassCategory } from "./types";

/** Colour-coded categories, echoing the Maha Kumbh 2025 six-colour e-pass idea
 * but trimmed to what a pilgrim would pick for themselves. `band` is a hex
 * colour (no leading #). */
export const EPASS_META: Record<
  EPassCategory,
  { label: string; band: string; ink: string; hint: string }
> = {
  general: {
    label: "General pilgrim",
    band: "1C7293",
    ink: "ffffff",
    hint: "Standard entry to all public ghats.",
  },
  senior_divyang: {
    label: "Senior / Divyang",
    band: "2C5F2D",
    ink: "ffffff",
    hint: "Priority lane and wheelchair help at the gate.",
  },
  family_children: {
    label: "Family with children",
    band: "6D2E46",
    ink: "ffffff",
    hint: "Family lane — keep children on their wristbands and stay together.",
  },
  snan_slot: {
    label: "Amrit Snan slot",
    band: "BF5326",
    ink: "ffffff",
    hint: "Timed entry for a principal bathing day — arrive within your window.",
  },
};

export const EPASS_CLUSTER_LABEL: Record<EPass["cluster"], string> = {
  nashik: "Nashik · Ramkund / Godavari ghats",
  trimbakeshwar: "Trimbakeshwar · Kushavarta Kund",
};

/** Compact string encoded into the pass QR — enough for a gate scanner to
 * validate offline. */
export function epassPayload(p: EPass): string {
  return `KS-EPASS|${p.id}|${p.cluster}|${p.date}|${p.category}|${p.partySize}`;
}
