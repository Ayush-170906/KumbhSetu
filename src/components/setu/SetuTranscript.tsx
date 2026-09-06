"use client";

import { useEffect, useRef } from "react";
import type { LanguageCode } from "@/lib/types";
import type { SetuMessage } from "@/ai/useSetu";
import { INTENT_LABELS } from "@/ai/intents";
import { LANGUAGE_LABELS } from "@/lib/i18n";
import { Icon } from "@/components/ui/Icon";

export function SetuTranscript({
  messages,
  partial,
  volunteerLanguage,
  speakEnabled,
  onSpeak,
}: {
  messages: SetuMessage[];
  partial?: string;
  volunteerLanguage: LanguageCode;
  speakEnabled?: boolean;
  onSpeak?: (text: string, lang?: LanguageCode) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, partial]);

  return (
    <div className="flex-1 overflow-y-auto scroll-thin px-4 py-3 space-y-2.5">
      {messages.map((m) => (
        <Bubble
          key={m.id}
          m={m}
          volunteerLanguage={volunteerLanguage}
          speakEnabled={speakEnabled}
          onSpeak={onSpeak}
        />
      ))}
      {partial && (
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-sm px-3 py-2 text-sm bg-primary/70 text-white italic">
            {partial}
            <span className="ml-1 inline-block h-3 w-0.5 bg-white/80 align-middle animate-pulse" />
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}

function Bubble({
  m,
  volunteerLanguage,
  speakEnabled,
  onSpeak,
}: {
  m: SetuMessage;
  volunteerLanguage: LanguageCode;
  speakEnabled?: boolean;
  onSpeak?: (text: string, lang?: LanguageCode) => void;
}) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-sm px-3 py-2 text-sm bg-primary text-white leading-relaxed">
          {m.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={m.imageUrl}
              alt="Photo sent to Setu"
              className="mb-1.5 max-h-40 w-full rounded-sm border border-white/30 object-cover"
            />
          )}
          {m.text}
        </div>
      </div>
    );
  }

  if (m.role === "pilgrim") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-sm px-3 py-2 text-sm bg-secondary-soft border border-border text-ink leading-relaxed">
          <div className="text-[9.5px] font-semibold uppercase tracking-wide text-ink-soft mb-0.5">Pilgrim</div>
          {m.text}
        </div>
      </div>
    );
  }

  const emergency = m.urgency === "emergency";
  return (
    <div className="flex justify-start">
      <div
        className={`max-w-[88%] rounded-sm px-3 py-2 text-sm leading-relaxed border ${
          emergency ? "bg-status-red-bg border-status-red-border text-status-red" : "bg-surface border-border text-ink"
        }`}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <Icon name={emergency ? "warning" : "pilgrim"} className="h-3.5 w-3.5 shrink-0" />
          <span className="text-[9.5px] font-semibold uppercase tracking-wide opacity-70">
            Kumbh Setu AI
            {m.intent && m.intent !== "other" ? ` · ${INTENT_LABELS[m.intent]}` : ""}
          </span>
        </div>
        <div className="whitespace-pre-line">{m.text}</div>

        {m.translation && (
          <div className="mt-1.5 text-[10px] text-ink-soft flex items-center gap-1">
            <Icon name="layers" className="h-3 w-3" />
            {LANGUAGE_LABELS[m.translation.detectedSource]} → {LANGUAGE_LABELS[m.translation.to]} ·{" "}
            {m.translation.fromPhrasebook ? "phrasebook" : "best-effort"} · {(m.translation.confidence * 100) | 0}%
          </div>
        )}

        <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-border pt-1">
          {m.provenance ? (
            <div className="text-[10px] text-ink-soft">{m.provenance}</div>
          ) : (
            <span />
          )}
          {speakEnabled && onSpeak && (
            <button
              onClick={() => onSpeak(m.text, m.translation?.to ?? volunteerLanguage)}
              className="shrink-0 flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary-dark"
            >
              <Icon name="bell" className="h-3 w-3" />
              {m.translation ? `Play in ${LANGUAGE_LABELS[m.translation.to]}` : "Read aloud"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
