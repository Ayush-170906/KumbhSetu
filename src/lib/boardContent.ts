// Static example content for the Common Operations Board. These are not
// current notices or statements issued by an authority.

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
    date: "Example",
    kind: "notice",
    title: "Sample: route or access update",
    body: "This space can show an approved route notice when an official source is connected. Confirm current access arrangements with local authorities.",
    source: "Illustrative only · not an official notice",
  },
  {
    id: "b-2",
    date: "Example",
    kind: "news",
    title: "Sample: transport information",
    body: "Service changes should be checked with the relevant transport operator before travel.",
    source: "Illustrative only · not an official notice",
  },
  {
    id: "b-3",
    date: "Example",
    kind: "report",
    title: "Sample: medical support update",
    body: "For immediate medical assistance, call 108 or 112. This prototype does not show live facility status.",
    source: "Illustrative only · not an official notice",
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
      "The Kumbh Setu SOS is a local prototype and does not contact responders. Call 112 for urgent help.",
      "Go to the nearest help desk or any volunteer in a marked vest.",
      "If a crowd surge starts: stay upright, keep your arms up at chest height, move diagonally toward the edge with the flow — not against it.",
    ],
  },
];
