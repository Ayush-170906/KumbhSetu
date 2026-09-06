"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/store/useAppStore";
import { subscribeToRealtimeEvents } from "@/lib/api";
import { Icon } from "@/components/ui/Icon";
import { SetuCompanion } from "./SetuCompanion";
import { FieldStatus } from "./FieldStatus";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * The volunteer's Setu-first home (§37). A phone-framed surface: identity +
 * greeting, then the companion itself as the primary interaction, with live
 * field status shown before a conversation starts.
 */
export function FieldHome() {
  const store = useAppStore();
  const [volunteerId, setVolunteerId] = useState("V-218");
  const [toast, setToast] = useState<{ kind: string; id: string } | null>(null);

  useEffect(() => {
    subscribeToRealtimeEvents();
  }, []);

  const volunteer = store.volunteers.find((v) => v.id === volunteerId) ?? store.volunteers[0];
  const zone = store.zones.find((z) => z.id === volunteer.zoneId);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="min-h-screen bg-ivory flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-ivory flex flex-col border-x border-border">
        <header className="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-border bg-surface sticky top-0 z-20">
          <Link href="/" className="p-1 -ml-1 text-ink-muted" aria-label="Home">
            <Icon name="map-pin" className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <div className="text-sm font-semibold text-ink leading-tight">Kumbh Setu AI</div>
            <div className="text-[11px] text-ink-soft leading-tight">
              {greeting()}, {volunteer.name.split(" ").slice(-1)[0]} · {zone?.shortName ?? volunteer.zoneId} · Volunteer
            </div>
          </div>
          <select
            value={volunteerId}
            onChange={(e) => setVolunteerId(e.target.value)}
            className="text-[11px] text-ink-muted bg-transparent border border-border rounded-sm px-1.5 py-1 focus:outline-none"
            title="Simulate as volunteer"
          >
            {store.volunteers.map((v) => (
              <option key={v.id} value={v.id}>
                {v.id}
              </option>
            ))}
          </select>
        </header>

        {toast && (
          <div className="mx-3 mt-2 rounded-sm border border-status-green-border bg-status-green-bg px-3 py-2 text-xs text-status-green flex items-center gap-2 animate-fade-in-up">
            <Icon name="check" className="h-3.5 w-3.5" />
            {toast.kind === "incident" ? "Incident" : toast.kind === "groundReport" ? "Field report" : "Task"} created —
            visible to the control room now.
          </div>
        )}

        <SetuCompanion
          key={volunteerId}
          volunteerId={volunteerId}
          variant="full"
          onCreated={(kind, id) => setToast({ kind, id })}
          emptyStateExtra={<FieldStatus volunteer={volunteer} zone={zone} />}
        />

        <nav className="shrink-0 flex items-center justify-around border-t border-border bg-surface py-1.5">
          <TabLink href="/field" label="Companion" icon="pilgrim" active />
          <TabLink href="/volunteer" label="Tasks" icon="volunteer" />
          <TabLink href="/board" label="Board" icon="layers" />
          <TabLink href="/management" label="Control Room" icon="management" />
        </nav>
      </div>
    </div>
  );
}

function TabLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: Parameters<typeof Icon>[0]["name"];
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium ${
        active ? "text-primary" : "text-ink-soft"
      }`}
    >
      <Icon name={icon} className="h-4 w-4" />
      {label}
    </Link>
  );
}
