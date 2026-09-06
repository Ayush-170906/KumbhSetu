"use client";

import { useMemo, useRef, type ReactNode } from "react";
import type { LanguageCode } from "@/lib/types";
import { LANGUAGE_LABELS } from "@/lib/i18n";
import { Icon } from "@/components/ui/Icon";
import { SimTag } from "@/components/ui/SimTag";
import { useSetu } from "@/ai/useSetu";
import type { SetuPersona } from "@/ai/persona";
import { SetuOrb } from "./SetuOrb";
import { SetuTranscript } from "./SetuTranscript";
import { SetuComposer } from "./SetuComposer";
import { SetuConfirmCard } from "./SetuConfirmCard";
import { SetuReportCard } from "./SetuReportCard";
import { SetuTranslatePanel } from "./SetuTranslatePanel";

const LANGS: LanguageCode[] = ["en", "hi", "mr", "ta"];

export function SetuCompanion({
  persona = "volunteer",
  volunteerId,
  zoneId,
  language,
  variant = "full",
  onCreated,
  onNavHint,
  emptyStateExtra,
}: {
  persona?: SetuPersona;
  volunteerId?: string;
  zoneId?: string;
  language?: LanguageCode;
  variant?: "full" | "embedded";
  onCreated?: (kind: "incident" | "groundReport" | "task", id: string) => void;
  /** Pilgrim companion: open a screen the reply suggests. */
  onNavHint?: (screen: string) => void;
  /** Rendered under the orb before a conversation starts (field-status panels). */
  emptyStateExtra?: ReactNode;
}) {
  const setu = useSetu({ persona, volunteerId, zoneId, language, onCreated });
  const {
    spec,
    status,
    messages,
    partial,
    pending,
    reportDraft,
    translationOther,
    volunteer,
    zone,
    offline,
    volunteerLanguage,
    voiceReplies,
    voiceInputAvailable,
    voiceOutputAvailable,
    voiceBlocked,
    lastError,
    providerInfo,
  } = setu;

  const composerRef = useRef<HTMLInputElement>(null);

  const lastSetu = [...messages].reverse().find((m) => m.role === "setu");
  const emergency = lastSetu?.urgency === "emergency";
  const conversationStarted = messages.length > 0;

  const chips = useMemo(() => {
    if (reportDraft && reportDraft.missing.length > 0) return []; // let them answer the follow-up
    return spec.chips;
  }, [reportDraft, spec]);

  function toggleListen() {
    if (status === "listening") return setu.stopListening();
    if (status === "speaking") return setu.stopSpeaking();
    // No usable mic — don't error; just put the cursor in the text box.
    if (!voiceInputAvailable) return composerRef.current?.focus();
    setu.startListening();
  }

  // ---- translation mode takes over the body -----------------------------
  if (translationOther) {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-ivory">
        <ProviderStrip providerInfo={providerInfo} offline={offline} />
        <SetuTranslatePanel
          volunteerLanguage={volunteerLanguage}
          other={translationOther}
          messages={messages}
          listening={status === "listening"}
          speakEnabled={voiceOutputAvailable}
          onVolunteerSpeak={setu.sendText}
          onPilgrimSpeak={setu.relayFromPilgrim}
          onSwapOther={setu.swapTranslation}
          onEnd={setu.endTranslation}
          onStartListening={setu.startListening}
          onSpeak={setu.speakAloud}
        />
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col min-h-0 ${emergency ? "bg-status-red-bg" : "bg-ivory"}`}>
      {emergency && (
        <div className="bg-status-red text-white px-4 py-2 flex items-center gap-2 text-sm font-semibold">
          <Icon name="warning" className="h-4 w-4" />
          Priority incident — Setu is keeping this short
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface">
        <ProviderStrip providerInfo={providerInfo} offline={offline} inline />
        <div className="flex items-center gap-2">
          <select
            value={volunteerLanguage}
            onChange={(e) => setu.setVolunteerLanguage(e.target.value as LanguageCode)}
            className="text-[11px] bg-transparent border border-border rounded-sm px-1.5 py-1 focus:outline-none"
            title="Your language"
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {LANGUAGE_LABELS[l]}
              </option>
            ))}
          </select>
          {voiceOutputAvailable && (
            <button
              onClick={() => setu.setVoiceReplies(!voiceReplies)}
              className={`h-7 w-7 rounded-sm border flex items-center justify-center ${
                voiceReplies ? "border-primary text-primary" : "border-border text-ink-soft"
              }`}
              title={voiceReplies ? "Spoken replies on" : "Spoken replies off"}
            >
              <Icon name={voiceReplies ? "bell" : "wifi-off"} className="h-3.5 w-3.5" />
            </button>
          )}
          {conversationStarted && (
            <button
              onClick={setu.endSession}
              className="text-[11px] text-ink-soft hover:text-ink border border-border rounded-sm px-2 py-1"
              title="Clear this session (also clears short-term memory)"
            >
              End
            </button>
          )}
        </div>
      </div>

      {!conversationStarted ? (
        <div className="flex-1 overflow-y-auto scroll-thin flex flex-col items-center px-6 pt-8 pb-4 gap-6">
          <div className="text-center">
            <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-ink">{spec.title}</div>
            <div className="text-xs text-ink-muted mt-0.5">{spec.subtitle}</div>
          </div>
          <SetuOrb
            status={status}
            emergency={emergency}
            voiceAvailable={voiceInputAvailable}
            onPress={toggleListen}
            size={variant === "full" ? 148 : 120}
          />
          {partial && (
            <div className="text-sm text-ink-muted italic text-center max-w-xs">&ldquo;{partial}&rdquo;</div>
          )}
          {lastError && <div className="text-xs text-status-amber text-center max-w-xs">{lastError}</div>}
          {!voiceInputAvailable && !lastError && (
            <div className="text-[11px] text-ink-soft text-center max-w-xs">
              {voiceBlocked ? (
                <>
                  Using text — the mic isn&rsquo;t available here.{" "}
                  <button onClick={setu.retryVoice} className="underline hover:text-ink">
                    Try the mic again
                  </button>
                </>
              ) : (
                <>{spec.emptyHint}</>
              )}
            </div>
          )}
          {emptyStateExtra && <div className="w-full max-w-md">{emptyStateExtra}</div>}
        </div>
      ) : (
        <>
          <SetuTranscript
            messages={messages}
            partial={partial}
            volunteerLanguage={volunteerLanguage}
            speakEnabled={voiceOutputAvailable}
            onSpeak={setu.speakAloud}
          />
          {reportDraft && (
            <SetuReportCard
              draft={reportDraft}
              zoneName={zone?.shortName ?? volunteer.zoneId}
              ready={reportDraft.missing.length === 0 && !!pending}
              busy={status === "taking_action"}
              hasPhoto={setu.hasPhoto()}
              onAttachPhoto={setu.attachPhoto}
              onSubmit={setu.confirm}
              onCancel={setu.cancel}
            />
          )}
          {pending && !reportDraft && (
            <SetuConfirmCard
              pending={pending}
              busy={status === "taking_action"}
              onConfirm={setu.confirm}
              onCancel={setu.cancel}
            />
          )}
          {lastSetu?.navHint && onNavHint && (
            <div className="px-3 pb-2">
              <button
                onClick={() => onNavHint(lastSetu.navHint!.screen)}
                className="w-full flex items-center justify-center gap-2 rounded-sm bg-primary text-white text-sm font-medium py-2.5 hover:bg-primary-dark transition-colors"
              >
                {lastSetu.navHint.label}
                <Icon name="arrow-right" className="h-4 w-4" />
              </button>
            </div>
          )}
          {lastError && <div className="px-4 pb-1 text-xs text-status-amber">{lastError}</div>}
          <div className="flex items-center justify-center gap-4 py-2 border-t border-border bg-surface">
            <SetuOrb
              status={status}
              emergency={emergency}
              voiceAvailable={voiceInputAvailable}
              onPress={toggleListen}
              size={82}
            />
          </div>
        </>
      )}

      <SetuComposer
        disabled={status === "taking_action"}
        chips={chips}
        placeholder={
          reportDraft && reportDraft.missing.length > 0
            ? `Answer: ${reportDraft.missing[0]}…`
            : "Type, or use the camera…"
        }
        onSend={setu.sendText}
        onPhoto={persona === "volunteer" ? setu.sendPhoto : undefined}
        inputRef={composerRef}
      />
    </div>
  );
}

function ProviderStrip({
  providerInfo,
  offline,
  inline,
}: {
  providerInfo: { llm: { name: string }; translation: { name: string }; allSimulated: boolean };
  offline: boolean;
  inline?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 ${inline ? "" : "px-4 py-1.5 border-b border-border bg-surface"}`}>
      <SimTag label={providerInfo.allSimulated ? "SIMULATION MODE" : "LIVE PROVIDERS"} />
      {offline && (
        <span className="text-[10px] font-semibold uppercase tracking-wide text-status-amber flex items-center gap-1">
          <Icon name="wifi-off" className="h-3 w-3" />
          Offline — reports queue
        </span>
      )}
    </div>
  );
}
