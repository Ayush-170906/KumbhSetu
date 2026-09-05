import type { FacilityType } from "@/lib/types";
import type { IconName } from "@/components/ui/Icon";

export function facilityIconName(type: FacilityType): IconName {
  switch (type) {
    case "medical":
      return "medical";
    case "water":
      return "water";
    case "toilet":
      return "toilet";
    case "food":
      return "food";
    case "parking":
      return "parking";
    case "help_desk":
      return "help-desk";
  }
}

export function facilityLabel(type: FacilityType): string {
  switch (type) {
    case "medical":
      return "Medical Camp";
    case "water":
      return "Water Point";
    case "toilet":
      return "Sanitation";
    case "food":
      return "Food / Langar";
    case "parking":
      return "Parking";
    case "help_desk":
      return "Help Desk";
  }
}
