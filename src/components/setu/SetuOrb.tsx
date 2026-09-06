"use client";

import { Icon } from "@/components/ui/Icon";
import type { SetuStatus } from "@/ai/schemas";

const STATE_COPY: Record<SetuStatus, { label: string; hint: string }> = {
  idle: { label: "Tap to talk", hint: "Ask, translate, or send a photo — Kumbh Setu AI" },
  listening: { label: "Listening…", hint: "Tell me what you need" },
  thinking: { label: "Thinking…", hint: "Working out the best answer" },
  searching: { label: "Checking…", hint: "Looking at live facility & zone data" },
  translating: { label: "Translating…", hint: "Relaying between languages" },
  taking_action: { label: "Working on it…", hint: "Applying the confirmed action" },
  waiting_for_confirmation: { label: "Needs your OK", hint: "Review the action below" },
  speaking: { label: "Speaking…", hint: "Tap to interrupt" },
  error: { label: "Try again", hint: "Something didn't work — type or retry" },
  offline: { label: "Offline", hint: "Reports will queue and sync later" },
};

const ACTIVE_RING: SetuStatus[] = ["listening", "speaking", "translating"];
const BUSY: SetuStatus[] = ["thinking", "searching", "taking_action"];

export function SetuOrb({
  status,
  emergency,
  voiceAvailable = true,
  onPress,
  size = 132,
}: {
  status: SetuStatus;
  emergency?: boolean;
  /** When false, the orb is a "focus the text box" affordance, not a mic. */
  voiceAvailable?: boolean;
  onPress: () => void;
  size?: number;
}) {
  const copy =
    status === "idle" && !voiceAvailable
      ? { label: "Type to ask", hint: "Tap here or the box below — voice isn't available" }
      : STATE_COPY[status];
  const ringing = ACTIVE_RING.includes(status);
  const busy = BUSY.includes(status);

  const tone = emergency
    ? "bg-status-red text-white border-status-red"
    : status === "waiting_for_confirmation"
    ? "bg-status-amber text-white border-status-amber"
    : status === "idle" || status === "error" || status === "offline"
    ? "bg-primary text-white border-primary"
    : "bg-primary-dark text-white border-primary-dark";

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <button
        type="button"
        onClick={onPress}
        aria-label={copy.label}
        className="relative flex items-center justify-center rounded-full outline-none focus-visible:ring-4 focus-visible:ring-primary-soft"
        style={{ width: size, height: size }}
      >
        {ringing && (
          <>
            <span
              className={`absolute inset-0 rounded-full ${emergency ? "bg-status-red" : "bg-primary"} opacity-30 map-pulse`}
            />
            <span
              className={`absolute inset-0 rounded-full ${emergency ? "bg-status-red" : "bg-primary"} opacity-20 map-pulse`}
              style={{ animationDelay: "0.8s" }}
            />
          </>
        )}
        <span
          className={`relative flex items-center justify-center rounded-full border-2 shadow-panel transition-colors ${tone}`}
          style={{ width: size - 24, height: size - 24 }}
        >
          {busy ? (
            <span className="flex gap-1.5">
              <Dot delay="0s" />
              <Dot delay="0.15s" />
              <Dot delay="0.3s" />
            </span>
          ) : (
            <Icon
              name={
                emergency
                  ? "warning"
                  : status === "listening"
                  ? "target"
                  : status === "speaking"
                  ? "pulse"
                  : status === "translating"
                  ? "layers"
                  : status === "waiting_for_confirmation"
                  ? "check"
                  : status === "idle" && !voiceAvailable
                  ? "log"
                  : "pilgrim"
              }
              className="h-8 w-8"
              strokeWidth={1.8}
            />
          )}
        </span>
      </button>
      <div className="text-center">
        <div className={`text-sm font-semibold ${emergency ? "text-status-red" : "text-ink"}`}>{copy.label}</div>
        <div className="text-[11px] text-ink-soft mt-0.5">{copy.hint}</div>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-2 w-2 rounded-full bg-white/90"
      style={{ animation: "fade-in-up 0.6s ease-in-out infinite alternate", animationDelay: delay }}
    />
  );
}
