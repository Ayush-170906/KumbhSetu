"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import type { FieldDutyStatus, Volunteer } from "@/lib/types";
import type { FieldActivityType } from "@/lib/volunteerTypes";
import { Field, FieldBadge, inputClass, Modal, VmsBanner, VmsStat } from "./vmsUi";

export function VmsField({ onProfile }: { onProfile: (id: string) => void }) {
  const store = useAppStore();
  const [filterZone, setFilterZone] = useState("");
  const [statusFilter, setStatusFilter] = useState<FieldDutyStatus | "all">("all");
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [actionType, setActionType] = useState<FieldActivityType>("field_note");
  const [noteText, setNoteText] = useState("");
  const [isIncidentReport, setIsIncidentReport] = useState(false);

  const volunteers = store.volunteers;

  const deployedVolunteers = useMemo(() => {
    return volunteers.filter((v) => {
      if (filterZone && v.zoneId !== filterZone) return false;
      if (statusFilter !== "all" && (v.fieldDutyStatus ?? "not_deployed") !== statusFilter) return false;
      return true;
    });
  }, [volunteers, filterZone, statusFilter]);

  const stats = useMemo(() => {
    const onDuty = volunteers.filter((v) => v.fieldDutyStatus === "on_duty" || v.fieldDutyStatus === "checked_in").length;
    const assigned = volunteers.filter((v) => v.fieldDutyStatus === "assigned" || v.fieldDutyStatus === "awaiting_checkin").length;
    const assistanceNeeded = volunteers.filter((v) => v.fieldDutyStatus === "needs_assistance").length;
    const completed = volunteers.filter((v) => v.fieldDutyStatus === "shift_complete").length;

    return { onDuty, assigned, assistanceNeeded, completed };
  }, [volunteers]);

  function handleLogActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVolunteer) return;

    let incidentId: string | undefined;
    if (isIncidentReport) {
      const inc = store.createIncident({
        type: "other",
        severity: "moderate",
        zoneId: selectedVolunteer.zoneId,
        reportedBy: { role: "volunteer", label: `${selectedVolunteer.name} (${selectedVolunteer.id})` },
        summary: `Field Report: ${noteText || "Crowd density / sector observation reported from ground"}`,
      });
      incidentId = inc.id;
    }

    store.recordFieldActivity(selectedVolunteer.id, actionType, noteText || undefined, incidentId);

    // Update duty status if action is start or complete
    if (actionType === "start_duty" || actionType === "check_in") {
      store.setFieldDutyStatus(selectedVolunteer.id, "on_duty");
    } else if (actionType === "complete_shift") {
      store.setFieldDutyStatus(selectedVolunteer.id, "shift_complete");
    } else if (actionType === "assistance_request") {
      store.setFieldDutyStatus(selectedVolunteer.id, "needs_assistance");
    }

    setSelectedVolunteer(null);
    setNoteText("");
    setIsIncidentReport(false);
  }

  function handleQuickDutyChange(volunteerId: string, status: FieldDutyStatus) {
    store.setFieldDutyStatus(volunteerId, status);
    store.recordFieldActivity(volunteerId, status === "on_duty" ? "start_duty" : "complete_shift");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">Tactical Operations</p>
          <h1 className="font-editorial text-2xl text-ink">Field Operations Command</h1>
          <p className="text-xs text-ink-muted">
            Live status of on-duty marshals, sector observations, incident escalations and duty completion.
          </p>
        </div>
      </div>

      <VmsBanner />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <VmsStat label="On Duty / Active Ground" value={stats.onDuty} tone="green" />
        <VmsStat label="Rostered / Standby" value={stats.assigned} />
        <VmsStat label="Assistance Needed" value={stats.assistanceNeeded} tone={stats.assistanceNeeded > 0 ? "red" : "default"} />
        <VmsStat label="Completed Shifts" value={stats.completed} />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 text-xs">
        <div className="flex flex-wrap gap-2">
          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
            className="h-8 border border-border bg-surface px-2 text-xs"
          >
            <option value="">All Zones</option>
            {store.zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="h-8 border border-border bg-surface px-2 text-xs"
          >
            <option value="all">Duty Status: All</option>
            <option value="on_duty">On Duty</option>
            <option value="checked_in">Checked In</option>
            <option value="assigned">Rostered</option>
            <option value="needs_assistance">Needs Assistance</option>
            <option value="shift_complete">Shift Complete</option>
            <option value="absent">Absent</option>
          </select>
        </div>

        <span className="font-mono-num text-ink-soft text-[11px]">
          {deployedVolunteers.length} ground personnel
        </span>
      </div>

      {/* Field Personnel Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {deployedVolunteers.map((vol) => {
          const zone = store.zones.find((z) => z.id === vol.zoneId);
          const assignment = store.rosterAssignments.find((a) => a.volunteerId === vol.id);
          const deployment = assignment ? store.deployments.find((d) => d.id === assignment.deploymentId) : undefined;
          const activities = store.fieldActivities.filter((a) => a.volunteerId === vol.id);
          const latestAct = activities[activities.length - 1];

          return (
            <div
              key={vol.id}
              className={`border bg-surface p-4 shadow-card transition-colors space-y-3 ${
                vol.fieldDutyStatus === "needs_assistance"
                  ? "border-status-red bg-status-red-bg/20"
                  : vol.fieldDutyStatus === "on_duty"
                  ? "border-status-green-border"
                  : "border-border"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono-num text-[10px] font-bold text-primary">{vol.id}</span>
                  <h3 className="font-semibold text-sm text-ink">{vol.name}</h3>
                  <p className="text-[11px] text-ink-soft">
                    {zone?.name || vol.zoneId} · {vol.preferredArea || "General Area"}
                  </p>
                </div>
                <FieldBadge status={vol.fieldDutyStatus} />
              </div>

              {deployment && (
                <div className="rounded bg-surface-muted p-2 text-[11px] space-y-0.5 text-ink">
                  <div><strong>Assignment:</strong> {deployment.name}</div>
                  <div><strong>Shift:</strong> {deployment.shift} ({deployment.startTime} - {deployment.endTime})</div>
                  <div><strong>Supervisor:</strong> {deployment.supervisor}</div>
                </div>
              )}

              {latestAct && (
                <div className="text-[11px] border-t border-border pt-1.5 text-ink-muted">
                  <span className="font-semibold capitalize text-ink">{latestAct.type.replace("_", " ")}:</span>{" "}
                  {latestAct.note || "Logged status update"}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-1 border-t border-border pt-2">
                <div className="flex gap-1">
                  {vol.fieldDutyStatus !== "on_duty" ? (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleQuickDutyChange(vol.id, "on_duty")}
                    >
                      Start Duty
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickDutyChange(vol.id, "shift_complete")}
                    >
                      Complete Shift
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedVolunteer(vol);
                      setActionType("field_note");
                    }}
                  >
                    Log Note / SOS
                  </Button>
                </div>
                <Button size="sm" variant="ghost" onClick={() => onProfile(vol.id)}>
                  Profile →
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Field Activity / SOS Reporting Modal */}
      {selectedVolunteer && (
        <Modal
          open={true}
          title={`Log Field Observation: ${selectedVolunteer.name} (${selectedVolunteer.id})`}
          onClose={() => setSelectedVolunteer(null)}
        >
          <form onSubmit={handleLogActivity} className="space-y-4 text-xs">
            <Field label="Activity Type">
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as FieldActivityType)}
                className={inputClass}
              >
                <option value="field_note">Field Observation / Note</option>
                <option value="assistance_request">Assistance Request (Call for Backup / QRF)</option>
                <option value="incident_report">Critical Incident Report (Escalate to Control Room)</option>
                <option value="check_in">Check-in at Post</option>
                <option value="complete_shift">Duty Shift Handover</option>
              </select>
            </Field>

            <Field label="Observation Details / Situation Description *">
              <textarea
                required
                rows={3}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g., Heavy pilgrim influx from Panchavati bridge; barrier queue holding steady."
                className="w-full border border-border bg-surface p-2 text-xs text-ink"
              />
            </Field>

            <div className="rounded border border-border bg-surface-muted/40 p-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isIncidentReport || actionType === "incident_report"}
                  onChange={(e) => setIsIncidentReport(e.target.checked)}
                  className="rounded text-primary"
                />
                <span className="font-semibold text-ink">
                  Escalate directly into Kumbh Setu Control Room Incident Feed
                </span>
              </label>
              <p className="mt-1 text-[10px] text-ink-soft">
                Automatically creates an active incident assigned to this zone for live tracking.
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedVolunteer(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Submit Field Log
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
