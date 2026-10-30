import { ClientOnly } from "@/components/ui/ClientOnly";
import { AuthGate } from "@/components/auth/AuthGate";
import { FieldHome } from "@/components/setu/FieldHome";
import { RouteLoading } from "@/components/ui/RouteLoading";

export const metadata = {
  title: "Kumbh Setu AI — Field Companion",
  description:
    "Volunteer field companion prototype — review sample tasks, ask for guidance, translate and record demo actions.",
};

export default function FieldPage() {
  return (
    <ClientOnly
      fallback={<RouteLoading title="Opening field mode" detail="Loading assignments and response tools…" />}
    >
      <AuthGate area="volunteer">
        <FieldHome />
      </AuthGate>
    </ClientOnly>
  );
}
