import { Section } from "./Section";

const segments = [
  { segment: "Large religious gatherings", buyer: "Event / authority organizers", value: "Unified coordination + safety workflows" },
  { segment: "Sports / concerts", buyer: "Venue / event operators", value: "Crowd visibility + incident response" },
  { segment: "Civic events", buyer: "Public authorities", value: "Shared situational awareness + resources" },
  { segment: "Disaster-relief operations", buyer: "Response organizations", value: "Task/resource coordination under change" },
];

export function ScaleSection() {
  return (
    <Section
      eyebrow="Why it scales"
      title="The same backbone works beyond one Kumbh."
      lede="The architecture — zones, incidents, tasks, volunteers, an explainable risk layer — is not specific to one event. The reusable unit is the coordination workflow, not the pilgrimage."
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-border rounded-sm overflow-hidden">
          <thead>
            <tr className="bg-surface-muted text-left text-[11px] uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3 font-medium">Segment</th>
              <th className="px-4 py-3 font-medium">Potential buyer</th>
              <th className="px-4 py-3 font-medium">Value proposition</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((s) => (
              <tr key={s.segment} className="border-t border-border bg-surface">
                <td className="px-4 py-3 font-medium text-ink">{s.segment}</td>
                <td className="px-4 py-3 text-ink-muted">{s.buyer}</td>
                <td className="px-4 py-3 text-ink-muted">{s.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-soft mt-4 max-w-2xl">
        Hypothesis, not a finalized plan: SaaS licensing to event organizers and state disaster-management authorities,
        priced per event or annually — to be validated with real buyers before any commercial claim is made.
      </p>
    </Section>
  );
}
