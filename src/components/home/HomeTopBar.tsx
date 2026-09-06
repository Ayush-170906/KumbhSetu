import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

/**
 * Slim top bar for the immersive surfaces (Common Dashboard, About). On the
 * dashboard it sits transparent over the hero photo; `solid` gives it an opaque
 * ground for scrolled / non-photographic pages.
 */
export function HomeTopBar({ solid = false }: { solid?: boolean }) {
  return (
    <header
      className={
        solid
          ? "sticky top-0 z-40 border-b border-border bg-ivory/95 backdrop-blur"
          : "absolute inset-x-0 top-0 z-40"
      }
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-[7px] ${
              solid ? "bg-secondary" : "bg-white/15 ring-1 ring-white/25 backdrop-blur"
            }`}
          >
            <Icon name="route" className={solid ? "h-4 w-4 text-white" : "h-4 w-4 text-white"} />
          </span>
          <span className="leading-tight">
            <span
              className={`block text-sm font-semibold tracking-tight ${
                solid ? "text-ink" : "text-white"
              }`}
            >
              Kumbh Setu
            </span>
            <span
              className={`block text-[10px] uppercase tracking-[0.14em] -mt-0.5 ${
                solid ? "text-ink-soft" : "text-white/60"
              }`}
            >
              Connected Response
            </span>
          </span>
        </Link>

        <nav
          className={`hidden items-center gap-7 text-[13px] md:flex ${
            solid ? "text-ink-muted" : "text-white/75"
          }`}
        >
          <Link href="/about" className={solid ? "hover:text-ink" : "hover:text-white"}>
            How it works
          </Link>
          <Link href="/board" className={solid ? "hover:text-ink" : "hover:text-white"}>
            Common Board
          </Link>
          <Link href="/enroll" className={solid ? "hover:text-ink" : "hover:text-white"}>
            Volunteer sign-up
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/demo"
            className={`hidden rounded-[7px] px-3.5 py-2 text-[13px] font-medium transition-colors sm:block ${
              solid
                ? "border border-border-strong text-ink hover:bg-surface-muted"
                : "border border-white/25 text-white hover:bg-white/10"
            }`}
          >
            Watch the 5-min demo
          </Link>
          <Link
            href="/login"
            className={`rounded-[7px] px-3.5 py-2 text-[13px] font-semibold transition-colors ${
              solid
                ? "bg-primary text-white hover:bg-primary-dark"
                : "bg-white text-night hover:bg-gold-soft"
            }`}
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}
