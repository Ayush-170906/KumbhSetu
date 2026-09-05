"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * Text fallback for voice (§5/§26). Always available — if speech fails or the
 * field is noisy, the volunteer types. `contextChips` are operational, not
 * generic AI suggestions (§42).
 */
export function SetuComposer({
  disabled,
  placeholder = "Type instead of speaking…",
  chips = [],
  onSend,
  onChip,
}: {
  disabled?: boolean;
  placeholder?: string;
  chips?: string[];
  onSend: (text: string) => void;
  onChip?: (text: string) => void;
}) {
  const [text, setText] = useState("");

  return (
    <div className="border-t border-border bg-surface">
      {chips.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto scroll-thin px-3 pt-2.5 pb-1">
          {chips.map((c) => (
            <button
              key={c}
              disabled={disabled}
              onClick={() => (onChip ?? onSend)(c)}
              className="shrink-0 text-[11px] rounded-full border border-border bg-surface px-2.5 py-1 text-ink-muted hover:border-primary hover:text-ink transition-colors disabled:opacity-40"
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <form
        className="flex items-center gap-2 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          const t = text.trim();
          if (!t || disabled) return;
          onSend(t);
          setText("");
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 text-sm rounded-sm border border-border bg-surface px-3 py-2 focus:outline-none focus:border-primary disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || text.trim().length === 0}
          className="h-9 w-9 rounded-sm bg-primary text-white flex items-center justify-center shrink-0 disabled:opacity-40"
          aria-label="Send"
        >
          <Icon name="arrow-right" className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
