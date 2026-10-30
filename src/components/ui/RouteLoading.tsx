import { Icon } from "@/components/ui/Icon";

export function RouteLoading({ title, detail = "Preparing your local prototype session…" }: { title: string; detail?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-5" role="status" aria-live="polite">
      <div className="w-full max-w-sm border border-border bg-surface p-5 shadow-panel">
        <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center border border-border bg-surface-muted text-primary"><Icon name="route" className="h-5 w-5" /></span><div><h1 className="text-sm font-semibold text-ink">{title}</h1><p className="mt-0.5 text-xs text-ink-muted">{detail}</p></div></div>
        <div className="mt-5 h-1 overflow-hidden bg-surface-sunk"><div className="h-full w-1/3 animate-pulse bg-primary" /></div>
      </div>
    </div>
  );
}
