import { ClientOnly } from "@/components/ui/ClientOnly";
import ManagementApp from "@/components/management/ManagementApp";

export default function ManagementPage() {
  return (
    <ClientOnly
      fallback={
        <div className="h-screen flex items-center justify-center bg-ivory text-ink-muted text-sm">
          Loading control room…
        </div>
      }
    >
      <ManagementApp />
    </ClientOnly>
  );
}
