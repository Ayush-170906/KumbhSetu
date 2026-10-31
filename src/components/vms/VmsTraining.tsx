"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import type { TrainingCategory, TrainingMode, TrainingSession } from "@/lib/volunteerTypes";
import { TRAINING_CATEGORY_LABELS } from "@/lib/volunteerTypes";
import { Field, inputClass, Modal, TrainingBadge, VmsStat } from "./vmsUi";

export function VmsTraining() {
  const store = useAppStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [enrollVolunteerId, setEnrollVolunteerId] = useState("");
  const [enrollNgoId, setEnrollNgoId] = useState(store.ngos[0]?.id || "");
  const [enrollMsg, setEnrollMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "crowd_management" as TrainingCategory,
    mode: "offline" as TrainingMode,
    trainer: "Chief Warden S. Deshmukh",
    venueOrLink: "Nashik Police Training Ground, Hall B",
    startAt: "2026-11-05T09:00",
    endAt: "2026-11-05T13:00",
    capacity: 100,
    attendanceRequired: true,
    completionCriteria: "Attendance + 80% on practical evacuation drill",
  });

  const totalSessions = store.trainingSessions.length;
  const totalEnrollments = store.trainingEnrollments.length;
  const totalCompleted = store.trainingEnrollments.filter((e) => e.status === "completed").length;

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) return;

    store.createTrainingSession({
      title: form.title,
      description: form.description,
      category: form.category,
      mode: form.mode,
      trainer: form.trainer,
      venueOrLink: form.venueOrLink,
      startAt: form.startAt,
      endAt: form.endAt,
      capacity: Number(form.capacity) || 50,
      attendanceRequired: form.attendanceRequired,
      completionCriteria: form.completionCriteria,
    });

    setShowCreateModal(false);
    setForm({
      title: "",
      description: "",
      category: "crowd_management",
      mode: "offline",
      trainer: "Chief Warden S. Deshmukh",
      venueOrLink: "Nashik Police Training Ground, Hall B",
      startAt: "2026-11-05T09:00",
      endAt: "2026-11-05T13:00",
      capacity: 100,
      attendanceRequired: true,
      completionCriteria: "Attendance + 80% on practical evacuation drill",
    });
  }

  function handleEnrollVolunteer() {
    if (!selectedSession || !enrollVolunteerId) return;
    const res = store.enrollInTraining(selectedSession.id, enrollVolunteerId);
    if (!res.ok) {
      setEnrollMsg(res.error || "Enrollment failed");
    } else {
      setEnrollMsg(`Volunteer ${enrollVolunteerId} enrolled successfully.`);
      setEnrollVolunteerId("");
    }
  }

  function handleEnrollNgo() {
    if (!selectedSession || !enrollNgoId) return;
    const res = store.enrollNgoInTraining(selectedSession.id, enrollNgoId);
    setEnrollMsg(`Batch enrolled ${res.enrolled} volunteers from NGO (${res.skipped} skipped/capacity reached).`);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">Capacity Building</p>
          <h1 className="font-editorial text-2xl text-ink">Training Management</h1>
          <p className="text-xs text-ink-muted">
            Online, offline & hybrid training sessions, attendance tracking and certification criteria.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
          <span className="mr-1.5 font-bold">+</span>
          New Training Session
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <VmsStat label="Scheduled Sessions" value={totalSessions} />
        <VmsStat label="Total Enrolled" value={totalEnrollments} />
        <VmsStat label="Training Completed" value={totalCompleted} tone="green" />
        <VmsStat
          label="Pass Rate"
          value={totalEnrollments > 0 ? `${Math.round((totalCompleted / totalEnrollments) * 100)}%` : "0%"}
          tone="green"
        />
      </div>

      {/* Sessions Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {store.trainingSessions.map((session) => {
          const enrollments = store.trainingEnrollments.filter((e) => e.sessionId === session.id);
          const completedCount = enrollments.filter((e) => e.status === "completed").length;

          return (
            <div
              key={session.id}
              onClick={() => {
                setSelectedSession(session);
                setEnrollMsg(null);
              }}
              className="cursor-pointer border border-border bg-surface p-4 shadow-card hover:border-primary transition-colors space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono-num text-[10px] font-bold text-primary">{session.id}</span>
                  <h3 className="font-semibold text-sm text-ink">{session.title}</h3>
                  <p className="text-[11px] text-ink-soft">{TRAINING_CATEGORY_LABELS[session.category]}</p>
                </div>
                <span className="rounded bg-surface-muted px-2 py-0.5 text-[10px] uppercase font-semibold text-ink-muted">
                  {session.mode}
                </span>
              </div>

              <p className="text-xs text-ink-muted line-clamp-2">{session.description}</p>

              <div className="border-t border-border pt-2 grid grid-cols-2 gap-1 text-[11px] text-ink-soft">
                <div><strong>Trainer:</strong> {session.trainer}</div>
                <div><strong>Venue:</strong> {session.venueOrLink}</div>
                <div><strong>Capacity:</strong> {enrollments.length} / {session.capacity}</div>
                <div><strong>Certified:</strong> {completedCount}</div>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-border">
                <span className="text-[10px] text-ink-soft font-mono-num">
                  {session.startAt.slice(0, 10)} ({session.startAt.slice(11, 16)} - {session.endAt.slice(11, 16)})
                </span>
                <span className="text-xs font-semibold text-primary">Manage Session →</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Session Details & Attendance Modal */}
      {selectedSession && (
        <Modal
          open={true}
          title={`Training Session: ${selectedSession.title}`}
          onClose={() => setSelectedSession(null)}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2 border border-border bg-surface-muted/40 p-3 text-ink">
              <div><strong>Category:</strong> {TRAINING_CATEGORY_LABELS[selectedSession.category]}</div>
              <div><strong>Mode:</strong> {selectedSession.mode.toUpperCase()}</div>
              <div><strong>Trainer:</strong> {selectedSession.trainer}</div>
              <div><strong>Venue:</strong> {selectedSession.venueOrLink}</div>
              <div className="col-span-2"><strong>Criteria:</strong> {selectedSession.completionCriteria}</div>
            </div>

            {/* Quick Enrollment Controls */}
            <div className="rounded border border-border bg-surface p-3 space-y-3">
              <h4 className="font-semibold text-ink">Enroll Volunteers</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex gap-1.5">
                  <select
                    value={enrollVolunteerId}
                    onChange={(e) => setEnrollVolunteerId(e.target.value)}
                    className="h-8 flex-1 border border-border bg-surface px-2 text-xs"
                  >
                    <option value="">Select Volunteer...</option>
                    {store.volunteers.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.id})
                      </option>
                    ))}
                  </select>
                  <Button size="sm" variant="outline" onClick={handleEnrollVolunteer}>
                    Enroll
                  </Button>
                </div>

                <div className="flex gap-1.5">
                  <select
                    value={enrollNgoId}
                    onChange={(e) => setEnrollNgoId(e.target.value)}
                    className="h-8 flex-1 border border-border bg-surface px-2 text-xs"
                  >
                    {store.ngos.map((ngo) => (
                      <option key={ngo.id} value={ngo.id}>
                        Batch: {ngo.name}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" variant="outline" onClick={handleEnrollNgo}>
                    Batch Enroll
                  </Button>
                </div>
              </div>

              {enrollMsg && (
                <p className="text-[11px] font-medium text-primary">{enrollMsg}</p>
              )}
            </div>

            {/* Enrolled Volunteers Table */}
            <div>
              <h4 className="font-semibold text-ink mb-2">
                Enrolled Roster ({store.trainingEnrollments.filter((e) => e.sessionId === selectedSession.id).length} volunteers)
              </h4>
              <div className="max-h-60 overflow-y-auto border border-border">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-surface-muted border-b border-border text-ink-soft sticky top-0">
                    <tr>
                      <th className="p-2">Volunteer</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Score</th>
                      <th className="p-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {store.trainingEnrollments
                      .filter((e) => e.sessionId === selectedSession.id)
                      .map((enr) => {
                        const vol = store.volunteers.find((v) => v.id === enr.volunteerId);

                        return (
                          <tr key={enr.id}>
                            <td className="p-2">
                              <span className="font-semibold text-ink">{vol?.name || enr.volunteerId}</span>
                              <div className="text-[10px] text-ink-soft">{enr.volunteerId}</div>
                            </td>
                            <td className="p-2">
                              <TrainingBadge status={enr.status} />
                            </td>
                            <td className="p-2 font-mono-num">{enr.assessmentScore ?? "—"}</td>
                            <td className="p-2 text-right space-x-1">
                              {enr.status === "enrolled" && (
                                <button
                                  type="button"
                                  onClick={() => store.markTrainingAttendance(selectedSession.id, enr.volunteerId, true)}
                                  className="text-status-green hover:underline"
                                >
                                  Mark Present
                                </button>
                              )}
                              {enr.status !== "completed" && (
                                <button
                                  type="button"
                                  onClick={() => store.completeTraining(selectedSession.id, enr.volunteerId, 90)}
                                  className="text-primary hover:underline font-semibold ml-2"
                                >
                                  Pass & Certify
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    {store.trainingEnrollments.filter((e) => e.sessionId === selectedSession.id).length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-ink-soft">
                          No volunteers currently enrolled in this session.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end border-t border-border pt-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedSession(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Session Modal */}
      <Modal open={showCreateModal} title="Create New Training Session" onClose={() => setShowCreateModal(false)}>
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <Field label="Session Title *">
            <input
              required
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Ramkund Ghat Crowd Evacuation Protocols"
              className={inputClass}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as TrainingCategory })}
                className={inputClass}
              >
                {Object.entries(TRAINING_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Mode">
              <select
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value as TrainingMode })}
                className={inputClass}
              >
                <option value="offline">Offline (In-Person Practical)</option>
                <option value="online">Online (Video Lecture)</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </Field>

            <Field label="Trainer / Master Instructor">
              <input
                type="text"
                value={form.trainer}
                onChange={(e) => setForm({ ...form, trainer: e.target.value })}
                className={inputClass}
              />
            </Field>

            <Field label="Capacity Headcount">
              <input
                type="number"
                min="1"
                max="500"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Venue or Meeting Link">
            <input
              type="text"
              value={form.venueOrLink}
              onChange={(e) => setForm({ ...form, venueOrLink: e.target.value })}
              className={inputClass}
            />
          </Field>

          <Field label="Completion Criteria">
            <input
              type="text"
              value={form.completionCriteria}
              onChange={(e) => setForm({ ...form, completionCriteria: e.target.value })}
              className={inputClass}
            />
          </Field>

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save & Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
