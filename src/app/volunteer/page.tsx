import { ClientOnly } from "@/components/ui/ClientOnly";
import VolunteerApp from "@/components/volunteer/VolunteerApp";

export default function VolunteerPage() {
  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-ivory text-ink-muted text-sm">
          Loading field app…
        </div>
      }
    >
      <VolunteerApp />
    </ClientOnly>
  );
}
