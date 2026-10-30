import { Icon } from "@/components/ui/Icon";

const principles = [
  ["Approved source", "Connect only a formally approved camera or sensor source with documented purpose and access."],
  ["Human review", "An authorized operator reviews any signal; automated output must never be treated as a verified event."],
  ["Accountable action", "Record a confirmed operational decision with its source, reviewer and follow-up."],
] as const;

export function SecurityView() {
  return (
    <div className="p-5 md:p-6 max-w-5xl">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">Future capability · concept only</p>
      <h1 className="font-editorial text-2xl text-ink mt-1">Security integrations</h1>
      <p className="text-sm text-ink-muted mt-2 max-w-2xl leading-relaxed">
        Kumbh Setu is not connected to CCTV or security systems. No footage, camera inventory,
        detections or security analytics are available in this prototype.
      </p>

      <section className="mt-6 border border-status-amber-border bg-status-amber-bg/60 p-4" role="note">
        <div className="flex gap-3">
          <Icon name="warning" className="h-5 w-5 text-status-amber shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-semibold text-ink">No live security data</h2>
            <p className="text-sm text-ink-muted mt-1">This page contains no camera feeds or simulated threat alerts. It describes safeguards required before a future integration.</p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">Integration safeguards</p>
        <h2 className="font-editorial text-xl text-ink mt-1">A careful path to operational use</h2>
        <div className="mt-4 divide-y divide-border border-y border-border">
          {principles.map(([title, detail], index) => (
            <article key={title} className="grid grid-cols-[2.5rem_1fr] gap-3 py-4">
              <span className="font-mono-num text-sm text-primary-dark">0{index + 1}</span>
              <div>
                <h3 className="text-sm font-semibold text-ink">{title}</h3>
                <p className="text-sm text-ink-muted mt-1 max-w-2xl">{detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
