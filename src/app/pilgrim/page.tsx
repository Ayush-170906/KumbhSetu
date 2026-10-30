import { ClientOnly } from "@/components/ui/ClientOnly";
import { AuthGate } from "@/components/auth/AuthGate";
import PilgrimApp from "@/components/pilgrim/PilgrimApp";
import { RouteLoading } from "@/components/ui/RouteLoading";

export default function PilgrimPage() {
  return (
    <ClientOnly
      fallback={<RouteLoading title="Opening pilgrim companion" detail="Preparing language and assistance options…" />}
    >
      <AuthGate area="pilgrim">
        <PilgrimApp />
      </AuthGate>
    </ClientOnly>
  );
}
