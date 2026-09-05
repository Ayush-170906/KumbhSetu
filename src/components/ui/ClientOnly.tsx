"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Renders children only after client-side mount. Used for the three live
 * role experiences, which read from a client-only Zustand store and render
 * timestamps/simulation state that would otherwise mismatch between server
 * and client render passes.
 */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}
