"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/store/useAppStore";
import { subscribeToRealtimeEvents } from "@/lib/api";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SetuCompanion } from "./SetuCompanion";
import { FieldStatus } from "./FieldStatus";
import { AvailabilityHeader } from "@/components/volunteer/AvailabilityHeader";
import { TaskDetail } from "@/components/volunteer/TaskDetail";
import { EmptyQueue } from "@/components/volunteer/EmptyQueue";
import { ZoneChat } from "@/components/volunteer/ZoneChat";
import { StatusPill } from "@/components/ui/StatusPill";
import { severityLabel, severityTone, statusLabel, typeLabel } from "@/lib/incidentMeta";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

type FieldTab = "companion" | "tasks" | "team";

function initialTab(): FieldTab {
  if (typeof window === "undefined") return "tasks";
  const raw = new URLSearchParams(window.location.search).get("tab");
  if (raw === "tasks" || raw === "task") return "tasks";
  if (raw === "team" || raw === "chat") return "team";
  return "tasks";
}

/**
 * The volunteer's single primary surface (§37). Assigned tasks are the default;
 * Setu AI and Team are one thumb-tap away on the same screen. This replaces the
 * separate /volunteer app — that route now redirects here.
 */
export function FieldHome() {
  const store = useAppStore();
  const [volunteerId, setVolunteerId] = useState("V-218");
  const [tab, setTab] = useState<FieldTab>(initialTab);
  const [toast, setToast] = useState<{ kind: string; id: string } | null>(null);
  const [taskView, setTaskView] = useState<"active" | "history">("active");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskSearch, setTaskSearch] = useState("");

  useEffect(() => {
    subscribeToRealtimeEvents();
  }, []);

  const volunteer = store.volunteers.find((v) => v.id === volunteerId) ?? store.volunteers[0];
  const zone = store.zones.find((z) => z.id === volunteer.zoneId);

  const volunteerTasks = store.tasks
    .filter((item) => item.assigneeId === volunteer.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const activeTasks = volunteerTasks.filter((item) => !["resolved", "escalated", "cancelled"].includes(item.state));
  const completedTasks = volunteerTasks.filter((item) => ["resolved", "escalated", "cancelled"].includes(item.state));
  const matchingTasks = activeTasks.filter((item) => {
    const inc = store.incidents.find((entry) => entry.id === item.incidentId);
    const text = `${inc?.code ?? ""} ${inc?.summary ?? ""} ${inc?.zoneId ?? ""}`.toLowerCase();
    return text.includes(taskSearch.trim().toLowerCase());
  });
  const activeTask = matchingTasks.find((item) => item.id === selectedTaskId) ?? matchingTasks[0] ?? (taskSearch.trim() ? undefined : activeTasks[0]);
  const activeIncident = activeTask ? store.incidents.find((i) => i.id === activeTask.incidentId) : undefined;
  const otherVolunteers = store.volunteers.filter((v) => v.id !== volunteer.id && v.zoneId === volunteer.zoneId);
  const zoneMessages = store.messages.filter((m) => m.zoneId === volunteer.zoneId);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  // A freshly dispatched task the volunteer hasn't accepted yet — surfaced as a
  // banner (not an auto tab-switch) so the hand-off is obvious without yanking
  // the screen out from under them.
  const incomingTask = activeTask && activeTask.state === "assigned" && tab !== "tasks";

  const tabs: { id: FieldTab; label: string; icon: IconName; badge?: number }[] = [
    { id: "companion", label: "Setu AI", icon: "pulse" },
    { id: "tasks", label: "Tasks", icon: "volunteer", badge: activeTask ? 1 : 0 },
    { id: "team", label: "Team", icon: "bell", badge: zoneMessages.length },
  ];

  return (
    <div className="min-h-screen bg-ivory flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-ivory flex flex-col border-x border-border">
        <header className="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-border bg-surface sticky top-0 z-20">
          <Link
            href="/"
            className="flex h-8 w-8 -ml-1 items-center justify-center rounded-[7px] bg-secondary text-white"
            aria-label="Home"
          >
            <Icon name="route" className="h-4 w-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-ink leading-tight">Field Mode</div>
            <div className="text-[11px] text-ink-soft leading-tight truncate">
              {greeting()}, {volunteer.name.split(" ").slice(-1)[0]} · {zone?.shortName ?? volunteer.zoneId}
            </div>
          </div>
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
            visible in this browser’s management demo.
          </div>
        )}

        {incomingTask && (
          <button
            onClick={() => setTab("tasks")}
            className="mx-3 mt-2 flex items-center gap-2 rounded-sm border border-primary bg-primary-soft px-3 py-2.5 text-left text-xs font-semibold text-primary-soft-ink animate-fade-in-up"
          >
            <Icon name="bell" className="h-4 w-4 shrink-0" />
            <span className="flex-1">
              New task assigned near {zone?.shortName ?? volunteer.zoneId} — review and accept
            </span>
            <Icon name="arrow-right" className="h-3.5 w-3.5 shrink-0" />
          </button>
        )}

        {/* ---- Setu AI (default) ---- */}
        {tab === "companion" && (
          <SetuCompanion
            key={volunteerId}
            volunteerId={volunteerId}
            variant="full"
            onCreated={(kind, id) => setToast({ kind, id })}
            emptyStateExtra={<FieldStatus volunteer={volunteer} zone={zone} />}
          />
        )}

        {/* ---- Tasks ---- */}
        {tab === "tasks" && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto scroll-thin">
            <AvailabilityHeader
              volunteer={volunteer}
              zone={zone}
              locked={!!activeTask}
              onChangeAvailability={(a) => store.setVolunteerAvailability(volunteer.id, a)}
            />
            <section className="border-b border-border bg-surface px-4 py-3" aria-label="Assigned task queue">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-ink">My assignments</h2>
                  <p className="text-[11px] text-ink-soft">Sample tasks · this browser only</p>
                </div>
                <div className="flex border border-border" role="group" aria-label="Task queue view">
                  <button type="button" onClick={() => setTaskView("active")} aria-pressed={taskView === "active"} className={`min-h-10 px-3 text-xs font-medium ${taskView === "active" ? "bg-secondary text-white" : "bg-surface text-ink-muted"}`}>Active {activeTasks.length}</button>
                  <button type="button" onClick={() => setTaskView("history")} aria-pressed={taskView === "history"} className={`min-h-10 border-l border-border px-3 text-xs font-medium ${taskView === "history" ? "bg-secondary text-white" : "bg-surface text-ink-muted"}`}>History {completedTasks.length}</button>
                </div>
              </div>
              {taskView === "active" && activeTasks.length > 1 && (
                <div className="mt-3 space-y-1.5">
                  <label className="sr-only" htmlFor="task-search">Search assigned tasks</label>
                  <input id="task-search" value={taskSearch} onChange={(event) => setTaskSearch(event.target.value)} placeholder="Search task or location" className="h-10 w-full border border-border bg-ivory px-3 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" />
                  {matchingTasks.map((item) => {
                    const inc = store.incidents.find((entry) => entry.id === item.incidentId);
                    const itemZone = store.zones.find((entry) => entry.id === inc?.zoneId);
                    if (!inc) return null;
                    return <button key={item.id} type="button" onClick={() => setSelectedTaskId(item.id)} aria-pressed={activeTask?.id === item.id} className={`flex min-h-11 w-full items-center justify-between gap-2 border px-3 py-2 text-left ${activeTask?.id === item.id ? "border-primary bg-primary-soft/50" : "border-border bg-surface"}`}><span className="min-w-0"><span className="block truncate text-xs font-semibold text-ink">{typeLabel(inc.type)} · {itemZone?.shortName ?? inc.zoneId}</span><span className="block truncate text-[10px] text-ink-soft">{inc.code} · {statusLabel(inc.status)}</span></span><StatusPill tone={severityTone(inc.severity)}>{severityLabel(inc.severity)}</StatusPill></button>;
                  })}
                  {matchingTasks.length === 0 && <p className="px-1 py-2 text-xs text-ink-soft">No assigned tasks match that search.</p>}
                </div>
              )}
            </section>
            {taskView === "history" ? (
              <div className="space-y-2 p-4">
                {completedTasks.length === 0 ? <p className="border border-dashed border-border p-4 text-xs text-ink-soft">Completed and escalated assignments will appear here.</p> : completedTasks.map((item) => {
                  const inc = store.incidents.find((entry) => entry.id === item.incidentId);
                  const itemZone = store.zones.find((entry) => entry.id === inc?.zoneId);
                  return <article key={item.id} className="flex items-center justify-between gap-3 border border-border bg-surface p-3"><div className="min-w-0"><h3 className="truncate text-xs font-semibold text-ink">{inc ? `${typeLabel(inc.type)} · ${itemZone?.shortName ?? inc.zoneId}` : "Assignment"}</h3><p className="mt-1 text-[10px] text-ink-soft">{inc?.code ?? "Sample task"} · {item.resolvedAt ? new Date(item.resolvedAt).toLocaleString() : "Closed"}</p></div><StatusPill tone={item.state === "resolved" ? "green" : item.state === "escalated" ? "yellow" : "neutral"}>{item.state}</StatusPill></article>;
                })}
              </div>
            ) : activeTasks.length > 1 && taskSearch.trim() && !activeTask ? (
              <p className="m-4 border border-dashed border-border p-4 text-xs text-ink-soft">No assigned tasks match that search. Clear the search to return to your queue.</p>
            ) : activeTask && activeIncident ? (
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
                onAddNote={(note) => store.addIncidentNote(activeIncident.id, note, `${volunteer.name} · ${volunteer.id}`)}
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
            )}
          </div>
        )}

        {/* ---- Team ---- */}
        {tab === "team" && (
          <ZoneChat
            zone={zone}
            volunteer={volunteer}
            messages={zoneMessages}
            onSend={(text) =>
              store.sendZoneMessage({
                zoneId: volunteer.zoneId,
                senderId: volunteer.id,
                senderName: volunteer.name,
                text,
              })
            }
          />
        )}

        <nav className="shrink-0 grid grid-cols-3 border-t border-border bg-surface">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
                tab === tb.id ? "text-primary" : "text-ink-soft hover:text-ink-muted"
              }`}
            >
              <Icon name={tb.icon} className="h-[18px] w-[18px]" />
              {tb.label}
              {!!tb.badge && tb.badge > 0 && (
                <span className="absolute right-[22%] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-white">
                  {tb.badge}
                </span>
              )}
              {tab === tb.id && <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-primary" />}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
