"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import type { Deployment, DeploymentPriority, DeploymentShift } from "@/lib/volunteerTypes";
import type { LanguageCode, VolunteerCategory } from "@/lib/types";
import { generateRosterPreview, type RosterPreview } from "@/lib/volunteerOps";
import { Field, inputClass, Modal, VmsBanner, VmsStat } from "./vmsUi";

export function VmsDeploy() {
  const store = useAppStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const [preview, setPreview] = useState<RosterPreview | null>(null);
  const [reassignFromId, setReassignFromId] = useState<string | null>(null);
  const [reassignToId, setReassignToId] = useState("");
  const [reassignReason, setReassignReason] = useState("");

  const [form, setForm] = useState({
    name: "",
    location: "Ramkund Primary Access Gate",
    zoneId: store.zones[0]?.id || "z01",
    sector: "North Sector",
    dutyCategory: "crowd_management" as VolunteerCategory,
    shift: "morning" as DeploymentShift,
    date: new Date().toISOString().slice(0, 10),
    startTime: "06:00",
    endTime: "14:00",
    requiredCount: 8,
    skillsRequired: ["crowd_marshal"],
    languagesPreferred: ["mr", "hi"] as LanguageCode[],
    supervisor: "Inspector V. Kulkarni",
    priority: "high" as DeploymentPriority,
    requireVerified: true,
    requireTrained: true,
  });

  const totalDeployments = store.deployments.length;
  const activeDeployments = store.deployments.filter((d) => d.status === "active" || d.status === "published").length;
  const totalSlotsNeeded = store.deployments.reduce((sum, d) => sum + d.requiredCount, 0);
  const totalAssigned = store.rosterAssignments.length;

  function handleCreateDeployment(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;

    store.createDeployment({
      ...form,
      requiredCount: Number(form.requiredCount) || 5,
    });

    setShowCreateModal(false);
    setForm({
      name: "",
      location: "Ramkund Primary Access Gate",
      zoneId: store.zones[0]?.id || "z01",
      sector: "North Sector",
      dutyCategory: "crowd_management",
      shift: "morning",
      date: new Date().toISOString().slice(0, 10),
      startTime: "06:00",
      endTime: "14:00",
      requiredCount: 8,
      skillsRequired: ["crowd_marshal"],
      languagesPreferred: ["mr", "hi"],
      supervisor: "Inspector V. Kulkarni",
      priority: "high",
      requireVerified: true,
      requireTrained: true,
    });
  }

  function handlePreviewRoster(deployment: Deployment) {
    const p = generateRosterPreview(
      deployment,
      store.volunteers,
      store.rosterAssignments,
      store.deployments,
      store.trainingEnrollments
    );
    setSelectedDeployment(deployment);
    setPreview(p);
  }

  function handleCommitRoster(deploymentId: string) {
    store.generateRoster(deploymentId);
    // Refresh preview
    const updated = store.deployments.find((d) => d.id === deploymentId);
    if (updated) handlePreviewRoster(updated);
  }

  function handleExecuteReassignment() {
    if (!selectedDeployment || !reassignToId) return;
    store.adjustAssignment(
      selectedDeployment.id,
      reassignFromId,
      reassignToId,
      reassignReason || "Supervisor operational swap"
    );
    setReassignFromId(null);
    setReassignToId("");
    setReassignReason("");
    handlePreviewRoster(selectedDeployment);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">Tactical Allocation</p>
          <h1 className="font-editorial text-2xl text-ink">Deployment & Roster Engine</h1>
          <p className="text-xs text-ink-muted">
            Constraint-based automatic roster generation with conflict prevention, skills matching and manual adjustments.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
          <span className="mr-1.5 font-bold">+</span>
          New Deployment Order
        </Button>
      </div>

      <VmsBanner />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <VmsStat label="Total Deployment Posts" value={totalDeployments} />
        <VmsStat label="Active / Published" value={activeDeployments} tone="green" />
        <VmsStat label="Total Headcount Needed" value={totalSlotsNeeded} />
        <VmsStat label="Rostered Volunteers" value={totalAssigned} tone="green" />
      </div>

      {/* Deployments List */}
      <div className="overflow-x-auto border border-border bg-surface shadow-card">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-surface-muted/60 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
            <tr>
              <th className="p-3">Deployment Order</th>
              <th className="p-3">Zone & Location</th>
              <th className="p-3">Shift & Hours</th>
              <th className="p-3">Headcount</th>
              <th className="p-3">Prerequisites</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-ink">
            {store.deployments.map((d) => {
              const assignedCount = store.rosterAssignments.filter((a) => a.deploymentId === d.id).length;
              const zone = store.zones.find((z) => z.id === d.zoneId);

              return (
                <tr key={d.id} className="hover:bg-surface-muted/40 transition-colors">
                  <td className="p-3">
                    <div className="font-semibold text-ink">{d.name}</div>
                    <div className="text-[10px] text-ink-soft capitalize">
                      Priority: <strong className={d.priority === "high" ? "text-status-red" : "text-ink"}>{d.priority}</strong> · Sup: {d.supervisor}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-ink">{zone?.shortName || d.zoneId}</div>
                    <div className="text-[10px] text-ink-soft">{d.location} ({d.sector})</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium capitalize text-ink">{d.shift}</div>
                    <div className="font-mono-num text-[10px] text-ink-soft">
                      {d.startTime} - {d.endTime} ({d.date})
                    </div>
                  </td>
                  <td className="p-3 font-mono-num">
                    <span className={assignedCount < d.requiredCount ? "text-status-amber font-bold" : "text-status-green font-bold"}>
                      {assignedCount}
                    </span>{" "}
                    / {d.requiredCount}
                  </td>
                  <td className="p-3 text-[10px] text-ink-muted">
                    {d.requireVerified && <span className="mr-1">✓ Verified</span>}
                    {d.requireTrained && <span>✓ Trained</span>}
                  </td>
                  <td className="p-3">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                      d.status === "active" || d.status === "published"
                        ? "bg-status-green-bg text-status-green border border-status-green-border"
                        : "bg-surface-muted text-ink-soft border border-border"
                    }`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handlePreviewRoster(d)}
                      >
                        Auto-Roster →
                      </Button>
                      {d.status !== "published" && d.status !== "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => store.setDeploymentStatus(d.id, "published")}
                        >
                          Publish
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Roster Preview & Adjustments Modal */}
      {selectedDeployment && preview && (
        <Modal
          open={true}
          title={`Roster Management: ${selectedDeployment.name}`}
          onClose={() => {
            setSelectedDeployment(null);
            setPreview(null);
          }}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2 border border-border bg-surface-muted/40 p-3 text-ink">
              <div><strong>Location:</strong> {selectedDeployment.location} ({selectedDeployment.sector})</div>
              <div><strong>Shift:</strong> {selectedDeployment.shift} ({selectedDeployment.startTime} - {selectedDeployment.endTime})</div>
              <div><strong>Supervisor:</strong> {selectedDeployment.supervisor}</div>
              <div><strong>Target Quota:</strong> {selectedDeployment.requiredCount} volunteers</div>
            </div>

            {/* Current Committed Roster */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-ink">
                  Currently Assigned Personnel ({store.rosterAssignments.filter((a) => a.deploymentId === selectedDeployment.id).length})
                </h4>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleCommitRoster(selectedDeployment.id)}
                >
                  ⚡ Auto-Assign Optimal Candidates
                </Button>
              </div>

              <div className="max-h-48 overflow-y-auto border border-border">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-surface-muted border-b border-border text-ink-soft sticky top-0">
                    <tr>
                      <th className="p-2">Slot</th>
                      <th className="p-2">Volunteer</th>
                      <th className="p-2">Contact</th>
                      <th className="p-2 text-right">Reassign</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {store.rosterAssignments
                      .filter((a) => a.deploymentId === selectedDeployment.id)
                      .map((a) => {
                        const vol = store.volunteers.find((v) => v.id === a.volunteerId);

                        return (
                          <tr key={a.id}>
                            <td className="p-2 font-mono-num font-bold">#{a.slotIndex}</td>
                            <td className="p-2 font-semibold text-ink">
                              {vol?.name || a.volunteerId}
                              <span className="font-mono-num text-[10px] text-ink-soft ml-1">({a.volunteerId})</span>
                            </td>
                            <td className="p-2 font-mono-num text-ink-soft">{vol?.phone || "—"}</td>
                            <td className="p-2 text-right">
                              <button
                                type="button"
                                onClick={() => setReassignFromId(a.volunteerId)}
                                className="text-primary hover:underline font-medium"
                              >
                                Replace Volunteer
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    {store.rosterAssignments.filter((a) => a.deploymentId === selectedDeployment.id).length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-ink-soft">
                          No volunteers currently rostered. Click &quot;Auto-Assign Optimal Candidates&quot; above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Manual Reassignment Box */}
            {reassignFromId && (
              <div className="rounded border border-primary/40 bg-primary-soft/20 p-3 space-y-2">
                <div className="font-semibold text-ink">
                  Manual Swap for Volunteer: <span className="font-mono-num">{reassignFromId}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    value={reassignToId}
                    onChange={(e) => setReassignToId(e.target.value)}
                    className="h-8 border border-border bg-surface px-2 text-xs"
                  >
                    <option value="">Select Replacement Volunteer...</option>
                    {store.volunteers
                      .filter((v) => !store.rosterAssignments.some((a) => a.volunteerId === v.id && a.deploymentId === selectedDeployment.id))
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.id})
                        </option>
                      ))}
                  </select>

                  <input
                    type="text"
                    value={reassignReason}
                    onChange={(e) => setReassignReason(e.target.value)}
                    placeholder="Reason for reassignment"
                    className="h-8 border border-border bg-surface px-2 text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setReassignFromId(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" variant="primary" onClick={handleExecuteReassignment}>
                    Confirm Swap
                  </Button>
                </div>
              </div>
            )}

            {/* Unfilled and Conflict Logs */}
            {preview.skipped.length > 0 && (
              <div className="rounded border border-status-amber-border bg-status-amber-bg/50 p-3 space-y-1">
                <span className="font-semibold text-ink text-[11px]">
                  Conflict Detection & Excluded Candidates ({preview.skipped.length}):
                </span>
                <ul className="max-h-24 overflow-y-auto space-y-0.5 text-[10px] text-ink-muted">
                  {preview.skipped.slice(0, 10).map((s, idx) => (
                    <li key={idx}>
                      Volunteer <strong>{s.volunteerId}</strong>: {s.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end border-t border-border pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedDeployment(null);
                  setPreview(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Deployment Modal */}
      <Modal open={showCreateModal} title="Configure New Deployment Order" onClose={() => setShowCreateModal(false)}>
        <form onSubmit={handleCreateDeployment} className="space-y-4 text-xs">
          <Field label="Deployment Order Name *">
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Ramkund North Ghat Morning QRF"
              className={inputClass}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Zone">
              <select
                value={form.zoneId}
                onChange={(e) => setForm({ ...form, zoneId: e.target.value })}
                className={inputClass}
              >
                {store.zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Sector / Post">
              <input
                type="text"
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
                className={inputClass}
              />
            </Field>

            <Field label="Exact Location Landmark">
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className={inputClass}
              />
            </Field>

            <Field label="Shift">
              <select
                value={form.shift}
                onChange={(e) => setForm({ ...form, shift: e.target.value as DeploymentShift })}
                className={inputClass}
              >
                <option value="morning">Morning (06:00 - 14:00)</option>
                <option value="afternoon">Afternoon (14:00 - 22:00)</option>
                <option value="night">Night (22:00 - 06:00)</option>
              </select>
            </Field>

            <Field label="Required Headcount">
              <input
                type="number"
                min="1"
                max="100"
                value={form.requiredCount}
                onChange={(e) => setForm({ ...form, requiredCount: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>

            <Field label="Assigned Supervisor">
              <input
                type="text"
                value={form.supervisor}
                onChange={(e) => setForm({ ...form, supervisor: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="flex gap-4 pt-1">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.requireVerified}
                onChange={(e) => setForm({ ...form, requireVerified: e.target.checked })}
                className="rounded text-primary"
              />
              <span>Require Identity Verified Only</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.requireTrained}
                onChange={(e) => setForm({ ...form, requireTrained: e.target.checked })}
                className="rounded text-primary"
              />
              <span>Require Training Completed Only</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Deployment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
