import { ZONE_GEO } from "./seed";

/** Demo emergency SMS short code. A live deployment would use the Mela
 * disaster-management gateway number. */
export const EMERGENCY_SMS_SHORTCODE = "56070";

/**
 * Compact emergency packet for the low-bandwidth / cellular-jamming fallback
 * (mentor spec §6). Small enough for a single SMS:
 *   EMRG|LVL1|Z04|19.9317|73.5310|1772970631
 */
export function buildEmergencyPacket(
  zoneCode: string,
  zoneId: string,
  level: 1 | 2 | 3 = 1
): string {
  const geo = ZONE_GEO[zoneId] ?? [0, 0];
  const ts = Math.floor(Date.now() / 1000);
  return `EMRG|LVL${level}|${zoneCode}|${geo[0].toFixed(4)}|${geo[1].toFixed(4)}|${ts}`;
}

/** Cached, works-offline first-response cards — no network needed. */
export const OFFLINE_SOP: { id: string; title: string; steps: string[] }[] = [
  {
    id: "collapse",
    title: "Someone has collapsed",
    steps: [
      "Tap their shoulders and shout — check for any response.",
      "Not breathing normally: shout for help, start chest compressions — hard and fast, centre of the chest, don't stop.",
      "Breathing but unresponsive: roll them onto their side, tilt the head back to keep the airway open.",
      "Send someone to the nearest volunteer in a marked vest or a help desk.",
    ],
  },
  {
    id: "surge",
    title: "Crowd is surging",
    steps: [
      "Stay on your feet. If you fall, get up fast or curl on your side, arms over your head.",
      "Bring your arms up, hands at chest height, to keep space for your ribs to breathe.",
      "Move diagonally with the flow toward the edge — never push against it.",
      "Don't bend down to pick anything up.",
    ],
  },
  {
    id: "separated",
    title: "Separated from your group",
    steps: [
      "Go to your family-group meeting point and wait there.",
      "No meeting point set: stay exactly where you are so they can find you.",
      "Send one person to the nearest help desk with your group code (KS-####).",
      "Tell any volunteer — lost-and-found desks share reports across every zone.",
    ],
  },
];
