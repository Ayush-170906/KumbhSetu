"use client";

import { useState } from "react";
import type { LanguageCode } from "@/lib/types";
import { LANGUAGE_LABELS, LANGUAGE_NAMES } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SimTag } from "@/components/ui/SimTag";
import type { SetuMessage } from "@/ai/useSetu";

const LANGS: LanguageCode[] = ["en", "hi", "mr", "ta"];

/**
 * Dedicated live-translation mode (§40). Once the pair is set the volunteer
 * never re-picks languages — they just speak/type each turn.
 */
export function SetuTranslatePanel({
  volunteerLanguage,
  other,
  messages,
  listening,
  speakEnabled,
  onVolunteerSpeak,
  onPilgrimSpeak,
  onSwapOther,
  onEnd,
  onStartListening,
  onSpeak,
}: {
  volunteerLanguage: LanguageCode;
  other: LanguageCode;
  messages: SetuMessage[];
  listening: boolean;
  speakEnabled?: boolean;
  onVolunteerSpeak: (text: string) => void;
  onPilgrimSpeak: (text: string) => void;
  onSwapOther: (l: LanguageCode) => void;
  onEnd: () => void;
  onStartListening: () => void;
  onSpeak?: (text: string, lang?: LanguageCode) => void;
}) {
  const [side, setSide] = useState<"volunteer" | "pilgrim">("pilgrim");
  const [text, setText] = useState("");

  const relayLog = messages.filter((m) => m.role === "pilgrim" || (m.role === "setu" && m.translation));

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Icon name="layers" className="h-4 w-4 text-primary" />
          {LANGUAGE_LABELS[volunteerLanguage]}
          <Icon name="arrow-right" className="h-3 w-3 text-ink-soft" />
          <select
            value={other}
            onChange={(e) => onSwapOther(e.target.value as LanguageCode)}
            className="bg-transparent border border-border rounded-sm px-1.5 py-0.5 text-sm font-semibold focus:outline-none"
          >
            {LANGS.filter((l) => l !== volunteerLanguage).map((l) => (
              <option key={l} value={l}>
                {LANGUAGE_NAMES[l]}
              </option>
            ))}
          </select>
        </div>
        <SimTag label="LIVE" />
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin px-4 py-3 space-y-2">
        {relayLog.length === 0 && (
          <p className="text-xs text-ink-soft text-center py-10">
            Pick who is speaking, then talk or type. Setu relays each turn into the other language.
          </p>
        )}
        {relayLog.map((m) => {
          const playLang = m.role === "pilgrim" ? other : m.translation?.to ?? volunteerLanguage;
          return (
            <div key={m.id} className={`flex ${m.role === "pilgrim" ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[85%] rounded-sm px-3 py-2 text-sm ${
                  m.role === "pilgrim" ? "bg-secondary-soft border border-border text-ink" : "bg-primary text-white"
                }`}
              >
                {m.text}
                <div
                  className={`flex items-center justify-between gap-3 mt-1 text-[10px] ${
                    m.role === "pilgrim" ? "text-ink-soft" : "text-white/70"
                  }`}
                >
                  <span>
                    {m.translation
                      ? `${m.translation.fromPhrasebook ? "phrasebook" : "best-effort"} · ${(m.translation.confidence * 100) | 0}%`
                      : ""}
                  </span>
                  {speakEnabled && onSpeak && (
                    <button
                      onClick={() => onSpeak(m.text, playLang)}
                      className={`flex items-center gap-1 font-medium ${m.role === "pilgrim" ? "text-primary" : "text-white"}`}
                    >
                      <Icon name="bell" className="h-3 w-3" />
                      Play {LANGUAGE_LABELS[playLang]}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border p-3 space-y-2">
        <div className="flex rounded-sm border border-border overflow-hidden text-xs font-medium">
          <button
            onClick={() => setSide("pilgrim")}
            className={`flex-1 py-1.5 ${side === "pilgrim" ? "bg-secondary text-white" : "bg-surface text-ink-muted"}`}
          >
            Pilgrim speaks {LANGUAGE_LABELS[other]}
          </button>
          <button
            onClick={() => setSide("volunteer")}
            className={`flex-1 py-1.5 ${side === "volunteer" ? "bg-primary text-white" : "bg-surface text-ink-muted"}`}
          >
            I speak {LANGUAGE_LABELS[volunteerLanguage]}
          </button>
        </div>

        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const t = text.trim();
            if (!t) return;
            if (side === "pilgrim") onPilgrimSpeak(t);
            else onVolunteerSpeak(t);
            setText("");
          }}
        >
          <button
            type="button"
            onClick={onStartListening}
            className={`h-9 w-9 rounded-sm flex items-center justify-center shrink-0 ${
              listening ? "bg-status-red text-white" : "bg-surface border border-border text-ink-muted"
            }`}
            aria-label="Speak"
          >
            <Icon name="target" className="h-4 w-4" />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={side === "pilgrim" ? `Type what the pilgrim said…` : `Type what you want to say…`}
            className="flex-1 text-sm rounded-sm border border-border bg-surface px-3 py-2 focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="h-9 w-9 rounded-sm bg-primary text-white flex items-center justify-center shrink-0"
            aria-label="Relay"
          >
            <Icon name="arrow-right" className="h-4 w-4" />
          </button>
        </form>

        <Button variant="ghost" size="sm" className="w-full" onClick={onEnd}>
          End translation
        </Button>
      </div>
    </div>
  );
}
