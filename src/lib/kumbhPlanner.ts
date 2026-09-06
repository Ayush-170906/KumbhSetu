// "Plan my Kumbh Mela" — a personalised pilgrim itinerary.
//
// Deterministic and rule-based (same honest approach as the rest of the app).
// It stitches together the illustrative snan calendar, the real Nashik
// infrastructure directory, and the group's needs into a day-by-day plan with a
// route and a safety checklist. Every timing defers to the Mela authority.

import type { LanguageCode } from "./types";
import { SNAN_CALENDAR, type SnanDay, type GhatCluster } from "./snanCalendar";
import { nearestPlace } from "./nashikDirectory";

export type StayBase = "nashik" | "trimbakeshwar" | "outside";

export interface KumbhPlanInput {
  fromDate: string; // ISO yyyy-mm-dd
  toDate: string;
  staying: StayBase;
  /** Target a principal Amrit Snan day, or a calmer bath. */
  wantShahiSnan: boolean;
  group: {
    size: number;
    elderly: boolean;
    children: boolean;
    wheelchair: boolean;
  };
  language: LanguageCode;
}

export interface PlanFacility {
  label: string;
  name: string;
  note?: string;
  mapUrl?: string;
}

export interface PlanDay {
  date: string;
  weekday: string;
  tag: "snan" | "travel" | "darshan" | "rest";
  title: string;
  items: string[];
}

export interface KumbhPlan {
  headline: string;
  targetCluster: GhatCluster;
  snanTarget?: { day: SnanDay; why: string; beReadyBy: string };
  days: PlanDay[];
  route: string[];
  facilities: PlanFacility[];
  checklist: string[];
  disclaimer: string;
}

// Cluster reference coordinates (from seed ZONE_GEO).
const CLUSTER_COORD: Record<Exclude<GhatCluster, "both">, [number, number]> = {
  nashik: [19.9997, 73.7898], // Ramkund
  trimbakeshwar: [19.9325, 73.532], // Kushavarta
};

const CLUSTER_NAME: Record<Exclude<GhatCluster, "both">, string> = {
  nashik: "Nashik (Ramkund / Godavari ghats)",
  trimbakeshwar: "Trimbakeshwar (Kushavarta Kund)",
};

