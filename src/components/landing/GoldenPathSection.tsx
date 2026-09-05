import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Section } from "./Section";

const steps = [
  "A pilgrim raises an SOS, or an operator creates an incident manually.",
  "The backend creates an incident with location, severity, timestamp and status.",
  "The system identifies eligible available volunteers in the relevant zone.",
  "The nearest available volunteer receives the task and accepts it.",
  "Management sees the incident, assignment and every status transition live.",
  "The volunteer marks the task resolved — or escalates it.",
  "The response timeline is recorded for measurement and audit.",
];

export function GoldenPathSection() {
  return (
    <Section
      eyebrow="The connected response loop"
      title="One golden path, proven end-to-end — not a feature list."
      lede="The first product objective is not to build every possible Kumbh feature. It is to prove one high-value, safety-critical workflow completely, across all three roles, with a shared, auditable state."
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
          <Button>Watch it run — Live Demo</Button>
        </Link>
      </div>
    </Section>
  );
}
