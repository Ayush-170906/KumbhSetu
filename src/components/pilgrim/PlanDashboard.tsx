"use client";

import { useState } from "react";
import Link from "next/link";
import type { LanguageCode } from "@/lib/types";
import {
  GUIDE_SECTIONS,
  KUMBH_RESOURCES,
  GUIDE_DISCLAIMER,
  type GuideCard,
  type GuideSection,
} from "@/lib/kumbhGuide";
import { SNAN_CALENDAR, CLUSTER_LABEL } from "@/lib/snanCalendar";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SimTag } from "@/components/ui/SimTag";
import { PlanScreen } from "./PlanScreen";

type TabId = "itinerary" | GuideSection["id"] | "resources";

const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: "itinerary", label: "Itinerary", icon: "route" },
  ...GUIDE_SECTIONS.map((s) => ({ id: s.id as TabId, label: s.label, icon: s.icon as IconName })),
  { id: "resources", label: "Resources", icon: "layers" },
];

export function PlanDashboard({ language }: { language: LanguageCode }) {
  const [tab, setTab] = useState<TabId>("itinerary");

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="shrink-0 border-b border-border bg-surface overflow-x-auto scroll-thin">
        <div className="flex min-w-max">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === t.id
                  ? "border-primary text-primary-dark"
                  : "border-transparent text-ink-soft hover:text-ink-muted"
              }`}
            >
              <Icon name={t.icon} className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "itinerary" && <PlanScreen language={language} />}

      {GUIDE_SECTIONS.filter((s) => s.id === tab).map((s) => (
        <div key={s.id} className="flex-1 overflow-y-auto scroll-thin p-4 space-y-3 pb-8">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-ink-muted leading-relaxed">{s.intro}</p>
            <SimTag label="GUIDE" />
          </div>
          {s.id === "darshan" && <SnanScheduleStrip />}
          {s.cards.map((c, i) => (
            <GuideCardView key={i} card={c} />
          ))}
          <p className="text-[10px] text-ink-soft leading-relaxed pt-1">{GUIDE_DISCLAIMER}</p>
        </div>
      ))}

      {tab === "resources" && (
        <div className="flex-1 overflow-y-auto scroll-thin p-4 space-y-4 pb-8">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-ink-muted leading-relaxed">
              Every Kumbh portal, live map, language tool and helpline in one place. Once the official
              Simhastha 2027 portal is live, treat it as the final word on dates and rules.
            </p>
            <SimTag label="LINKS" />
          </div>
          {KUMBH_RESOURCES.map((g) => (
            <div key={g.title}>
              <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft mb-2">
                {g.title}
              </div>
              <div className="space-y-1.5">
                {g.entries.map((e) => {
                  const internal = e.href.startsWith("/");
                  const inner = (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-ink">{e.label}</span>
                        {e.tentative && (
                          <span className="text-[9px] uppercase tracking-wide text-ink-soft border border-border rounded-sm px-1">
                            verify
                          </span>
                        )}
                        {!internal && (
                          <Icon name="arrow-up-right" className="h-3 w-3 text-ink-soft" />
                        )}
                      </div>
                      <div className="text-[11px] text-ink-soft mt-0.5 leading-snug">{e.note}</div>
                    </>
                  );
                  return internal ? (
                    <Link
                      key={e.label}
                      href={e.href}
                      className="block rounded-sm border border-border bg-surface px-3 py-2 hover:border-primary transition-colors"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <a
                      key={e.label}
                      href={e.href}
                      target={e.href.startsWith("tel:") ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      className="block rounded-sm border border-border bg-surface px-3 py-2 hover:border-primary transition-colors"
                    >
                      {inner}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
          <p className="text-[10px] text-ink-soft leading-relaxed pt-1">{GUIDE_DISCLAIMER}</p>
        </div>
      )}
    </div>
  );
}

function GuideCardView({ card }: { card: GuideCard }) {
  return (
    <div className="rounded-sm border border-border bg-surface p-3">
      <div className="text-sm font-semibold text-ink">{card.title}</div>
      <p className="text-xs text-ink-muted mt-1 leading-relaxed">{card.body}</p>

      {card.official && (
        <div className="mt-2 flex items-start gap-1.5 rounded-sm bg-status-amber-bg/60 px-2 py-1.5 text-[11px] text-status-amber">
          <Icon name="bell" className="h-3.5 w-3.5 shrink-0 mt-px" />
          Exact routes / timings are set by the Mela authority — confirm on the official portal and
          on-site signage.
        </div>
      )}

      {card.tips && card.tips.length > 0 && (
        <ul className="mt-2 space-y-1">
          {card.tips.map((tip, i) => (
            <li key={i} className="text-[11px] text-ink-muted flex gap-1.5">
              <Icon name="check" className="h-3 w-3 text-status-green shrink-0 mt-0.5" />
              {tip}
            </li>
          ))}
        </ul>
      )}

      {card.links && card.links.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {card.links.map((l) => (
            <a
              key={l.href + l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-sm border border-border bg-surface-muted/50 px-2 py-1 text-[11px] text-primary hover:text-primary-dark hover:border-primary transition-colors"
            >
              {l.label}
              {l.tentative && <span className="text-ink-soft">(verify)</span>}
              <Icon name="arrow-up-right" className="h-3 w-3" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/** Compact reference of the principal bathing days, for the Darshan tab. */
export function SnanScheduleStrip() {
  return (
    <div className="rounded-sm border border-primary-soft bg-primary-soft/30 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-primary-soft-ink mb-2">
        Principal bathing days (illustrative)
      </div>
      <div className="space-y-1.5">
        {SNAN_CALENDAR.map((d) => (
          <div key={d.date} className="text-[11px]">
            <span className="font-mono-num text-ink">{d.date}</span>{" "}
            <span className="font-medium text-ink">{d.name}</span>
            <div className="text-ink-soft">
              {d.sects} · {CLUSTER_LABEL[d.cluster]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
