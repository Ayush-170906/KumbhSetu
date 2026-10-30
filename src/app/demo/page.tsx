import { ClientOnly } from "@/components/ui/ClientOnly";
import DemoApp from "@/components/demo/DemoApp";
import { RouteLoading } from "@/components/ui/RouteLoading";

export default function DemoPage() {
  return (
    <ClientOnly
      fallback={<RouteLoading title="Loading Demo Studio" detail="Preparing the isolated scenario…" />}
    >
      <DemoApp />
    </ClientOnly>
  );
}
