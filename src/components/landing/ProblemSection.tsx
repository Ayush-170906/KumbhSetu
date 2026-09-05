import { Icon, type IconName } from "@/components/ui/Icon";
import { Section } from "./Section";

const jobs: { role: string; job: string; gap: string; icon: IconName }[] = [
  { role: "Pilgrim", job: "Find safe routes, facilities and assistance quickly", gap: "Fragmented information, limited real-time visibility", icon: "pilgrim" },
  { role: "Volunteer / Marshal", job: "Know where help is needed and respond efficiently", gap: "Manual, WhatsApp- and radio-heavy coordination", icon: "volunteer" },
  { role: "Management", job: "See incidents, risk and resources in one operational view", gap: "Delayed, incomplete information across channels", icon: "management" },
];

export function ProblemSection() {
  return (
    <Section
      eyebrow="The problem"
      title="A mass gathering should not run on disconnected tools."
      lede="Large public gatherings compound two problems: app fragmentation, and no shared real-time link between the public, the field workforce and the control room. A pilgrim's distress signal, a volunteer's availability and a management decision end up as three separate events instead of one continuous operational thread."
    >
      <div className="grid md:grid-cols-3 gap-4">
        {jobs.map((j) => (
          <div key={j.role} className="border border-border bg-surface rounded-sm p-5">
            <div className="h-9 w-9 rounded-sm bg-surface-muted flex items-center justify-center mb-4">
              <Icon name={j.icon} className="h-4 w-4 text-ink-muted" />
            </div>
            <div className="text-sm font-semibold text-ink">{j.role}</div>
            <p className="text-xs text-ink-muted mt-2 leading-relaxed">{j.job}</p>
            <div className="text-[11px] text-primary-dark mt-3 pt-3 border-t border-border">
              Current gap: {j.gap}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
