"use client";

import type { LanguageCode } from "@/lib/types";
import { LANGUAGE_LABELS } from "@/lib/i18n";

const codes: LanguageCode[] = ["en", "hi", "mr", "ta"];

export function LanguageSwitcher({ value, onChange }: { value: LanguageCode; onChange: (l: LanguageCode) => void }) {
  return (
    <label className="block shrink-0">
      <span className="sr-only">Choose language</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as LanguageCode)}
        aria-label="Choose language"
        className="min-h-10 max-w-32 border border-border bg-surface px-2.5 text-xs font-medium text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        {codes.map((code) => <option key={code} value={code}>{LANGUAGE_LABELS[code]}</option>)}
      </select>
    </label>
  );
}
