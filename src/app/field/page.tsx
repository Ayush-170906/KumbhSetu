import { ClientOnly } from "@/components/ui/ClientOnly";
import { FieldHome } from "@/components/setu/FieldHome";

export const metadata = {
  title: "Kumbh Setu AI — Field Companion",
  description:
    "Voice-first AI companion for volunteers on the ground — ask, translate, read photos, report and act, grounded in live operational data.",
};

export default function FieldPage() {
  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-ivory text-ink-muted text-sm">
          Waking Setu…
        </div>
      }
    >
      <FieldHome />
    </ClientOnly>
  );
}
