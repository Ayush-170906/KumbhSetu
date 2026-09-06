// Nashik–Trimbakeshwar Simhastha — principal bathing-day (Parva / Amrit Snan)
// calendar.
//
// IMPORTANT: these dates and the akhara order are ILLUSTRATIVE demo data for the
// prototype. The real schedule is fixed by the Mela authority from the
// astrological calendar and published on notice boards and to the control room.
// Setu always defers final confirmation to the authority — it does not present
// this as authoritative (mirrors the kb-shahi-snan knowledge-base entry).
//
// The scenario in the mentor spec (§5.1) turns on this: a pilgrim asks "where is
// the holy dip today?" and must get a date- and cluster-specific answer, because
// on a Vaishnava day the bathing is at Ramkund (Nashik) while Shaiva akharas
// bathe at Kushavarta (Trimbakeshwar), ~30 km apart.

export type GhatCluster = "nashik" | "trimbakeshwar" | "both";

export interface SnanDay {
  /** ISO date, illustrative. */
  date: string;
  name: string;
  /** Who bathes on the principal window this day. */
  sects: string;
  cluster: GhatCluster;
  /** Primary bathing site(s) for the day. */
  site: string;
  /** One line a volunteer or pilgrim can act on. */
  guidance: string;
  /** Expect the heaviest inflow/outflow of the whole Mela. */
  peak: boolean;
}

export const CLUSTER_LABEL: Record<GhatCluster, string> = {
  nashik: "Nashik — Godavari ghats (Ramkund, Tapovan)",
  trimbakeshwar: "Trimbakeshwar — Kushavarta Kund",
  both: "both clusters (Nashik ghats and Trimbakeshwar)",
};

// Illustrative Simhastha 2027 principal bathing days.
export const SNAN_CALENDAR: SnanDay[] = [
  {
    date: "2027-08-31",
    name: "First Amrit Snan (Shravan Amavasya)",
    sects: "All akharas — Shaiva, Vaishnava and Udasin, in traditional order",
    cluster: "both",
    site: "Ramkund (Nashik) and Kushavarta (Trimbakeshwar)",
    guidance:
      "Heaviest day of the Mela. Akhara processions hold the ghat approaches; the public bathes after each procession passes. Expect inflow to peak beforehand and outflow after.",
    peak: true,
  },
  {
    date: "2027-09-11",
    name: "Vaishnava Amrit Snan",
    sects: "Vaishnava (Bairagi) akharas",
    cluster: "nashik",
    site: "Ramkund, Nashik",
    guidance:
      "Today's principal bathing is at Ramkund in Nashik for the Vaishnava akharas. Kushavarta Kund in Trimbakeshwar is the next day. Direct Trimbakeshwar-bound pilgrims to the shuttle corridor, not the Nashik ghats.",
    peak: true,
  },
  {
    date: "2027-09-12",
    name: "Shaiva Amrit Snan",
    sects: "Shaiva (Sanyasi / Naga) akharas",
    cluster: "trimbakeshwar",
    site: "Kushavarta Kund, Trimbakeshwar",
    guidance:
      "Today's principal bathing is at Kushavarta Kund in Trimbakeshwar for the Shaiva akharas. Ramkund runs at normal festival density. Park at the Trimbakeshwar cluster and walk the last stretch.",
    peak: true,
  },
  {
    date: "2027-09-26",
    name: "Closing Parva Snan",
    sects: "Open to all pilgrims (no akhara procession)",
    cluster: "both",
    site: "All ghats at both clusters",
    guidance:
      "No akhara procession — steady public bathing at all ghats. Follow the one-way lanes; keep bathing brief on the busiest ghats so others can take their turn.",
    peak: false,
  },
];

const DISCLAIMER =
  "Dates are the schedule Setu holds; the Mela authority confirms them on the notice boards.";

function toDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

export interface SnanBriefing {
  today?: SnanDay;
  next?: SnanDay;
  daysToNext?: number;
  schedule: SnanDay[];
  disclaimer: string;
}

/**
 * Briefing relative to `on`. In the prototype "today" comes from a fixed demo
 * date inside the Simhastha window so the "holy dip today" scenario always
 * resolves; pass a real date to override.
 */
export function getSnanBriefing(on: string = "2027-09-11"): SnanBriefing {
  const ref = toDate(on);
  const today = SNAN_CALENDAR.find((s) => s.date === on);
  const upcoming = SNAN_CALENDAR
    .filter((s) => toDate(s.date).getTime() >= ref.getTime() && s.date !== on)
    .sort((a, b) => a.date.localeCompare(b.date));
  const next = upcoming[0];
  const daysToNext = next
    ? Math.round((toDate(next.date).getTime() - ref.getTime()) / 86_400_000)
    : undefined;
  return { today, next, daysToNext, schedule: SNAN_CALENDAR, disclaimer: DISCLAIMER };
}

/** A short spoken/written answer to "where is the holy dip today?" */
export function snanAnswer(on?: string): string {
  const b = getSnanBriefing(on);
  const parts: string[] = [];
  if (b.today) {
    parts.push(
      `Today (${fmt(b.today.date)}) is the ${b.today.name}. ${b.today.sects} bathe at ${b.today.site}.`
    );
    if (b.next) {
      parts.push(
        `${b.next.name} is ${b.daysToNext === 1 ? "tomorrow" : `in ${b.daysToNext} days`} (${fmt(b.next.date)}) at ${b.next.site}.`
      );
    }
  } else if (b.next) {
    parts.push(
      `No principal bathing day today. The next is the ${b.next.name} on ${fmt(b.next.date)} (${b.daysToNext} days) — ${b.next.sects} at ${b.next.site}.`
    );
  } else {
    parts.push("No principal bathing day is scheduled in the window I have.");
  }
  parts.push(b.disclaimer);
  return parts.join(" ");
}

function fmt(iso: string): string {
  return toDate(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
