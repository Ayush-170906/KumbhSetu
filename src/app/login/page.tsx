"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DEMO_ACCOUNTS, getSession, login, logout, type DemoAccount } from "@/lib/auth";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SimTag } from "@/components/ui/SimTag";

const ROLE_ICON: Record<string, IconName> = {
  pilgrim: "pilgrim",
  volunteer: "volunteer",
  management: "management",
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [next] = useState<string | null>(() =>
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("next")
  );
  const [existing, setExisting] = useState<ReturnType<typeof getSession>>(() => getSession());

  function go(acct: DemoAccount) {
    const s = login(acct.username, acct.password);
    if (s) router.replace(s.home);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const s = login(username, password);
    if (!s) {
      setError("That username or password isn't right. Use one of the demo accounts below.");
      return;
    }
    router.replace(s.home);
  }

  return (
    <div className="min-h-screen bg-ivory flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="flex items-center gap-2 text-ink-muted hover:text-ink">
            <Icon name="map-pin" className="h-5 w-5" />
            <span className="font-editorial text-lg text-ink">Kumbh Setu</span>
          </Link>
          <SimTag label="DEMO SIGN-IN" />
        </div>

        {existing && (
          <div className="mb-4 rounded-sm border border-status-green-border bg-status-green-bg px-3 py-2.5 text-xs text-status-green flex items-center justify-between gap-2">
            <span>
              This tab is already signed in as <strong>{existing.label}</strong>.
            </span>
            <span className="flex items-center gap-2 shrink-0">
              <Link href={existing.home} className="underline font-medium">
                Open
              </Link>
              <button
                onClick={() => {
                  logout();
                  setExisting(null);
                }}
                className="underline"
              >
                Sign out
              </button>
            </span>
          </div>
        )}

        <div className="rounded-sm border border-border bg-surface shadow-card p-6">
          <h1 className="font-editorial text-xl text-ink">Sign in</h1>
          <p className="text-xs text-ink-muted mt-1">
            Pick a role below — each opens its own dashboard. For a full walkthrough, sign in to a
            different role in each of three browser tabs; they stay live-synced.
          </p>

          <div className="mt-4 space-y-2">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.username}
                onClick={() => go(a)}
                className="w-full flex items-start gap-3 rounded-sm border border-border bg-surface px-3 py-3 text-left hover:border-primary hover:bg-surface-muted transition-colors group"
              >
                <div className="h-9 w-9 rounded-sm bg-primary-soft flex items-center justify-center shrink-0">
                  <Icon name={ROLE_ICON[a.role]} className="h-4.5 w-4.5 text-primary-dark" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-ink">{a.label}</div>
                  <div className="text-[11px] text-ink-muted mt-0.5">{a.blurb}</div>
                  <div className="text-[10px] font-mono-num text-ink-soft mt-1">
                    {a.username} · {a.password}
                  </div>
                </div>
                <Icon
                  name="arrow-right"
                  className="h-4 w-4 text-ink-soft group-hover:text-primary mt-1 shrink-0"
                />
              </button>
            ))}
          </div>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] uppercase tracking-wide text-ink-soft">or type it</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-2.5">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username (pilgrim / volunteer / management)"
              autoComplete="username"
              className="w-full text-sm rounded-sm border border-border bg-surface px-3 py-2 focus:outline-none focus:border-primary"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              autoComplete="current-password"
              className="w-full text-sm rounded-sm border border-border bg-surface px-3 py-2 focus:outline-none focus:border-primary"
            />
            {error && <div className="text-xs text-status-red">{error}</div>}
            <button
              type="submit"
              className="w-full rounded-sm bg-primary text-white text-sm font-medium py-2.5 hover:bg-primary-dark transition-colors"
            >
              Sign in{next ? ` to ${next}` : ""}
            </button>
          </form>

          <p className="text-xs text-ink-muted mt-4">
            New volunteer?{" "}
            <Link href="/enroll" className="text-primary hover:text-primary-dark font-medium">
              Enroll here
            </Link>{" "}
            — add your details and availability.
          </p>

          <p className="text-[10px] text-ink-soft mt-3 leading-relaxed">
            Prototype sign-in only — no real accounts, no server. All demo passwords are{" "}
            <span className="font-mono-num">kumbh2027</span>. Session is per-tab.
          </p>
        </div>
      </div>
    </div>
  );
}
