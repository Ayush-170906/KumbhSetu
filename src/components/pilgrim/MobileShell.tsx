"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

/**
 * Phone-framed chrome for the pilgrim experience. Warm, calm, human-first —
 * a branded header, a single clear title, and room for one status control.
 */
export function MobileShell({
  title,
  onBack,
  right,
  children,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ivory flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-ivory flex flex-col border-x border-border">
        <header className="shrink-0 border-b border-border bg-surface sticky top-0 z-20">
          <div className="h-14 flex items-center gap-3 px-4">
            {onBack ? (
              <button
                onClick={onBack}
                className="flex h-8 w-8 -ml-1 items-center justify-center rounded-[7px] text-ink-muted hover:bg-surface-muted"
                aria-label="Back"
              >
                <Icon name="chevron-right" className="h-5 w-5 rotate-180" />
              </button>
            ) : (
              <Link
                href="/"
                className="flex h-8 w-8 -ml-1 items-center justify-center rounded-[7px] bg-primary text-white"
                aria-label="Home"
              >
                <Icon name="route" className="h-4 w-4" />
              </Link>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-ink truncate">{title}</div>
              {!onBack && (
                <div className="text-[10px] uppercase tracking-[0.13em] text-ink-soft -mt-0.5">
                  Pilgrim companion
                </div>
              )}
            </div>
            {right}
          </div>
        </header>
        <div className="flex-1 flex flex-col">{children}</div>
      </div>
    </div>
  );
}
