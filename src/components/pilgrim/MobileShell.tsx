"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

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
        <header className="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-border bg-surface sticky top-0 z-20">
          {onBack ? (
            <button onClick={onBack} className="p-1 -ml-1 text-ink-muted" aria-label="Back">
              <Icon name="chevron-right" className="h-5 w-5 rotate-180" />
            </button>
          ) : (
            <Link href="/" className="p-1 -ml-1 text-ink-muted" aria-label="Home">
              <Icon name="map-pin" className="h-5 w-5" />
            </Link>
          )}
          <div className="text-sm font-semibold text-ink flex-1">{title}</div>
          {right}
        </header>
        <div className="flex-1 flex flex-col">{children}</div>
      </div>
    </div>
  );
}
