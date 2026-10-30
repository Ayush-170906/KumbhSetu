import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { SimTag } from "@/components/ui/SimTag";
import { KUMBH_IMAGES } from "@/lib/kumbhImagery";
import { LoopDiagram } from "./LoopDiagram";

export function Hero() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-5 pb-14 pt-16 sm:px-8 md:pb-20 md:pt-24">
        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_.9fr] lg:gap-12">
          <div>
            <SimTag label="PROTOTYPE · CONCEPT DEMONSTRATION" />
            <h1 className="font-editorial mt-5 max-w-3xl text-4xl leading-[1.05] text-ink md:text-6xl">
              Connect the field to the control room.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-muted md:text-lg">
              Built for the Nashik–Trimbakeshwar Simhastha Kumbh Mela 2027, Kumbh Setu links pilgrim reports,
              volunteer response and control-room decisions in one coordinated workflow.
            </p>
            <p className="mt-3 max-w-2xl text-xs text-ink-soft">
              GIS reference points come from{" "}
              <a href="https://github.com/tanmayk1234/nashik-monitor-v2" target="_blank" rel="noreferrer" className="underline hover:text-ink-muted">
                Nashik Monitor
              </a>{" "}
              (NTKMA open data); incidents and crowd signals are simulated.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/">
                <Button size="lg">Explore the platform</Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline">Run guided demo</Button>
              </Link>
            </div>
          </div>

          <figure className="relative min-h-56 overflow-hidden border border-border bg-surface-muted sm:min-h-72">
            <Image
              src={KUMBH_IMAGES.temple.src}
              alt={KUMBH_IMAGES.temple.alt}
              fill
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="object-cover"
              style={{ objectPosition: KUMBH_IMAGES.temple.focus }}
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-ink/75 px-3 py-2 text-[10px] text-white">
              Trimbakeshwar Temple · <a href={KUMBH_IMAGES.temple.source} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-white">{KUMBH_IMAGES.temple.credit}</a> · Reference photography, not an operational image
            </figcaption>
          </figure>
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
