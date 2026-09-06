// Contact centre entries for the Common Operations Board.
// These numbers are the standard national / illustrative helplines shown for
// the demo. Confirm the live Simhastha 2027 control-room and desk numbers with
// NTKMA before any real deployment.

import type { IconName } from "@/components/ui/Icon";

export interface ContactEntry {
  id: string;
  label: string;
  number: string;
  note: string;
  icon: IconName;
  kind: "emergency" | "desk";
}

export const CONTACT_CENTRE: ContactEntry[] = [
  {
    id: "control-room",
    label: "Kumbh Control Room",
    number: "1800-000-2027",
    note: "24×7 operations desk — routes to the on-duty magistrate.",
    icon: "management",
    kind: "emergency",
  },
  {
    id: "ambulance",
    label: "Medical / Ambulance",
    number: "108",
    note: "Free emergency ambulance (Maharashtra 108 service).",
    icon: "medical",
    kind: "emergency",
  },
  {
    id: "police",
    label: "Police / Emergency",
    number: "112",
    note: "Single national emergency number — police, fire, disaster.",
    icon: "shield",
    kind: "emergency",
  },
  {
    id: "tourist",
    label: "Tourist Helpline",
    number: "1363",
    note: "Ministry of Tourism, multilingual, 24×7.",
    icon: "help-desk",
    kind: "emergency",
  },
  {
    id: "lost-found",
    label: "Lost & Found Desk",
    number: "1800-000-1947",
    note: "Report or claim a separated family member or lost item.",
    icon: "lost",
    kind: "desk",
  },
  {
    id: "women-child",
    label: "Women & Child Help",
    number: "1098",
    note: "Childline India — for unaccompanied or distressed children.",
    icon: "pilgrim",
    kind: "desk",
  },
];
