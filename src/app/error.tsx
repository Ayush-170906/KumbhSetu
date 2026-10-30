"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Kumbh Setu route error", error); }, [error]);
  return (
    <main className="flex min-h-screen items-center justify-center bg-ivory px-5 py-10">
      <section className="w-full max-w-lg border border-status-red-border bg-surface p-6 shadow-panel sm:p-8" role="alert">
        <p className="eyebrow text-status-red">This view could not load</p>
        <h1 className="mt-2 font-editorial text-2xl text-ink">Something interrupted this page.</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">Your local prototype data has not been reset. Try loading this view again or return to the home page.</p>
        {error.digest && <p className="mt-3 font-mono-num text-[11px] text-ink-soft">Reference {error.digest}</p>}
        <div className="mt-5 flex flex-wrap gap-2"><Button onClick={reset}>Try again</Button><Link href="/" className="inline-flex min-h-11 items-center border border-border-strong px-4 text-sm font-semibold text-ink hover:bg-surface-muted">Return home</Link></div>
      </section>
    </main>
  );
}
