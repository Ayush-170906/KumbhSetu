"use client";

import { useSyncExternalStore, type ReactNode } from "react";

// A store that is `false` on the server / first client render and `true`
// after hydration — without calling setState inside an effect.
const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Renders children only after client-side mount. Used for the three live
 * role experiences, which read from a client-only Zustand store and render
 * timestamps/simulation state that would otherwise mismatch between server
 * and client render passes.
 */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const mounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
  return <>{mounted ? children : fallback}</>;
}
