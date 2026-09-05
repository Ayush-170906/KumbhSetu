import type { SVGProps } from "react";

export type IconName =
  | "map-pin"
  | "sos"
  | "medical"
  | "water"
  | "toilet"
  | "food"
  | "parking"
  | "help-desk"
  | "volunteer"
  | "management"
  | "pilgrim"
  | "pulse"
  | "chevron-right"
  | "chevron-down"
  | "close"
  | "check"
  | "clock"
  | "phone"
  | "qr"
  | "search"
  | "arrow-right"
  | "arrow-up-right"
  | "wifi-off"
  | "shield"
  | "route"
  | "lost"
  | "bell"
  | "layers"
  | "chart"
  | "log"
  | "target"
  | "warning"
  | "navigation";

const paths: Record<IconName, string> = {
  "map-pin": "M12 22s7-6.5 7-12.5A7 7 0 0 0 5 9.5C5 15.5 12 22 12 22Zm0-9a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z",
  sos: "M12 2v6M12 16v6M4.9 4.9l4.2 4.2M14.9 14.9l4.2 4.2M2 12h6M16 12h6M4.9 19.1l4.2-4.2M14.9 9.1l4.2-4.2",
  medical: "M9 3h6v4h4v6h-4v4H9v-4H5V7h4V3Zm0 6H5m8-6v10",
  water: "M12 2s6 7.2 6 12a6 6 0 1 1-12 0c0-4.8 6-12 6-12Z",
  toilet: "M7 3h10v6a5 5 0 0 1-4 4.9V17h2v4H9v-4h2v-3.1A5 5 0 0 1 7 9V3Z",
  food: "M5 3v7a3 3 0 0 0 3 3v8M5 3v4M8 3v4M11 3v7M20 3c-2 1-3 3-3 6s1 4 3 5v7",
  parking: "M6 21V3h6.5a4.5 4.5 0 1 1 0 9H9v9M9 12V6h3.5",
  "help-desk": "M4 19V8a2 2 0 0 1 2-2h6l4 4h4v9H4Zm7-9V5",
  volunteer: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0M17 8l1.5 1.5L21 7",
  management: "M4 20V10l8-6 8 6v10h-5v-6H9v6H4Z",
  pilgrim: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6 9c1-4 3.5-6 6-6s5 2 6 6",
  pulse: "M2 12h4l2-7 4 14 3-9 2 4h5",
  "chevron-right": "M9 5l7 7-7 7",
  "chevron-down": "M5 9l7 7 7-7",
  close: "M6 6l12 12M18 6L6 18",
  check: "M5 13l4 4L19 7",
  clock: "M12 7v5l3.5 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  phone: "M6 3h3l1.5 4.5L8 9.5a12 12 0 0 0 6.5 6.5l2-2.5L21 15v3a2 2 0 0 1-2 2C10.5 20 4 13.5 4 5a2 2 0 0 1 2-2Z",
  qr: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 3h3m3 0v3m-6-3v3m6-6h-6",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM21 21l-4.35-4.35",
  "arrow-right": "M5 12h14M13 6l6 6-6 6",
  "arrow-up-right": "M7 17L17 7M8 7h9v9",
  "wifi-off": "M2 8.5c2.8-2.2 6.2-3.5 10-3.5s7.2 1.3 10 3.5M5 12.5a11 11 0 0 1 5.5-2.9M18.9 12.4a11 11 0 0 0-2.8-1.7M8.5 16.3a6 6 0 0 1 7 0M12 20h.01M3 3l18 18",
  shield: "M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z",
  route: "M5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm14-14a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM7 17c6 0 4-12 10-12",
  lost: "M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11Zm-2-9l4 4m0-4l-4 4",
  bell: "M6 8a6 6 0 1 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Zm4 10a2 2 0 0 0 4 0",
  layers: "M12 3l9 5-9 5-9-5 9-5Zm-9 9l9 5 9-5M3 16l9 5 9-5",
  chart: "M4 20V10m6 10V4m6 16v-7",
  log: "M4 5h16M4 12h16M4 19h10",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-2.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  warning: "M12 3L2 20h20L12 3Zm0 6v5m0 3h.01",
  navigation: "M3 11l18-8-8 18-2-8-8-2Z",
};

export function Icon({
  name,
  className,
  strokeWidth = 1.6,
  ...rest
}: { name: IconName; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  );
}
