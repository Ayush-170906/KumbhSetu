import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Section } from "./Section";

const steps = [
  "A pilgrim tries the sample SOS flow, or an operator creates a demo incident.",
  "The local prototype records sample location, severity, time and status.",
  "The demo identifies an eligible sample volunteer in the selected zone.",
  "The volunteer demo shows the task for acknowledgement and response actions.",
  "The management view displays the incident and demo status transitions in this browser.",
  "The volunteer marks the task resolved — or escalates it.",
  "The local prototype records a sample activity timeline.",
];

export function GoldenPathSection() {
  return (
    <Section
      eyebrow="The connected response loop"
      title="Explore one response workflow across three roles."
      lede="Use the guided prototype to see how a sample report, volunteer task and management view can relate. No emergency service or authority is contacted."
    >
      <ol className="space-y-0 max-w-2xl">
        {steps.map((s, idx) => (
          <li key={s} className="flex gap-4 py-3.5 border-b border-border last:border-0">
            <span className="font-mono-num text-xs text-primary-dark shrink-0 w-6 pt-0.5">{String(idx + 1).padStart(2, "0")}</span>
            <span className="text-sm text-ink-muted">{s}</span>
          </li>
        ))}
      </ol>
      <div className="mt-8">
        <Link href="/demo">
          <Button>Open guided demo</Button>
        </Link>
      </div>
    </Section>
  );
}
