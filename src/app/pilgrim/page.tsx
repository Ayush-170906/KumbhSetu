import { ClientOnly } from "@/components/ui/ClientOnly";
import PilgrimApp from "@/components/pilgrim/PilgrimApp";

export default function PilgrimPage() {
  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-ivory text-ink-muted text-sm">
          Loading Kumbh Setu…
        </div>
      }
    >
      <PilgrimApp />
    </ClientOnly>
  );
}
