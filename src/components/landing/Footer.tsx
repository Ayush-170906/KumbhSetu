import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-12">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="text-sm font-semibold text-ink">Kumbh Setu</div>
          <p className="text-xs text-ink-soft mt-2 max-w-md leading-relaxed">
            A prototype civic-technology concept built for Kumbhathon S.P.R.I.N.T. All data shown across this
            application is synthetic and generated for demonstration only. Not affiliated with, and does not
            represent, any government or Kumbh Mela administrative authority.
          </p>
        </div>
        <div className="flex gap-6 text-xs text-ink-muted">
          <Link href="/pilgrim" className="hover:text-ink">Pilgrim</Link>
          <Link href="/volunteer" className="hover:text-ink">Volunteer</Link>
          <Link href="/management" className="hover:text-ink">Management</Link>
          <Link href="/demo" className="hover:text-ink">Demo</Link>
        </div>
      </div>
    </footer>
  );
}
