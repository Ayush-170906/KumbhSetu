"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DEMO_ACCOUNTS,
  getSession,
  login,
  logout,
  type DemoAccount,
  type DemoRole,
} from "@/lib/auth";
import { Icon, type IconName } from "@/components/ui/Icon";
import { KUMBH_IMAGES } from "@/lib/kumbhImagery";

const ROLE_ICON: Record<DemoRole, IconName> = {
  pilgrim: "pilgrim",
  volunteer: "volunteer",
  management: "management",
};

const ROLE_PITCH: Record<DemoRole, string> = {
  pilgrim: "Map, facilities, family group, one-tap SOS and the Kumbh Setu Assistant.",
  volunteer: "Setu AI field companion — voice, translation, ground reports and your task queue.",
  management: "Live operations map, Kumbh Pulse, Ops Copilot, advisories and the audit log.",
};

function readParams() {
  if (typeof window === "undefined") return { role: null as DemoRole | null, next: null as string | null };
  const p = new URLSearchParams(window.location.search);
  const raw = (p.get("role") || p.get("next") || "").toLowerCase();
  const role = (["pilgrim", "volunteer", "management"] as const).find((r) => r === raw) ?? null;
  return { role, next: p.get("next") };
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set only when the operator taps a role tab; otherwise the ?role hint wins.
  const [pickedRole, setPickedRole] = useState<DemoRole | null>(null);

  // `mounted` is false during SSR and the first client render, then flips true —
  // so the URL-derived hint is applied as a post-hydration update, never a
  // server/client text mismatch.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [existing, setExisting] = useState<ReturnType<typeof getSession>>(() => getSession());

  const params = useMemo(() => (mounted ? readParams() : { role: null, next: null }), [mounted]);
  const active: DemoRole = pickedRole ?? params.role ?? "pilgrim";
  const next = params.next;
  const setActive = setPickedRole;

  const acct = DEMO_ACCOUNTS.find((a) => a.role === active) as DemoAccount;

  function enter(a: DemoAccount) {
    const s = login(a.username, a.password);
    if (s) router.replace(s.home);
  }

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const s = login(username, password);
    if (!s) {
      setError("That username or password isn't right. Use the demo credentials shown above.");
      return;
    }
    router.replace(s.home);
  }

  return (
    <div className="flex min-h-screen bg-ivory">
      {/* ---------- Immersive brand panel ---------- */}
      <aside className="relative hidden w-[42%] shrink-0 overflow-hidden lg:block">
        <img
          src={KUMBH_IMAGES.ghats.src}
          alt={KUMBH_IMAGES.ghats.alt}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: KUMBH_IMAGES.ghats.focus }}
        />
        <div className="photo-scrim-left absolute inset-0" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-white/15 ring-1 ring-white/25 backdrop-blur">
              <Icon name="route" className="h-4 w-4 text-white" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold text-white">Kumbh Setu</span>
              <span className="block text-[10px] uppercase tracking-[0.14em] text-white/60">
                Connected Response
              </span>
            </span>
          </Link>
          <div>
            <p className="eyebrow text-gold-soft">Simhastha 2027 · Prototype</p>
            <h1 className="text-display mt-3 text-3xl text-white">
              One platform for the pilgrim, the volunteer and the control room.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">
              Sign in to any role to explore the live-synced demo. Open all three in
              separate tabs to watch a report move end-to-end.
            </p>
          </div>
          <span className="text-[10px] text-white/45">{KUMBH_IMAGES.ghats.credit}</span>
        </div>
      </aside>

      {/* ---------- Sign-in ---------- */}
      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-5 flex items-center justify-between lg:hidden">
            <Link href="/" className="flex items-center gap-2 text-ink-muted hover:text-ink">
              <Icon name="route" className="h-5 w-5" />
              <span className="font-editorial text-lg text-ink">Kumbh Setu</span>
            </Link>
          </div>

          <Link href="/" className="text-xs font-medium text-primary hover:text-primary-dark">
            ← All roles
          </Link>

          {mounted && existing && (
            <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-status-green-border bg-status-green-bg px-3 py-2.5 text-xs text-status-green">
              <span>
                This tab is signed in as <strong>{existing.label}</strong>.
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <Link href={existing.home} className="font-medium underline">
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

          <h2 className="text-display mt-4 text-2xl text-ink">Sign in</h2>
          <p className="mt-1 text-sm text-ink-muted">Choose the role you want to explore.</p>

          {/* Role segmented control */}
          <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-xl border border-border bg-surface-muted p-1.5">
            {(["pilgrim", "volunteer", "management"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setActive(r)}
                className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-[11px] font-semibold capitalize transition-colors ${
                  active === r
                    ? "bg-surface text-ink shadow-card"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                <Icon name={ROLE_ICON[r]} className="h-4 w-4" />
                {r}
              </button>
            ))}
          </div>

          {/* Active role card */}
          <div className="mt-4 rounded-xl border border-border bg-surface p-5 shadow-card">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-primary-soft">
                <Icon name={ROLE_ICON[active]} className="h-5 w-5 text-primary-dark" />
              </span>
              <div>
                <div className="text-sm font-semibold text-ink">{acct.label}</div>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-muted">
                  {ROLE_PITCH[active]}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-dashed border-border-strong bg-surface-muted/60 px-3 py-2.5">
              <div className="eyebrow text-ink-soft">Demo credentials</div>
              <div className="mt-1 flex items-center gap-2 font-mono-num text-xs text-ink">
                <span className="rounded bg-surface px-1.5 py-0.5 ring-1 ring-border">
                  {acct.username}
                </span>
                <span className="text-ink-soft">/</span>
                <span className="rounded bg-surface px-1.5 py-0.5 ring-1 ring-border">
                  {acct.password}
                </span>
              </div>
            </div>

            <button
              onClick={() => enter(acct)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-[8px] bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              Enter as {active}
              <Icon name="arrow-right" className="h-4 w-4" />
            </button>

            <button
              onClick={() => setShowManual((v) => !v)}
              className="mt-2 flex w-full items-center justify-center gap-1 text-[11px] text-ink-soft hover:text-ink-muted"
            >
              {showManual ? "Hide" : "Type credentials instead"}
              <Icon name="chevron-down" className={`h-3.5 w-3.5 transition-transform ${showManual ? "rotate-180" : ""}`} />
            </button>

            {showManual && (
              <form onSubmit={submitManual} className="mt-3 space-y-2.5 border-t border-border pt-3">
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  autoComplete="username"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  type="password"
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
                {error && <div className="text-xs text-status-red">{error}</div>}
                <button
                  type="submit"
                  className="w-full rounded-[8px] border border-border-strong py-2 text-sm font-medium text-ink hover:bg-surface-muted"
                >
                  Sign in{next ? ` to ${next}` : ""}
                </button>
              </form>
            )}
          </div>

          <Link
            href="/enroll"
            className="group mt-4 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary-soft/40 px-4 py-3 transition-colors hover:bg-primary-soft"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink">New volunteer? Register here</span>
              <span className="mt-0.5 block text-[11px] text-ink-muted">
                Add your details, set your availability, get the group link.
              </span>
            </span>
            <Icon name="arrow-right" className="h-4 w-4 shrink-0 text-primary group-hover:text-primary-dark" />
          </Link>

          <p className="mt-3 text-[10px] leading-relaxed text-ink-soft">
            Prototype sign-in only — no real accounts, no server. Every demo password is{" "}
            <span className="font-mono-num">kumbh2027</span>. The session is per browser tab.
          </p>
        </div>
      </main>
    </div>
  );
}
