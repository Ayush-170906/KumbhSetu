// Verified public emergency contacts. These are not Kumbh Setu dispatch lines.

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
    note: "India's national emergency response number.",
    icon: "shield",
    kind: "emergency",
  },
  {
    id: "women-child",
    label: "Child Helpline",
    number: "1098",
    note: "Child protection and assistance.",
    icon: "pilgrim",
    kind: "desk",
  },
];
