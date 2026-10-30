"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error("Kumbh Setu root error", error); }, [error]);
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f7f1e6] text-[#241a12]">
        <main className="flex min-h-screen items-center justify-center px-5 py-10">
          <section className="w-full max-w-lg border border-[#e5b7ab] bg-[#fffdf8] p-6 shadow-lg sm:p-8" role="alert">
            <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#a8382a]">Kumbh Setu</p>
            <h1 className="mt-2 font-serif text-2xl">The application could not load.</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#6d5f4d]">Try again. Your local prototype data is not intentionally reset by this screen.</p>
            {error.digest && <p className="mt-3 font-mono text-xs text-[#9c8d76]">Reference {error.digest}</p>}
            <Button className="mt-5" onClick={retry}>Try again</Button>
          </section>
        </main>
      </body>
    </html>
  );
}
