import type { Metadata } from "next";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { CommonBoard } from "@/components/board/CommonBoard";
import { RouteLoading } from "@/components/ui/RouteLoading";

export const metadata: Metadata = {
  title: "Common Operations Board · Kumbh Setu",
  description:
    "A shared local prototype view of sample incidents, zone status, notices, field reports and public emergency contacts.",
};

export default function BoardPage() {
  return (
    <ClientOnly
      fallback={<RouteLoading title="Loading operations board" />}
    >
      <CommonBoard />
    </ClientOnly>
  );
}
