"use client";

import { useEffect, useRef } from "react";
import type { Incident, Volunteer } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { StageStepper } from "@/components/incidents/StageStepper";
import { DemoBubble, SetuProvenance } from "./DemoShared";
import {
  PILGRIM_TAMIL,
  PILGRIM_TAMIL_GLOSS,
  SETU_PILGRIM_REPLY,
  SETU_PILGRIM_INTENT,
} from "@/lib/demoScript";

export function DemoPilgrimPane({
  stepIndex,
  incident,
  responder,
}: {
  stepIndex: number;
  incident?: Incident;
  responder?: Volunteer;
}) {
  const showMessage = stepIndex >= 2;
  const showReply = stepIndex >= 3;

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [stepIndex, incident?.status]);

  return (
    <div className="flex flex-1 flex-col p-4">
      <PaneHeader icon="pilgrim" title="Pilgrim" subtitle="Needs help" />

      {!showMessage ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted">
            <Icon name="pilgrim" className="h-5 w-5 text-ink-soft" />
          </div>
          <p className="max-w-[16rem] text-xs text-ink-muted">
            The Kumbh Setu app, in the pilgrim&rsquo;s own language.
          </p>
        </div>
      ) : (
        <div ref={scrollRef} className="mt-3 space-y-2.5 overflow-y-auto scroll-thin pr-0.5">
          <div className="rounded-sm border border-status-amber-border bg-status-amber-bg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-status-amber">
            Demo scenario — not a real pilgrim
          </div>

          <DemoBubble from="pilgrim" label="Pilgrim · Tamil">
            {PILGRIM_TAMIL}
            <div className="mt-1 text-[11px] italic text-ink-soft">{PILGRIM_TAMIL_GLOSS}</div>
          </DemoBubble>

          {showReply && (
            <div className="animate-fade-in-up">
              <DemoBubble from="assistant" label={`Kumbh Setu Assistant · ${SETU_PILGRIM_INTENT}`} tone="emergency">
                {SETU_PILGRIM_REPLY}
              </DemoBubble>
              <div className="px-1">
                <SetuProvenance />
              </div>
            </div>
          )}

          {incident && (
            <div className="animate-fade-in-up rounded-sm border border-border bg-surface p-3">
              <div className="mb-2 text-[10px] uppercase tracking-wide text-ink-soft">Linked incident</div>
              <div className="font-mono-num text-sm text-ink">{incident.code}</div>
              <div className="mt-3">
                <StageStepper status={incident.status} />
              </div>
              {responder && (
                <div className="mt-3 rounded-sm bg-surface-muted px-3 py-2 text-xs">
                  <div className="text-ink-soft">Responder assigned</div>
                  <div className="mt-0.5 font-medium text-ink">
                    {responder.name} · {responder.id}
                  </div>
                  {incident.etaMinutes ? <div className="mt-0.5 text-ink-soft">ETA {incident.etaMinutes} min</div> : null}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PaneHeader({
  icon,
  title,
  subtitle,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-border pb-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-primary-soft">
        <Icon name={icon} className="h-4 w-4 text-primary-dark" />
      </div>
      <div>
        <div className="text-sm font-semibold text-ink">{title}</div>
        {subtitle && <div className="text-[11px] text-ink-soft">{subtitle}</div>}
      </div>
    </div>
  );
}
