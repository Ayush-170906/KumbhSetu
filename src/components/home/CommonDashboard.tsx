import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import { KUMBH_IMAGES } from "@/lib/kumbhImagery";
import { HomeTopBar } from "./HomeTopBar";

interface RoleEntry {
  role: "pilgrim" | "volunteer" | "management";
  name: string;
  audience: string;
  line: string;
  points: string[];
  icon: IconName;
  image: { src: string; alt: string; focus: string };
  cta: string;
}

const ROLES: RoleEntry[] = [
  {
    role: "pilgrim",
    name: "Pilgrim",
    audience: "For anyone attending the Mela",
    line: "Navigate the ghats, find the nearest facility, keep your family together, and raise help in one tap — in your own language.",
    points: ["Live facilities & crowd-aware routes", "Family group + colour-coded entry pass", "One-tap SOS with offline SMS fallback", "Kumbh Setu Assistant — ask anything"],
    icon: "pilgrim",
    image: { src: KUMBH_IMAGES.dip.src, alt: KUMBH_IMAGES.dip.alt, focus: KUMBH_IMAGES.dip.focus },
    cta: "Enter as a pilgrim",
  },
  {
    role: "volunteer",
    name: "Volunteer",
    audience: "For sevaks & marshals on the ground",
    line: "Setu AI is a voice-first field companion — not another chat group. Speak to ask, translate, file a ground report, or act on a task.",
    points: ["Voice + live pilgrim↔volunteer translation", "Ground reports reach the control room & Kumbh Pulse", "Task queue: accept → arrive → resolve", "Works degraded when the network drops"],
    icon: "volunteer",
    image: { src: KUMBH_IMAGES.ghats.src, alt: KUMBH_IMAGES.ghats.alt, focus: KUMBH_IMAGES.ghats.focus },
    cta: "Enter the field app",
  },
  {
    role: "management",
    name: "Management",
    audience: "For the control room",
    line: "One operating picture instead of five spreadsheets — live map, zone risk, dispatch, advisories, and an audit trail for every transition.",
    points: ["Live incidents, zones & responders on one map", "Kumbh Pulse — explainable risk on every alert", "Ops Copilot for briefings & responder recommendations", "Every decision logged and timestamped"],
    icon: "management",
    image: { src: KUMBH_IMAGES.snan.src, alt: KUMBH_IMAGES.snan.alt, focus: KUMBH_IMAGES.snan.focus },
    cta: "Enter the control room",
  },
];

const LOOP: { label: string; sub: string; icon: IconName }[] = [
  { label: "Report / SOS", sub: "Pilgrim or operator", icon: "sos" },
  { label: "Incident", sub: "Created & timed", icon: "warning" },
  { label: "Kumbh Pulse", sub: "Zone risk updates", icon: "pulse" },
  { label: "Dispatch", sub: "Nearest responder", icon: "volunteer" },
  { label: "Control room", sub: "Full live picture", icon: "management" },
];

