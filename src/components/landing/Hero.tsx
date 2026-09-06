import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SimTag } from "@/components/ui/SimTag";
import { LoopDiagram } from "./LoopDiagram";

export function Hero() {
  return (
    <section className="border-b border-border">
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-14 md:pt-24 md:pb-20">
        <SimTag label="PROTOTYPE · CONCEPT DEMONSTRATION" />
        <h1 className="font-editorial text-4xl md:text-6xl leading-[1.05] text-ink mt-5 max-w-3xl">
          One connected platform for pilgrims, volunteers &amp; management.
        </h1>
        <p className="text-base md:text-lg text-ink-muted max-w-2xl mt-5 leading-relaxed">
          Built for the Nashik–Trimbakeshwar Simhastha Kumbh Mela 2027: Kumbh Setu turns fragmented information at
          a large public gathering into a coordinated response layer — a report becomes a task, a task becomes a
          response, and a response becomes operational intelligence.
        </p>
        <p className="text-xs text-ink-soft max-w-2xl mt-3">
          Real GIS reference layer sourced from{" "}
          <a href="https://github.com/tanmayk1234/nashik-monitor-v2" target="_blank" rel="noreferrer" className="underline hover:text-ink-muted">
            Nashik Monitor
          </a>{" "}
          (NTKMA open data) — simulated incidents and crowd signals sit on top of real ghat, hospital and police
          reference points.
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-8">
          <Link href="/">
            <Button size="lg">Choose your role</Button>
          </Link>
          <Link href="/demo">
            <Button size="lg" variant="outline">Run Live Demo</Button>
          </Link>
        </div>

        <div className="mt-14">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft mb-3">
            The operational loop
          </div>
          <LoopDiagram />
        </div>
      </div>
    </section>
  );
}