function eachDate(from: string, to: string): string[] {
  const out: string[] = [];
  const d = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  if (isNaN(d.getTime()) || isNaN(end.getTime()) || end < d) return [from];
  let guard = 0;
  while (d <= end && guard++ < 40) {
    out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function weekday(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

/** Which single cluster this plan should centre on. */
function resolveCluster(snan: SnanDay | undefined, staying: StayBase): Exclude<GhatCluster, "both"> {
  if (snan && snan.cluster !== "both") return snan.cluster;
  if (staying === "trimbakeshwar") return "trimbakeshwar";
  return "nashik";
}

export function buildKumbhPlan(input: KumbhPlanInput): KumbhPlan {
  const dates = eachDate(input.fromDate, input.toDate);
  const inRange = SNAN_CALENDAR.filter((s) => dates.includes(s.date));
  const targetSnan = input.wantShahiSnan ? inRange.find((s) => s.peak) ?? inRange[0] : undefined;
  const cluster = resolveCluster(targetSnan, input.staying);
  const [lat, lng] = CLUSTER_COORD[cluster];
  const assisted = input.group.elderly || input.group.wheelchair;

  // ---- headline ------------------------------------------------------------
  let headline: string;
  if (targetSnan) {
    headline = `You're set for the ${targetSnan.name} at ${targetSnan.site} on ${weekday(targetSnan.date)}.`;
  } else if (inRange.length > 0 && !input.wantShahiSnan) {
    headline = `Your dates include a principal bathing day — this plan keeps you to the calmer windows around it.`;
  } else {
    headline = `A calm bathing and darshan plan for ${CLUSTER_NAME[cluster]}.`;
  }

  // ---- snan target detail -----------------------------------------------
  const snanTarget = targetSnan
    ? {
        day: targetSnan,
        why:
          targetSnan.cluster === "both"
            ? "All akharas process on this day; the public bathes after each procession passes."
            : `On this day the principal bathing is at ${CLUSTER_NAME[targetSnan.cluster]} — the other cluster runs at normal festival density.`,
        beReadyBy:
          "Be at the ghat approach about two hours before the muhurat. Inflow peaks before it and outflow peaks after — plan a slow exit.",
      }
    : undefined;

  // ---- day-by-day ------------------------------------------------------
  const days: PlanDay[] = dates.map((date, i) => {
    const snan = SNAN_CALENDAR.find((s) => s.date === date);
    const first = i === 0;
    const last = i === dates.length - 1;

    if (snan && (targetSnan?.date === date || (!targetSnan && snan.peak))) {
      return {
        date,
        weekday: weekday(date),
        tag: "snan",
        title: `Snan day — ${snan.name}`,
        items: [
          `Bathe at ${snan.site}. ${snan.guidance}`,
          assisted
            ? "Use the priority lane for elderly and divyang pilgrims — Help Desk staff can escort. Request a wheelchair at the zone Help Desk if needed."
            : "Follow the one-way lanes; keep bathing brief so others can take their turn.",
          input.group.children ? "Hold children by the hand on the steps and near the water at all times." : "Keep valuables in a front pouch; leave large bags at a cloakroom.",
          "Agree a fixed meeting point with your group before you go in.",
        ],
      };
    }
    if (snan) {
      return {
        date,
        weekday: weekday(date),
        tag: "travel",
        title: `${snan.name} today — not your bathing day`,
        items: [
          `Today's principal bathing is at ${snan.site}. If you are not going there, avoid its approaches and the shuttle corridor around the peak window.`,
          "A good day for darshan or rest near your accommodation.",
        ],
      };
    }
    if (first) {
      return {
        date,
        weekday: weekday(date),
        tag: "rest",
        title: "Arrival & orientation",
        items: [
          `Settle in near ${CLUSTER_NAME[cluster]}. Walk your route to the ghat once, in daylight, so it's familiar.`,
          "Find your nearest Help Desk, medical camp and water point (listed below).",
          "Leave large luggage at a cloakroom near the transit point — carry only ID, phone, a little cash and medication.",
        ],
      };
    }
    if (last) {
      return {
        date,
        weekday: weekday(date),
        tag: "rest",
        title: "Departure",
        items: [
          "Leave early — roads and the shuttle corridor are busiest late morning.",
          "Collect anything left at the cloakroom; keep the token handy.",
        ],
      };
    }
    return {
      date,
      weekday: weekday(date),
      tag: "darshan",
      title: cluster === "trimbakeshwar" ? "Darshan & a calm bath" : "A calm bath & exploring",
      items: [
        cluster === "trimbakeshwar"
          ? "Trimbakeshwar Jyotirlinga darshan — queues are shortest early morning and after the aarti rush."
          : "A quieter bath at Ramkund or Tapovan is easiest between the main windows (mid-morning to mid-afternoon).",
        "Rest in shade in the hottest hours (roughly 11:00–16:00); drink water from marked points only.",
      ],
    };
  });

  // ---- route ---------------------------------------------------------
  const route: string[] = [];
  if (input.staying === "outside") {
    route.push(`Park in the signed parking zone for the ${cluster === "nashik" ? "Nashik" : "Trimbakeshwar"} cluster — private vehicles are not allowed on ghat approaches during snan windows.`);
    route.push("Take the shuttle along the transit corridor for the main stretch.");
    route.push("Walk the last section following the one-way lanes and volunteer directions.");
  } else if (input.staying === "nashik" && cluster === "trimbakeshwar") {
    route.push("Take the shuttle from the Nashik ghats to the Trimbakeshwar cluster along the transit corridor (~30 km) — start early on a snan day.");
    route.push("Walk the last section to Kushavarta Kund following the marked lanes.");
  } else if (input.staying === "trimbakeshwar" && cluster === "nashik") {
    route.push("Take the shuttle from Trimbakeshwar to the Nashik ghats along the transit corridor (~30 km) — start early on a snan day.");
    route.push("Walk to Ramkund following the one-way lanes.");
  } else {
    route.push(`Walk or take a short shuttle to ${CLUSTER_NAME[cluster]}; follow the one-way lanes near the ghat.`);
  }
  if (assisted) {
    route.push("At the ghat, use the priority lane for elderly and divyang pilgrims — it is signed and Help Desk staff can escort.");
  }

  // ---- nearest real facilities (Nashik Monitor data) --------------------
  const facilities: PlanFacility[] = [];
  const add = (label: string, group: Parameters<typeof nearestPlace>[0], fallbackNote?: string) => {
    const hit = nearestPlace(group, lat, lng);
    if (hit) {
      facilities.push({
        label,
        name: hit.place.name,
        note: `${hit.km.toFixed(1)} km from ${cluster === "nashik" ? "Ramkund" : "Kushavarta"}${hit.place.address ? ` · ${hit.place.address}` : ""}`,
        mapUrl: `https://www.google.com/maps?q=${hit.place.lat},${hit.place.lng}`,
      });
    } else if (fallbackNote) {
      facilities.push({ label, name: fallbackNote });
    }
  };
  add("Nearest hospital", "medical");
  add("Nearest public toilet", "sanitation");
  add("Nearest police station", "safety");
  add("Parking / transport", "transport");
  facilities.push({
    label: "Luggage",
    name: "Cloakroom near the transit point",
    note: "Leave large bags here; carry only essentials to the ghat.",
  });

  // ---- checklist ----------------------------------------------------
  const checklist: string[] = [
    "Carry a valid photo ID.",
    "Firm footwear you can walk long distances in.",
    "Drink water often — only from marked water points or sealed bottles.",
    "Agree a fixed meeting point with your group in case you are separated.",
    "No single-use plastic; use the bins and keep the ghats clean.",
  ];
  if (input.group.children) {
    checklist.unshift("Write your name and mobile number on a band inside each child's clothing before you set out.");
    checklist.push("Hold small children by the hand at the ghats and on stairs at all times.");
  }
  if (assisted) {
    checklist.push("Request a wheelchair at the zone Help Desk; use the elderly / divyang priority lanes; avoid the snan peak window.");
    checklist.push("Never leave a mobility-limited pilgrim alone in a dense area.");
  }
  if (targetSnan) {
    checklist.push("On the snan day, keep valuables minimal and bathe briefly — the ghat is at its busiest.");
  }

  return {
    headline,
    targetCluster: cluster,
    snanTarget,
    days,
    route,
    facilities,
    checklist,
    disclaimer:
      "Bathing-day timings are the schedule Setu holds — the Mela authority confirms them on the notice boards. Facilities are from Nashik Monitor open data.",
  };
}
