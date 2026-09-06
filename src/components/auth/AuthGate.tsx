"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, logout, type DemoRole, type DemoSession } from "@/lib/auth";
import { Icon } from "@/components/ui/Icon";

const AREA_LABEL: Record<DemoRole, string> = {
  pilgrim: "Pilgrim app",
  volunteer: "Volunteer field app",
  management: "Control Room",
};

/**
 * Wraps a role app. Requires a demo sign-in for `area`; otherwise sends the
 * tab to /login. Because the session lives in sessionStorage (per-tab), three
 * tabs can hold three different roles at once for a walkthrough. Always rendered
 * inside <ClientOnly>, so the session read in the initializer is client-side.
 */
export function AuthGate({ area, children }: { area: DemoRole; children: React.ReactNode }) {
  const router = useRouter();
  const [session] = useState<DemoSession | null>(() => getSession());
  const phase: "ok" | "no-session" | "wrong-role" = !session
    ? "no-session"
    : session.role === area
    ? "ok"
    : "wrong-role";

  useEffect(() => {
    if (phase === "no-session") router.replace(`/login?next=${area}`);
  }, [phase, area, router]);

  if (phase === "no-session") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory text-ink-muted text-sm">
        Redirecting to sign-in…
      </div>
    );
  }

  if (phase === "wrong-role" && session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory px-6">
        <div className="w-full max-w-sm rounded-sm border border-border bg-surface p-6 text-center shadow-card">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">Wrong sign-in for this tab</div>
          <h1 className="font-editorial text-lg text-ink mt-1">{AREA_LABEL[area]}</h1>
          <p className="text-sm text-ink-muted mt-2">
            This tab is signed in as <strong className="text-ink">{session.label}</strong>. The{" "}
            {AREA_LABEL[area]} needs the {area === "management" ? "Organization" : area} sign-in.
          </p>
          <div className="mt-5 space-y-2">
            <Link
              href={session.home}
              className="block w-full rounded-sm bg-primary text-white text-sm font-medium py-2.5 hover:bg-primary-dark transition-colors"
            >
              Go to my dashboard
            </Link>
            <button
              onClick={() => {
                logout();
                router.replace(`/login?next=${area}`);
              }}
              className="block w-full rounded-sm border border-border-strong text-ink text-sm py-2.5 hover:bg-surface-muted transition-colors"
            >
              Sign out &amp; switch
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {session && <SessionChip session={session} />}
    </>
  );
}

function SessionChip({ session }: { session: DemoSession }) {
  const router = useRouter();
  return (
    <div className="fixed bottom-2 left-2 z-50 flex items-center gap-1.5 rounded-full border border-border-strong bg-surface/95 backdrop-blur px-2.5 py-1 text-[10px] text-ink-muted shadow-card">
      <span className="h-1.5 w-1.5 rounded-full bg-status-green" />
      <span className="font-medium text-ink">{session.label}</span>
      <span className="text-ink-soft">·</span>
      <button
        onClick={() => {
          logout();
          router.replace("/login");
        }}
        className="flex items-center gap-1 hover:text-ink"
        title="Sign out"
      >
        <Icon name="arrow-right" className="h-3 w-3 rotate-180" />
        sign out
      </button>
    </div>
  );
}
