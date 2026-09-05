import { Icon, type IconName } from "@/components/ui/Icon";

export function StubScreen({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className="h-14 w-14 rounded-full bg-surface-muted flex items-center justify-center mb-4">
        <Icon name={icon} className="h-6 w-6 text-ink-muted" />
      </div>
      <h1 className="text-base font-semibold text-ink">{title}</h1>
      <p className="text-xs text-ink-muted mt-2 max-w-xs leading-relaxed">{body}</p>
      <div className="text-[10px] uppercase tracking-wide text-ink-soft mt-5 border border-border rounded-sm px-2 py-1">
        Planned for a later build phase
      </div>
    </div>
  );
}
