import { Section } from "./Section";

const phases = [
  { phase: "P0", label: "Foundation", detail: "Workflows, architecture, roles, data model", status: "done" },
  { phase: "P1", label: "Demo MVP", detail: "Incident → dispatch → management loop, live", status: "current" },
  { phase: "P2", label: "Stakeholder validation", detail: "Test workflows with domain experts", status: "next" },
  { phase: "P3", label: "Controlled pilot", detail: "Operate in one limited zone / use case", status: "next" },
  { phase: "P4", label: "Scale", detail: "More zones, integrations, governance, SLA", status: "next" },
];

export function PilotSection() {
  return (
    <Section
      eyebrow="Pilot vision"
      title="This is a foundation build — not a claim of deployment readiness."
      lede="Kumbh Setu will not be presented as production-ready until a controlled pilot has demonstrated technical reliability, usable workflows, acceptable safety behavior, authorized data handling and stakeholder acceptance."
    >
      <div className="flex flex-col md:flex-row gap-0 md:gap-0 border border-border rounded-sm overflow-hidden">
        {phases.map((p, idx) => (
          <div
            key={p.phase}
            className={`flex-1 p-5 ${idx > 0 ? "border-t md:border-t-0 md:border-l border-border" : ""} ${
              p.status === "current" ? "bg-primary-soft/40" : "bg-surface"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono-num text-xs font-semibold text-primary-dark">{p.phase}</span>
              {p.status === "current" && (
                <span className="text-[9.5px] uppercase tracking-wide bg-primary text-white rounded-sm px-1.5 py-0.5">
                  This build
                </span>
              )}
            </div>
            <div className="text-sm font-semibold text-ink">{p.label}</div>
            <p className="text-xs text-ink-muted mt-1.5 leading-relaxed">{p.detail}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
