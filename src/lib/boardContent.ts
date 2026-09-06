// Static editorial content for the Common Operations Board — news / bulletins
// and the always-visible "important instructions". Illustrative for the demo;
// the live board would pull news from the authority's feed.

export interface BulletinItem {
  id: string;
  date: string; // "2027-09-10"
  kind: "news" | "notice" | "report";
  title: string;
  body: string;
  source: string;
}

export const BULLETINS: BulletinItem[] = [
  {
    id: "b-1",
    date: "2027-09-10",
    kind: "notice",
    title: "Vehicle ban in the ghat core from 04:00 on Amrit Snan day",
    body: "Private vehicles will not be allowed past the outer ring on the principal bathing day. Use the park-and-ride grounds; shuttle buses run to all entry gates from 03:00.",
    source: "Kumbh Control Room",
  },
  {
    id: "b-2",
    date: "2027-09-09",
    kind: "news",
    title: "Additional 12 special trains cleared for Mela week",
    body: "Railways have notified extra services to Nashik Road from Mumbai, Pune, Bhusaval and Manmad. Reservation counters at Nashik Road are open 24×7 through the Parva.",
    source: "Divisional Railway Manager (illustrative)",
  },
  {
    id: "b-3",
    date: "2027-09-09",
    kind: "report",
    title: "Health camps: 9,400 pilgrims seen in 24 hours",
    body: "Most visits were for heat exhaustion, minor injuries and blood-pressure checks. ORS and shade points have been doubled along the Tapovan approach.",
    source: "Mela Health Wing (illustrative)",
  },
  {
    id: "b-4",
    date: "2027-09-08",
    kind: "notice",
    title: "One-way pedestrian loop enforced at Ramkund",
    body: "Entry via Gate 2 / Gate 4 (orange lanes), exit via Gate 1 / Gate 3 (green lanes). Do not re-enter against the flow — marshals will redirect you the long way round.",
    source: "Kumbh Control Room",
  },
  {
    id: "b-5",
    date: "2027-09-07",
    kind: "news",
    title: "Lost-and-found desks now at every zone, linked to a central register",
    body: "Report a separated family member at the nearest help desk. Photographs and descriptions are shared across all desks and with the control room in real time.",
    source: "NTKMA (illustrative)",
  },
];

export interface InstructionGroup {
  heading: string;
  tone: "do" | "dont" | "emergency";
  items: string[];
}

export const IMPORTANT_INSTRUCTIONS: InstructionGroup[] = [
  {
    heading: "Do",
    tone: "do",
    items: [
      "Fix a family meeting point — a named gate or tower — before you enter the crowd.",
      "Keep children's hand-bands or a card with a phone number on every child and elderly person.",
      "Follow the coloured lane markings and the marshals. The long way round is the safe way.",
      "Carry water, ORS, any regular medicines, and a small torch.",
      "Move off the ghat steps quickly after bathing so others can take their turn.",
    ],
  },
  {
    heading: "Don't",
    tone: "dont",
    items: [
      "Don't stop or sit down inside a moving crowd — step to the side first.",
      "Don't push against the flow or climb barricades, railings or poles for a better view.",
      "Don't cross an akhara procession route — watch only from the marked public areas.",
      "Don't use soap, oil or shampoo in the river.",
      "Don't rely on mobile data near the ghats on peak days — agree plans in advance.",
    ],
  },
  {
    heading: "In an emergency",
    tone: "emergency",
    items: [
      "Call 112 (all emergencies) or 108 (ambulance). For a lost child, call 1098.",
      "Raise an SOS in the Kumbh Setu pilgrim app — it sends your location to the control room.",
      "Go to the nearest help desk or any volunteer in a marked vest.",
      "If a crowd surge starts: stay upright, keep your arms up at chest height, move diagonally toward the edge with the flow — not against it.",
    ],
  },
];
