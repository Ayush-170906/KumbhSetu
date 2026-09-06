// Real Nashik–Trimbakeshwar infrastructure directory.
//
// Source: Nashik Monitor v2 (github.com/tanmayk1234/nashik-monitor-v2) — open
// data compiled for the Kumbhathon initiative from the NTKMA mobility plan and
// government registries. The raw GeoJSON is normalised at build time by
// scripts/build-nashik-directory.mjs into src/data/nashikDirectory.json.
//
// This is REAL place data. It is shown in the control room as a reference
// directory and is deliberately NOT wired into the simulated incident/dispatch
// system — that stays clearly synthetic (SIMULATION MODE).

import raw from "@/data/nashikDirectory.json";

export type DirectoryGroup =
  | "medical"
  | "safety"
  | "crowd"
  | "sanitation"
  | "religious"
  | "stay"
  | "food"
  | "transport"
  | "other";

export interface NashikPlace {
  id: string;
  group: DirectoryGroup;
  kind: string;
  dataset: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  phone?: string;
  beds?: number;
  confidence?: string;
}

export interface NashikDirectory {
  source: string;
  generatedAt: string;
  count: number;
  datasets: { label: string; n: number }[];
  places: NashikPlace[];
}

export const NASHIK_DIRECTORY = raw as NashikDirectory;

export const GROUP_LABEL: Record<DirectoryGroup, string> = {
  medical: "Medical",
  safety: "Safety & security",
  crowd: "Crowd infrastructure",
  sanitation: "Sanitation",
  religious: "Religious sites",
  stay: "Accommodation",
  food: "Food supply",
  transport: "Transport",
  other: "Other",
};

export const GROUP_ORDER: DirectoryGroup[] = [
  "medical", "safety", "crowd", "sanitation", "religious", "transport", "stay", "food", "other",
];

/** Places in a group, optionally filtered by a free-text query. */
export function placesIn(group: DirectoryGroup, query = ""): NashikPlace[] {
  const q = query.trim().toLowerCase();
  return NASHIK_DIRECTORY.places.filter(
    (p) =>
      p.group === group &&
      (!q ||
        p.name.toLowerCase().includes(q) ||
        p.kind.toLowerCase().includes(q) ||
        (p.address ?? "").toLowerCase().includes(q))
  );
}

export function groupCounts(): Record<DirectoryGroup, number> {
  const c = Object.fromEntries(GROUP_ORDER.map((g) => [g, 0])) as Record<DirectoryGroup, number>;
  for (const p of NASHIK_DIRECTORY.places) c[p.group]++;
  return c;
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Nearest real place of a group to a lat/lng — used by Setu's grounded answers. */
export function nearestPlace(
  group: DirectoryGroup,
  lat: number,
  lng: number
): { place: NashikPlace; km: number } | undefined {
  let best: { place: NashikPlace; km: number } | undefined;
  for (const p of NASHIK_DIRECTORY.places) {
    if (p.group !== group) continue;
    const km = haversineKm(lat, lng, p.lat, p.lng);
    if (!best || km < best.km) best = { place: p, km };
  }
  return best;
}
