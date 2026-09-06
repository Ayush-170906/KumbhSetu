"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/store/useAppStore";
import { subscribeToRealtimeEvents } from "@/lib/api";
import { MobileShell } from "@/components/pilgrim/MobileShell";
import { AvailabilityHeader } from "./AvailabilityHeader";
import { TaskDetail } from "./TaskDetail";
import { EmptyQueue } from "./EmptyQueue";
import { ZoneChat } from "./ZoneChat";
import { SetuCompanion } from "@/components/setu/SetuCompanion";
import { Icon, type IconName } from "@/components/ui/Icon";

type Tab = "task" | "chat" | "assistant";

export default function VolunteerApp() {
  const store = useAppStore();
  const [volunteerId, setVolunteerId] = useState("V-218");
  const [tab, setTab] = useState<Tab>("task");

  useEffect(() => {
    subscribeToRealtimeEvents();
  }, []);

  const volunteer = store.volunteers.find((v) => v.id === volunteerId) ?? store.volunteers[0];
  const zone = store.zones.find((z) => z.id === volunteer.zoneId);
  const activeTask = store.tasks.find(
    (t) => t.assigneeId === volunteer.id && !["resolved", "escalated", "cancelled"].includes(t.state)
  );
  const activeIncident = activeTask ? store.incidents.find((i) => i.id === activeTask.incidentId) : undefined;
  const otherVolunteers = store.volunteers.filter((v) => v.id !== volunteer.id && v.zoneId === volunteer.zoneId);
  const zoneMessages = store.messages.filter((m) => m.zoneId === volunteer.zoneId);

  const tabs: { id: Tab; label: string; icon: IconName }[] = [
    { id: "task", label: "Task", icon: "volunteer" },
    { id: "chat", label: "Team Chat", icon: "bell" },
    { id: "assistant", label: "Ask Setu", icon: "pilgrim" },
  ];

  return (
    <MobileShell
      title="Kumbh Setu · Field"
      right={
        <div className="flex items-center gap-2">
          <Link
            href="/board"
            className="flex items-center gap-1 text-[11px] text-ink-soft hover:text-ink"
            title="Common Operations Board"
          >
            <Icon name="layers" className="h-3.5 w-3.5" />
            Board
          </Link>
          <select
            value={volunteerId}
            onChange={(e) => setVolunteerId(e.target.value)}
            className="text-[11px] text-ink-muted bg-transparent border border-border rounded-sm px-1.5 py-1 focus:outline-none"
            title="Simulate as volunteer"
          >
            {store.volunteers.map((v) => (
              <option key={v.id} value={v.id}>{v.id}</option>
            ))}
          </select>
        </div>
      }
    >
      <AvailabilityHeader
        volunteer={volunteer}
        zone={zone}
        locked={!!activeTask}
        onChangeAvailability={(a) => store.setVolunteerAvailability(volunteer.id, a)}
      />

      <div className="flex border-b border-border bg-surface shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              tab === t.id ? "border-primary text-primary-dark" : "border-transparent text-ink-soft"
            }`}
          >
            <Icon name={t.icon} className="h-3.5 w-3.5" />
            {t.label}
            {t.id === "chat" && zoneMessages.length > 0 && (
              <span className="text-[10px] bg-surface-muted rounded-full px-1.5">{zoneMessages.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "task" &&
        (activeTask && activeIncident ? (
          <TaskDetail
            task={activeTask}
            incident={activeIncident}
            volunteer={volunteer}
            zone={zone}
            otherVolunteers={otherVolunteers}
            onAccept={() => store.acceptTask(activeTask.id)}
            onDecline={() => store.declineTask(activeTask.id)}
            onArrive={() => store.arriveTask(activeTask.id)}
            onResolve={() => store.resolveTask(activeTask.id, "resolved")}
            onEscalate={() => store.resolveTask(activeTask.id, "escalated")}
            onAttachPhoto={(dataUrl) => store.attachPhoto(activeIncident.id, dataUrl, volunteer.id)}
          />
        ) : (
          <EmptyQueue
            availability={volunteer.availability}
            onSimulateTask={() =>
              store.submitSOS({
                type: "medical",
                severity: "moderate",
                zoneId: volunteer.zoneId,
                reportedBy: { role: "management", label: "Control Room (demo trigger)" },
                summary: `Assistance requested near ${zone?.shortName ?? volunteer.zoneId} — simulated for demo purposes.`,
              })
            }
          />
        ))}

      {tab === "chat" && (
        <ZoneChat
          zone={zone}
          volunteer={volunteer}
          messages={zoneMessages}
          onSend={(text) => store.sendZoneMessage({ zoneId: volunteer.zoneId, senderId: volunteer.id, senderName: volunteer.name, text })}
        />
      )}

      {tab === "assistant" && (
        <div className="flex-1 flex flex-col min-h-0">
          <Link
            href="/field"
            className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border bg-primary-soft text-primary-soft-ink text-xs font-medium"
          >
            <span className="flex items-center gap-1.5">
              <Icon name="arrow-up-right" className="h-3.5 w-3.5" />
              Open the full-screen Field Companion
            </span>
            <span className="text-[10px] uppercase tracking-wide opacity-70">voice-first</span>
          </Link>
          <SetuCompanion volunteerId={volunteer.id} variant="embedded" />
        </div>
      )}
    </MobileShell>
  );
}