export function CommonDashboard() {
  return (
    <div className="flex-1 bg-ivory">
      {/* ---------- Immersive hero ---------- */}
      <section className="relative isolate overflow-hidden">
        <img
          src={KUMBH_IMAGES.snan.src}
          alt={KUMBH_IMAGES.snan.alt}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          style={{ objectPosition: KUMBH_IMAGES.snan.focus }}
        />
        <div className="hero-scrim absolute inset-0 -z-10" />
        <HomeTopBar />

        <div className="mx-auto max-w-6xl px-5 pb-40 pt-28 sm:px-8 sm:pb-48 sm:pt-36 [text-shadow:0_1px_16px_rgba(10,6,3,0.45)]">
          <p className="eyebrow reveal reveal-1 text-gold">
            Nashik–Trimbakeshwar Simhastha 2027 · Working prototype
          </p>
          <h1 className="text-display reveal reveal-2 mt-4 max-w-3xl text-[2.6rem] text-white sm:text-6xl">
            Three roles. One live picture of the Mela.
          </h1>
          <p className="reveal reveal-3 mt-5 max-w-xl text-[15px] leading-relaxed text-white/85 sm:text-base">
            Kumbh Setu connects the pilgrim, the volunteer and the control room into one
            coordinated response layer — a report becomes a task, a task becomes a
            response, and every response becomes operational intelligence.
          </p>
          <div className="reveal reveal-4 mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#roles"
              className="rounded-[8px] bg-white px-5 py-3 text-sm font-semibold text-night transition-colors hover:bg-gold-soft"
            >
              Choose your role
            </a>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-[8px] border border-white/30 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              <Icon name="route" className="h-4 w-4" />
              Watch the 5-minute demo
            </Link>
          </div>
        </div>

        <span className="pointer-events-none absolute bottom-4 right-5 text-[10px] text-white/45 sm:right-8">
          {KUMBH_IMAGES.snan.credit}
        </span>
      </section>

      {/* ---------- Role entry cards (overlap the hero) ---------- */}
      <section id="roles" className="relative z-10 mx-auto -mt-28 max-w-6xl px-5 sm:px-8">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-float sm:p-6">
          <div className="mb-4 flex items-end justify-between px-1">
            <div>
              <p className="eyebrow text-primary-dark">Sign in by role</p>
              <h2 className="text-display mt-1 text-xl text-ink sm:text-2xl">
                Each role opens its own purpose-built dashboard.
              </h2>
            </div>
            <p className="hidden max-w-xs text-right text-xs text-ink-muted sm:block">
              Open a different role in three browser tabs — they stay live-synced for a
              full walkthrough.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {ROLES.map((r) => (
              <Link
                key={r.role}
                href={`/login?role=${r.role}`}
                className="tile group flex flex-col overflow-hidden rounded-xl border border-border bg-surface"
              >
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={r.image.src}
                    alt={r.image.alt}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ objectPosition: r.image.focus }}
                  />
                  <div className="photo-scrim absolute inset-0" />
                  <div className="absolute bottom-2.5 left-3 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-white/15 ring-1 ring-white/30 backdrop-blur">
                      <Icon name={r.icon} className="h-4 w-4 text-white" />
                    </span>
                    <div className="leading-tight">
                      <div className="text-sm font-semibold text-white">{r.name}</div>
                      <div className="text-[10px] text-white/70">{r.audience}</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <p className="text-xs leading-relaxed text-ink-muted">{r.line}</p>
                  <ul className="mt-3 space-y-1.5">
                    {r.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-[11.5px] text-ink-muted">
                        <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-green" />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center gap-1.5 border-t border-border pt-3 text-xs font-semibold text-primary group-hover:text-primary-dark">
                    {r.cta}
                    <Icon name="arrow-right" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-primary/25 bg-primary-soft/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-ink">Want to serve on the ground?</div>
              <p className="mt-0.5 text-xs text-ink-muted">
                Register as a volunteer, set when you can serve, and get the group link.
              </p>
            </div>
            <Link
              href="/enroll"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-[8px] bg-primary px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              Register as a volunteer
              <Icon name="arrow-right" className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Operational loop ---------- */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <p className="eyebrow text-primary-dark">The connected response loop</p>
        <h2 className="text-display mt-2 max-w-2xl text-2xl text-ink sm:text-3xl">
          One golden path, proven end-to-end across all three roles.
        </h2>
        <div className="mt-8 grid gap-2.5 sm:grid-cols-5">
          {LOOP.map((s, i) => (
            <div key={s.label} className="relative rounded-xl border border-border bg-surface p-4">
              <span className="font-mono-num text-[10px] text-ink-soft">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="mt-2 flex h-8 w-8 items-center justify-center rounded-[7px] bg-primary-soft">
                <Icon name={s.icon} className="h-4 w-4 text-primary-dark" />
              </div>
              <div className="mt-2 text-[13px] font-semibold text-ink">{s.label}</div>
              <div className="text-[11px] text-ink-muted">{s.sub}</div>
              {i < LOOP.length - 1 && (
                <Icon
                  name="chevron-right"
                  className="absolute -right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-ink-soft sm:block"
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-[11px] text-ink-soft">
          <Icon name="route" className="h-3.5 w-3.5" />
          Each response feeds back into Kumbh Pulse and the audit log — the loop closes and
          the picture sharpens.
        </div>
        <Link
          href="/about"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark"
        >
          How the whole system works
          <Icon name="arrow-right" className="h-3.5 w-3.5" />
        </Link>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-border bg-surface-muted/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 sm:flex-row sm:justify-between sm:px-8">
          <div className="max-w-md">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-secondary">
                <Icon name="route" className="h-3.5 w-3.5 text-white" />
              </span>
              <span className="text-sm font-semibold text-ink">Kumbh Setu</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              A prototype civic-technology concept built for Kumbhathon S.P.R.I.N.T. All
              operational data shown across this application is synthetic and generated for
              demonstration only. Not affiliated with, and does not represent, any government
              or Kumbh Mela administrative authority.
            </p>
          </div>
          <div className="flex gap-8 text-xs text-ink-muted">
            <div className="space-y-2">
              <div className="eyebrow text-ink-soft">Enter</div>
              <Link href="/login?role=pilgrim" className="block hover:text-ink">Pilgrim</Link>
              <Link href="/login?role=volunteer" className="block hover:text-ink">Volunteer</Link>
              <Link href="/login?role=management" className="block hover:text-ink">Management</Link>
            </div>
            <div className="space-y-2">
              <div className="eyebrow text-ink-soft">More</div>
              <Link href="/about" className="block hover:text-ink">How it works</Link>
              <Link href="/board" className="block hover:text-ink">Common Board</Link>
              <Link href="/enroll" className="block hover:text-ink">Volunteer sign-up</Link>
              <Link href="/demo" className="block hover:text-ink">Live demo</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
