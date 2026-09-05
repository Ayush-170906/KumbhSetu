import { ClientOnly } from "@/components/ui/ClientOnly";
import DemoApp from "@/components/demo/DemoApp";

export default function DemoPage() {
  return (
    <ClientOnly
      fallback={
        <div className="h-screen flex items-center justify-center bg-ivory text-ink-muted text-sm">
          Loading demo engine…
        </div>
      }
    >
      <DemoApp />
    </ClientOnly>
  );
}
