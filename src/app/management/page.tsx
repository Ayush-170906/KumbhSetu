import { ClientOnly } from "@/components/ui/ClientOnly";
import { AuthGate } from "@/components/auth/AuthGate";
import ManagementApp from "@/components/management/ManagementApp";
import { RouteLoading } from "@/components/ui/RouteLoading";

export default function ManagementPage() {
  return (
    <ClientOnly
      fallback={<RouteLoading title="Opening the control room" detail="Loading sample incidents and map context…" />}
    >
      <AuthGate area="management">
        <ManagementApp />
      </AuthGate>
    </ClientOnly>
  );
}
