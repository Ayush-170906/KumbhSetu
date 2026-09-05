"use client";

import type { ReactNode } from "react";
import { Icon } from "./Icon";

export function Drawer({
  open,
  onClose,
  title,
  eyebrow,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  eyebrow?: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-ink/20" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-surface border-l border-border shadow-panel overflow-y-auto scroll-thin animate-fade-in-up">
        <div className="sticky top-0 bg-surface border-b border-border px-5 py-4 flex items-start justify-between z-10">
          <div>
            {eyebrow && (
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft mb-0.5">
                {eyebrow}
              </div>
            )}
            <div className="text-sm font-semibold text-ink">{title}</div>
          </div>
          <button onClick={onClose} className="text-ink-soft hover:text-ink p-1 -mr-1 -mt-1" aria-label="Close">
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
