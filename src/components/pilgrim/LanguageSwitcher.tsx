"use client";

import type { LanguageCode } from "@/lib/types";
import { LANGUAGE_LABELS } from "@/lib/i18n";

const codes: LanguageCode[] = ["en", "hi", "mr"];

export function LanguageSwitcher({ value, onChange }: { value: LanguageCode; onChange: (l: LanguageCode) => void }) {
  return (
    <div className="flex rounded-sm border border-border overflow-hidden shrink-0">
      {codes.map((code) => (
        <button
          key={code}
          onClick={() => onChange(code)}
          className={`px-2 py-1 text-[10.5px] font-medium transition-colors ${
            value === code ? "bg-primary text-white" : "bg-surface text-ink-muted hover:bg-surface-muted"
          }`}
          title={LANGUAGE_LABELS[code]}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
