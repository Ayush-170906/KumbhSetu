import type { Metadata } from "next";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { CommonBoard } from "@/components/board/CommonBoard";

export const metadata: Metadata = {
  title: "Common Operations Board · Kumbh Setu",
  description:
    "One shared, read-only view of live incidents, zone status, notices, field reports and contacts across the pilgrim, volunteer and control-room apps.",
};

export default function BoardPage() {
  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-ivory text-ink-muted text-sm">
          Loading board…
        </div>
      }
    >
      <CommonBoard />
    </ClientOnly>
  );
}
