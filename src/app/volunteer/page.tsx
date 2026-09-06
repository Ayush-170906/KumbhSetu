import { ClientOnly } from "@/components/ui/ClientOnly";
import { AuthGate } from "@/components/auth/AuthGate";
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
      <AuthGate area="volunteer">
        <VolunteerApp />
      </AuthGate>
    </ClientOnly>
  );
}
