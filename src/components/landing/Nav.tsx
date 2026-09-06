import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

export function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-ivory/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-sm bg-secondary flex items-center justify-center">
            <Icon name="map-pin" className="h-4 w-4 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-ink">Kumbh Setu</div>
            <div className="text-[10px] uppercase tracking-wide text-ink-soft -mt-0.5">Connected Response Platform</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-ink-muted">
          <Link href="/pilgrim" className="hover:text-ink transition-colors">Pilgrim</Link>
          <Link href="/volunteer" className="hover:text-ink transition-colors">Volunteer</Link>
          <Link href="/management" className="hover:text-ink transition-colors">Management</Link>
          <Link href="/board" className="hover:text-ink transition-colors">Common Board</Link>
          <Link href="/enroll" className="hover:text-ink transition-colors">Volunteer sign-up</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/enroll" className="hidden sm:block">
            <Button size="sm" variant="outline">Register as a volunteer</Button>
          </Link>
          <Link href="/login">
            <Button size="sm" variant="ghost">Sign in</Button>
          </Link>
          <Link href="/demo">
            <Button size="sm">Run Live Demo</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
