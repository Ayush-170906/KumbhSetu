import { ClientOnly } from "@/components/ui/ClientOnly";
import { VmsApp } from "@/components/vms/VmsApp";
import { RouteLoading } from "@/components/ui/RouteLoading";

export default function VolunteerPage() {
  return (
    <ClientOnly
      fallback={
        <RouteLoading
          title="Opening Volunteer Command Center"
          detail="Loading volunteer rosters, training modules, and deployment status…"
        />
      }
    >
      <VmsApp />
    </ClientOnly>
  );
}
