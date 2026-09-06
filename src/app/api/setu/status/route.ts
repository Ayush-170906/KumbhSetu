import { NextResponse } from "next/server";
import { setuStatus } from "@/lib/serverEnv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Booleans only — tells the client which capabilities have a live Sarvam path.
// No key, no model IDs, nothing sensitive.
export function GET() {
  return NextResponse.json(setuStatus(), {
    headers: { "cache-control": "no-store" },
  });
}
