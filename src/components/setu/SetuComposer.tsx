"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/**
 * Text fallback for voice (§5/§26) plus a camera control (§18). Always
 * available — if speech fails or the field is noisy, the volunteer types; if a
 * picture says it faster, they shoot one and Setu structures it. `chips` are
 * operational, not generic AI suggestions (§42).
 */
export function SetuComposer({
  disabled,
  placeholder = "Type instead of speaking…",
  chips = [],
  onSend,
  onChip,
  onPhoto,
}: {
  disabled?: boolean;
  placeholder?: string;
  chips?: string[];
  onSend: (text: string) => void;
  onChip?: (text: string) => void;
  /** Camera / gallery image, with whatever the volunteer had typed as the note. */
  onPhoto?: (dataUrl: string, note: string) => void;
}) {
  const [text, setText] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

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
        {onPhoto && (
          <>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f || disabled) return;
                const dataUrl = await fileToDataUrl(f);
                onPhoto(dataUrl, text.trim());
                setText("");
              }}
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => fileInput.current?.click()}
              className="h-9 w-9 rounded-sm border border-border text-ink-muted flex items-center justify-center shrink-0 hover:border-primary hover:text-primary transition-colors disabled:opacity-40"
              aria-label="Take or attach a photo"
              title="Camera — Setu will read the photo"
            >
              <Icon name="qr" className="h-4 w-4" />
            </button>
          </>
        )}
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
