import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Section } from "./Section";

const roles: {
  href: string;
  name: string;
  tagline: string;
  points: string[];
  icon: IconName;
}[] = [
  {
    href: "/pilgrim",
    name: "Pilgrim",
    tagline: "Mobile-first — navigation, facilities and one-tap SOS.",
    points: ["Live map with facilities and crowd indication", "SOS in one confirmed tap", "Lost & found, ask-assistant, offline fallback"],
    icon: "pilgrim",
  },
  {
    href: "/field",
    name: "Volunteer",
    tagline: "Setu — a voice-first AI field companion, not a chat group.",
    points: [
      "Speak naturally: ask, translate, report, or act",
      "Live volunteer↔pilgrim translation (EN/हिं/मर/தமிழ்)",
      "Voice ground reports that reach the control room + Kumbh Pulse",
      "Task queue, accept/navigate/arrive/resolve",
    ],
    icon: "volunteer",
  },
  {
    href: "/management",
    name: "Management",
    tagline: "One control room, not five spreadsheets.",
    points: ["Live map, zone risk and active incidents", "Kumbh Pulse explainability on every alert", "Full audit trail for every transition"],
    icon: "management",
  },
];

export function RoleCards() {
  return (
    <Section
      id="roles"
      eyebrow="Three roles, one backbone"
      title="Three connected dashboards — one shared operational picture."
      lede="Each experience is purpose-built for its context — a stressed pilgrim, a marshal in the field, an operator scanning a control room — but every action on one dashboard updates the other two in real time, even across separate devices and browser tabs."
    >
      <div className="grid md:grid-cols-3 gap-4">
        {roles.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="group border border-border bg-surface rounded-sm p-6 hover:border-primary transition-colors"
          >
            <div className="h-10 w-10 rounded-sm bg-primary-soft flex items-center justify-center mb-5">
              <Icon name={r.icon} className="h-5 w-5 text-primary-dark" />
            </div>
            <div className="text-lg font-semibold text-ink">{r.name}</div>
            <p className="text-xs text-ink-muted mt-1.5">{r.tagline}</p>
            <ul className="mt-4 space-y-1.5">
              {r.points.map((p) => (
                <li key={p} className="text-xs text-ink-muted flex items-start gap-2">
                  <span className="h-1 w-1 rounded-full bg-ink-soft mt-1.5 shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary mt-5 pt-4 border-t border-border group-hover:text-primary-dark">
              Open {r.name} experience
              <Icon name="arrow-right" className="h-3.5 w-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
