"use client";

import { useState } from "react";
import type { Volunteer, Zone, ZoneMessage } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { formatClockShort } from "@/lib/format";
import { SimTag } from "@/components/ui/SimTag";

export function ZoneChat({
  zone,
  volunteer,
  messages,
  onSend,
}: {
  zone?: Zone;
  volunteer: Volunteer;
  messages: ZoneMessage[];
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-ink">{zone?.shortName ?? "Zone"} coordination channel</div>
          <div className="text-[10.5px] text-ink-soft">Every volunteer on shift in this zone sees this thread live.</div>
        </div>
        <SimTag label="LIVE" />
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin px-4 py-3 space-y-2.5">
        {messages.length === 0 && (
          <p className="text-xs text-ink-soft text-center py-8">
            No messages yet — coordinate with other volunteers in {zone?.shortName ?? "your zone"} here.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === volunteer.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-sm px-3 py-2 ${mine ? "bg-primary text-white" : "bg-surface border border-border text-ink"}`}>
                {!mine && <div className="text-[10px] font-semibold opacity-70 mb-0.5">{m.senderName} · {m.senderId}</div>}
                <div className="text-sm">{m.text}</div>
                <div className={`text-[9.5px] mt-1 ${mine ? "text-white/70" : "text-ink-soft"}`}>{formatClockShort(m.createdAt)}</div>
              </div>
            </div>
          );
        })}
      </div>

      <form
        className="p-3 border-t border-border flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim().length === 0) return;
          onSend(text.trim());
          setText("");
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message your zone team…"
          className="flex-1 text-sm rounded-sm border border-border bg-surface px-3 py-2 focus:outline-none focus:border-primary"
        />
        <button type="submit" className="h-9 w-9 rounded-sm bg-primary text-white flex items-center justify-center shrink-0">
          <Icon name="arrow-right" className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
