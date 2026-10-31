"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import type { AttendanceKind, AttendanceMethod, AttendanceRecord, AttendanceStatus } from "@/lib/volunteerTypes";
import { Field, inputClass, Modal, VmsBanner, VmsStat } from "./vmsUi";

export function VmsAttendance() {
  const store = useAppStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [filterStatus, setFilterStatus] = useState<AttendanceStatus | "all">("all");
  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [correctingRecord, setCorrectingRecord] = useState<AttendanceRecord | null>(null);

  const [correctionStatus, setCorrectionStatus] = useState<AttendanceStatus>("present");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionActor, setCorrectionActor] = useState("Shift Supervisor Desk");

  const [form, setForm] = useState({
    volunteerId: store.volunteers[0]?.id || "",
    kind: "deployment" as AttendanceKind,
    status: "present" as AttendanceStatus,
    method: "manual" as AttendanceMethod,
    markedBy: "Duty Officer",
    sessionId: "general",
  });

  const [markError, setMarkError] = useState<string | null>(null);

  const recordsToday = useMemo(() => {
    return store.attendanceRecords.filter((r) => r.date === selectedDate);
  }, [store.attendanceRecords, selectedDate]);

  const stats = useMemo(() => {
    return {
      present: recordsToday.filter((r) => r.status === "present").length,
      late: recordsToday.filter((r) => r.status === "late").length,
      absent: recordsToday.filter((r) => r.status === "absent").length,
      leave: recordsToday.filter((r) => r.status === "leave").length,
      total: recordsToday.length,
    };
  }, [recordsToday]);

  const filteredRecords = useMemo(() => {
    if (filterStatus === "all") return recordsToday;
    return recordsToday.filter((r) => r.status === filterStatus);
  }, [recordsToday, filterStatus]);

  function handleMarkAttendance(e: React.FormEvent) {
    e.preventDefault();
    setMarkError(null);
    const res = store.markAttendance({
      ...form,
      date: selectedDate,
    });
    if (!res.ok) {
      setMarkError(res.error || "Attendance record conflict");
      return;
    }
    setMarkModalOpen(false);
  }

  function handleApplyCorrection() {
    if (!correctingRecord) return;
    store.correctAttendance(
      correctingRecord.id,
      correctionStatus,
      correctionActor,
      correctionReason || "Administrative roll correction"
    );
    setCorrectingRecord(null);
    setCorrectionReason("");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">Ground Presence</p>
          <h1 className="font-editorial text-2xl text-ink">Attendance Management</h1>
          <p className="text-xs text-ink-muted">
            Shift muster roll, live check-ins, punctuality metrics and auditable attendance corrections.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-8 border border-border bg-surface px-2 text-xs font-mono-num text-ink"
          />
          <Button variant="primary" size="sm" onClick={() => setMarkModalOpen(true)}>
            <Icon name="clock" className="mr-1.5 h-3.5 w-3.5" />
            Mark Muster Roll
          </Button>
        </div>
      </div>

      <VmsBanner />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <VmsStat label="Marked Today" value={stats.total} />
        <VmsStat label="Present" value={stats.present} tone="green" />
        <VmsStat label="Late Arrivals" value={stats.late} tone="amber" />
        <VmsStat label="Reported Absent" value={stats.absent} tone="red" />
        <VmsStat label="On Leave" value={stats.leave} />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 text-xs">
        <div className="flex flex-wrap gap-1.5">
          {[
            ["all", "All Records"],
            ["present", "Present"],
            ["late", "Late"],
            ["absent", "Absent"],
            ["leave", "On Leave"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilterStatus(id as typeof filterStatus)}
              className={`rounded-sm border px-2.5 py-1 transition-colors ${
                filterStatus === id
                  ? "border-primary bg-primary text-white font-medium"
                  : "border-border bg-surface text-ink-muted hover:bg-surface-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="font-mono-num text-ink-soft text-[11px]">
          {filteredRecords.length} records on {selectedDate}
        </span>
      </div>

      {/* Attendance Records Table */}
      <div className="overflow-x-auto border border-border bg-surface shadow-card">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-surface-muted/60 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
            <tr>
              <th className="p-3">Volunteer</th>
              <th className="p-3">Muster Category</th>
              <th className="p-3">Check-In / Out</th>
              <th className="p-3">Status</th>
              <th className="p-3">Method & Attestation</th>
              <th className="p-3">Corrections Audit</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-ink">
            {filteredRecords.map((rec) => {
              const vol = store.volunteers.find((v) => v.id === rec.volunteerId);

              return (
                <tr key={rec.id} className="hover:bg-surface-muted/40 transition-colors">
                  <td className="p-3">
                    <div className="font-semibold text-ink">{vol?.name || rec.volunteerId}</div>
                    <div className="font-mono-num text-[10px] text-ink-soft">{rec.volunteerId}</div>
                  </td>
                  <td className="p-3 capitalize text-ink">
                    {rec.kind} ({rec.sessionId})
                  </td>
                  <td className="p-3 font-mono-num text-ink">
                    <div>In: {rec.checkInAt ? rec.checkInAt.slice(11, 16) : rec.markedAt.slice(11, 16)}</div>
                    {rec.checkOutAt && (
                      <div className="text-[10px] text-ink-soft">Out: {rec.checkOutAt.slice(11, 16)}</div>
                    )}
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        rec.status === "present"
                          ? "bg-status-green-bg text-status-green border border-status-green-border"
                          : rec.status === "late"
                          ? "bg-status-amber-bg text-status-amber border border-status-amber-border"
                          : "bg-status-red-bg text-status-red border border-status-red-border"
                      }`}
                    >
                      {rec.status}
                    </span>
                  </td>
                  <td className="p-3 text-ink-muted">
                    <div>Method: {rec.method.toUpperCase()}</div>
                    <div className="text-[10px] text-ink-soft">By: {rec.markedBy}</div>
                  </td>
                  <td className="p-3">
                    {rec.corrections.length > 0 ? (
                      <span className="font-semibold text-status-amber text-[10px]">
                        {rec.corrections.length} correction(s) recorded
                      </span>
                    ) : (
                      <span className="text-[10px] text-ink-soft">Original mark</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCorrectingRecord(rec);
                        setCorrectionStatus(rec.status);
                      }}
                    >
                      Audit / Correct
                    </Button>
                  </td>
                </tr>
              );
            })}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-ink-soft">
                  No attendance records logged for {selectedDate}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mark Muster Modal */}
      <Modal open={markModalOpen} title="Mark Attendance / Check-In" onClose={() => setMarkModalOpen(false)}>
        <form onSubmit={handleMarkAttendance} className="space-y-4 text-xs">
          {markError && (
            <div className="rounded bg-status-red-bg border border-status-red-border p-2 text-status-red">
              {markError}
            </div>
          )}

          <Field label="Volunteer *">
            <select
              value={form.volunteerId}
              onChange={(e) => setForm({ ...form, volunteerId: e.target.value })}
              className={inputClass}
            >
              {store.volunteers.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.id})
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Muster Category">
              <select
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value as AttendanceKind })}
                className={inputClass}
              >
                <option value="deployment">Deployment Duty</option>
                <option value="daily">Daily General Muster</option>
                <option value="shift">Shift Specific</option>
                <option value="training">Training Session</option>
              </select>
            </Field>

            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as AttendanceStatus })}
                className={inputClass}
              >
                <option value="present">Present (On Time)</option>
                <option value="late">Late Arrival</option>
                <option value="absent">Absent</option>
                <option value="leave">Approved Leave</option>
              </select>
            </Field>

            <Field label="Verification Method">
              <select
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value as AttendanceMethod })}
                className={inputClass}
              >
                <option value="manual">Manual Roll Call</option>
                <option value="qr">QR Badge Scan</option>
                <option value="supervisor">Supervisor Spot-Check</option>
              </select>
            </Field>

            <Field label="Marking Officer">
              <input
                type="text"
                value={form.markedBy}
                onChange={(e) => setForm({ ...form, markedBy: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setMarkModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Log Attendance
            </Button>
          </div>
        </form>
      </Modal>

      {/* Attendance Correction Modal */}
      {correctingRecord && (
        <Modal
          open={true}
          title={`Correct Attendance Record — ${correctingRecord.volunteerId}`}
          onClose={() => setCorrectingRecord(null)}
        >
          <div className="space-y-4 text-xs">
            <div className="border border-border bg-surface-muted/40 p-3 text-ink">
              <div><strong>Current Recorded Status:</strong> {correctingRecord.status.toUpperCase()}</div>
              <div><strong>Recorded At:</strong> {correctingRecord.markedAt.slice(0, 16).replace("T", " ")}</div>
              <div><strong>Original Method:</strong> {correctingRecord.method}</div>
            </div>

            <Field label="Corrected Status">
              <select
                value={correctionStatus}
                onChange={(e) => setCorrectionStatus(e.target.value as AttendanceStatus)}
                className={inputClass}
              >
                <option value="present">Present</option>
                <option value="late">Late Arrival</option>
                <option value="early_departure">Early Departure</option>
                <option value="absent">Absent</option>
                <option value="leave">Approved Leave</option>
              </select>
            </Field>

            <Field label="Auditing Officer / Role">
              <input
                type="text"
                value={correctionActor}
                onChange={(e) => setCorrectionActor(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Mandatory Reason for Roll Correction *">
              <textarea
                required
                rows={2}
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="e.g., Volunteer was on emergency medical transit escort during roll call"
                className="w-full border border-border bg-surface p-2 text-xs text-ink"
              />
            </Field>

            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button variant="outline" size="sm" onClick={() => setCorrectingRecord(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleApplyCorrection}>
                Save Audited Correction
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
