"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import type { Volunteer } from "@/lib/types";
import {
  filterVolunteers,
  lifecycleFor,
  profileCompleteness,
  trainingStatusFor,
  toCsv,
  authorizedExportRows,
} from "@/lib/volunteerOps";
import type { VolunteerDirectoryQuery, LifecycleStage } from "@/lib/volunteerTypes";
import {
  IdentityBadge,
  FieldBadge,
  TrainingBadge,
  Modal,
  VmsStat,
  SyntheticTag,
} from "./vmsUi";

export function VmsDirectory({
  profileId,
  onProfile,
  onRegister,
}: {
  profileId: string | null;
  onProfile: (id: string | null) => void;
  onRegister: () => void;
}) {
  const store = useAppStore();
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [query, setQuery] = useState<VolunteerDirectoryQuery>({
    text: "",
    ngoId: "",
    verification: "all",
    training: "all",
    zoneId: "",
    skill: "",
    language: "all",
    fieldStatus: "all",
  });

  const filtered = useMemo(() => {
    return filterVolunteers(store.volunteers, query, {
      enrollments: store.trainingEnrollments,
      sessions: store.trainingSessions,
      assignments: store.rosterAssignments,
      deployments: store.deployments,
      attendance: store.attendanceRecords,
    });
  }, [
    store.volunteers,
    query,
    store.trainingEnrollments,
    store.trainingSessions,
    store.rosterAssignments,
    store.deployments,
    store.attendanceRecords,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const selectedVolunteer = store.volunteers.find((v) => v.id === profileId);

  function exportCsv() {
    const rows = authorizedExportRows(filtered, store.ngos);
    const csv = toCsv(rows as unknown as Record<string, string>[]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kumbh-volunteers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">Personnel Directory</p>
          <h1 className="font-editorial text-2xl text-ink">Volunteer Directory</h1>
          <p className="text-xs text-ink-muted">
            Search, filter, inspect and manage ground personnel across all zones and NGOs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Icon name="log" className="mr-1.5 h-3.5 w-3.5" />
            Export CSV ({filtered.length})
          </Button>
          <Button variant="primary" size="sm" onClick={onRegister}>
            <Icon name="volunteer" className="mr-1.5 h-3.5 w-3.5" />
            + Register Volunteer
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-sm border border-border bg-surface p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, ID, phone, email..."
              value={query.text || ""}
              onChange={(e) => {
                setQuery({ ...query, text: e.target.value });
                setPage(1);
              }}
              className="h-9 w-full rounded-sm border border-border bg-surface px-3 text-xs text-ink focus:border-primary focus:outline-none"
            />
          </div>

          <select
            value={query.ngoId || ""}
            onChange={(e) => {
              setQuery({ ...query, ngoId: e.target.value });
              setPage(1);
            }}
            className="h-9 rounded-sm border border-border bg-surface px-3 text-xs text-ink"
          >
            <option value="">All NGOs & Direct</option>
            {store.ngos.map((ngo) => (
              <option key={ngo.id} value={ngo.id}>
                {ngo.name}
              </option>
            ))}
          </select>

          <select
            value={query.verification || "all"}
            onChange={(e) => {
              setQuery({
                ...query,
                verification: e.target.value as VolunteerDirectoryQuery["verification"],
              });
              setPage(1);
            }}
            className="h-9 rounded-sm border border-border bg-surface px-3 text-xs text-ink"
          >
            <option value="all">Verification: All</option>
            <option value="verified">Verified</option>
            <option value="manual_review">Manual Review</option>
            <option value="verification_pending">Verification Pending</option>
            <option value="consent_pending">Consent Pending</option>
            <option value="not_initiated">Not Initiated</option>
          </select>

          <select
            value={query.zoneId || ""}
            onChange={(e) => {
              setQuery({ ...query, zoneId: e.target.value });
              setPage(1);
            }}
            className="h-9 rounded-sm border border-border bg-surface px-3 text-xs text-ink"
          >
            <option value="">All Zones</option>
            {store.zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-ink-muted">
          <div className="flex flex-wrap items-center gap-2">
            <span>Filters:</span>
            <select
              value={query.training || "all"}
              onChange={(e) => setQuery({ ...query, training: e.target.value as VolunteerDirectoryQuery["training"] })}
              className="h-7 border border-border bg-surface px-2 text-[11px]"
            >
              <option value="all">Training: All</option>
              <option value="completed">Completed</option>
              <option value="attended">Attended</option>
              <option value="enrolled">Enrolled</option>
              <option value="not_enrolled">Not Enrolled</option>
            </select>

            <select
              value={query.fieldStatus || "all"}
              onChange={(e) => setQuery({ ...query, fieldStatus: e.target.value as VolunteerDirectoryQuery["fieldStatus"] })}
              className="h-7 border border-border bg-surface px-2 text-[11px]"
            >
              <option value="all">Field: All</option>
              <option value="on_duty">On Duty</option>
              <option value="checked_in">Checked In</option>
              <option value="assigned">Rostered</option>
              <option value="needs_assistance">Needs Assistance</option>
              <option value="not_deployed">Not Deployed</option>
              <option value="absent">Absent</option>
            </select>

            {(query.text || query.ngoId || query.verification !== "all" || query.zoneId || query.training !== "all" || query.fieldStatus !== "all") && (
              <button
                type="button"
                onClick={() => setQuery({ text: "", ngoId: "", verification: "all", training: "all", zoneId: "", skill: "", language: "all", fieldStatus: "all" })}
                className="text-primary hover:underline text-[11px]"
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className="font-mono-num font-semibold text-ink">{filtered.length}</span> volunteers matching
            <div className="ml-3 flex rounded-sm border border-border bg-surface p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-2 py-1 text-xs ${viewMode === "table" ? "bg-primary text-white" : "text-ink-muted"}`}
              >
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`px-2 py-1 text-xs ${viewMode === "cards" ? "bg-primary text-white" : "text-ink-muted"}`}
              >
                Cards
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Directory View */}
      {viewMode === "table" ? (
        <div className="overflow-x-auto border border-border bg-surface shadow-card">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-surface-muted/60 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="p-3">Volunteer ID & Name</th>
                <th className="p-3">NGO</th>
                <th className="p-3">Zone / Post</th>
                <th className="p-3">Category</th>
                <th className="p-3">Verification</th>
                <th className="p-3">Training</th>
                <th className="p-3">Field Duty</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-ink">
              {paginated.map((v) => {
                const ngo = store.ngos.find((n) => n.id === v.ngoId);
                const zone = store.zones.find((z) => z.id === v.zoneId);
                const trainStatus = trainingStatusFor(v.id, store.trainingEnrollments);

                return (
                  <tr
                    key={v.id}
                    onClick={() => onProfile(v.id)}
                    className="cursor-pointer hover:bg-surface-muted/50 transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono-num text-[11px] font-bold text-primary">{v.id}</span>
                        <SyntheticTag isSynthetic={v.isSyntheticDemo} />
                      </div>
                      <div className="font-semibold text-ink">{v.name}</div>
                      <div className="text-[10px] text-ink-soft">
                        {v.phone || "No phone"} · {(v.preferredLanguage || "mr").toUpperCase()}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-ink">{ngo?.name || "Individual"}</div>
                      <div className="text-[10px] text-ink-soft">{ngo ? "Affiliated" : "Direct"}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-ink">{zone?.shortName || v.zoneId}</div>
                      <div className="text-[10px] text-ink-soft">{v.preferredArea || "General sector"}</div>
                    </td>
                    <td className="p-3">
                      <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[11px] font-medium capitalize">
                        {(v.category || "general").replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3">
                      <IdentityBadge status={v.identityVerificationStatus} />
                    </td>
                    <td className="p-3">
                      <TrainingBadge status={trainStatus} />
                    </td>
                    <td className="p-3">
                      <FieldBadge status={v.fieldDutyStatus} />
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onProfile(v.id);
                        }}
                      >
                        Profile →
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-ink-soft">
                    No volunteers match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((v) => {
            const ngo = store.ngos.find((n) => n.id === v.ngoId);
            const zone = store.zones.find((z) => z.id === v.zoneId);
            const trainStatus = trainingStatusFor(v.id, store.trainingEnrollments);

            return (
              <div
                key={v.id}
                onClick={() => onProfile(v.id)}
                className="cursor-pointer border border-border bg-surface p-4 shadow-card hover:border-primary transition-colors space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono-num text-[10px] font-bold text-primary">{v.id}</span>
                      <SyntheticTag isSynthetic={v.isSyntheticDemo} />
                    </div>
                    <h3 className="font-semibold text-sm text-ink">{v.name}</h3>
                    <p className="text-[11px] text-ink-soft">{ngo?.name || "Direct Individual"}</p>
                  </div>
                  <FieldBadge status={v.fieldDutyStatus} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-border pt-2 text-ink-muted">
                  <div>
                    <span className="text-ink-soft">Zone:</span> {zone?.shortName || v.zoneId}
                  </div>
                  <div>
                    <span className="text-ink-soft">Language:</span> {(v.preferredLanguage || "mr").toUpperCase()}
                  </div>
                  <div>
                    <span className="text-ink-soft">Identity:</span> <IdentityBadge status={v.identityVerificationStatus} />
                  </div>
                  <div>
                    <span className="text-ink-soft">Training:</span> <TrainingBadge status={trainStatus} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {v.skills.map((s) => (
                    <span key={s} className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] text-ink-soft">
                      {s.replace("_", " ")}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-ink-muted">
        <div>
          Showing {(page - 1) * pageSize + 1} to {Math.min(filtered.length, page * pageSize)} of {filtered.length} volunteers
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="px-3 py-1 font-mono-num font-semibold text-ink">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Volunteer Profile Drawer / Modal (Module K) */}
      {selectedVolunteer && (
        <VolunteerProfileModal
          volunteer={selectedVolunteer}
          onClose={() => onProfile(null)}
        />
      )}
    </div>
  );
}

const LIFECYCLE_STEPS: { stage: LifecycleStage; label: string }[] = [
  { stage: "registered", label: "Registered" },
  { stage: "verified", label: "Verified" },
  { stage: "trained", label: "Trained" },
  { stage: "rostered", label: "Rostered" },
  { stage: "deployed", label: "Deployed" },
  { stage: "on_field", label: "On Field" },
  { stage: "completed", label: "Completed" },
];

function VolunteerProfileModal({
  volunteer,
  onClose,
}: {
  volunteer: Volunteer;
  onClose: () => void;
}) {
  const store = useAppStore();
  const [tab, setTab] = useState<"overview" | "verification" | "training" | "roster" | "welfare" | "activity">("overview");
  const [lifecycleMsg, setLifecycleMsg] = useState<string | null>(null);

  const ngo = store.ngos.find((n) => n.id === volunteer.ngoId);
  const zone = store.zones.find((z) => z.id === volunteer.zoneId);
  const currentStage = lifecycleFor(volunteer, store.trainingEnrollments, store.rosterAssignments, store.deployments);
  const completeness = profileCompleteness(volunteer);
  const currentStageIndex = LIFECYCLE_STEPS.findIndex((s) => s.stage === currentStage);

  const enrollments = store.trainingEnrollments.filter((e) => e.volunteerId === volunteer.id);
  const assignment = store.rosterAssignments.find((a) => a.volunteerId === volunteer.id);
  const deployment = assignment ? store.deployments.find((d) => d.id === assignment.deploymentId) : undefined;
  const attendance = store.attendanceRecords.filter((a) => a.volunteerId === volunteer.id);
  const meals = store.mealAllocations.filter((m) => m.volunteerId === volunteer.id);
  const bedAssignment = store.accommodationAssignments.find((a) => a.volunteerId === volunteer.id);
  const accommodation = bedAssignment ? store.accommodations.find((acc) => acc.id === bedAssignment.accommodationId) : undefined;
  const activities = store.fieldActivities.filter((act) => act.volunteerId === volunteer.id);
  const identityLogs = store.identityEvents.filter((ev) => ev.volunteerId === volunteer.id);

  return (
    <Modal open={true} title={`Volunteer Profile — ${volunteer.id}`} onClose={onClose}>
      <div className="space-y-5 text-xs">
        {/* Profile Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-editorial text-xl text-ink">{volunteer.name}</h2>
              <span className="font-mono-num font-bold text-primary bg-primary-soft/50 px-2 py-0.5 rounded">
                {volunteer.id}
              </span>
              <SyntheticTag isSynthetic={volunteer.isSyntheticDemo} />
            </div>
            <p className="mt-1 text-ink-muted">
              {ngo ? `Affiliated with ${ngo.name}` : "Direct Volunteer"} · Assigned to {zone?.name || volunteer.zoneId}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <IdentityBadge status={volunteer.identityVerificationStatus} />
            <FieldBadge status={volunteer.fieldDutyStatus} />
          </div>
        </div>

        {/* Lifecycle Stepper with 1-Click Interactive Demo */}
        <div className="rounded border border-primary/20 bg-primary-soft/20 p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
              Lifecycle Progress: <span className="font-bold text-primary uppercase">{currentStage.replace("_", " ")}</span>
            </div>
            <Button
              size="sm"
              variant="primary"
              disabled={currentStage === "completed"}
              onClick={() => {
                const res = store.advanceDemoLifecycle(volunteer.id);
                setLifecycleMsg(res.message);
              }}
            >
              ⚡ Advance Lifecycle Stage (Demo)
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {LIFECYCLE_STEPS.map((s, idx) => {
              const done = idx <= currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <div key={s.stage} className="text-center">
                  <div
                    className={`h-1.5 rounded-full transition-colors ${
                      done ? "bg-status-green" : "bg-surface-muted"
                    } ${isCurrent ? "ring-2 ring-primary" : ""}`}
                  />
                  <span className={`mt-1 block text-[10px] truncate ${isCurrent ? "font-bold text-primary" : "text-ink-soft"}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {lifecycleMsg && (
            <div className="flex items-center gap-1.5 rounded border border-status-green-border bg-status-green-bg px-2.5 py-1.5 text-[11px] font-semibold text-status-green">
              <span>✓ {lifecycleMsg}</span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border overflow-x-auto gap-2">
          {[
            ["overview", "Overview"],
            ["verification", "Verification & ID"],
            ["training", "Training"],
            ["roster", "Deployment & Roster"],
            ["welfare", "Food & Bed"],
            ["activity", "Field Activities"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id as typeof tab)}
              className={`pb-2 border-b-2 font-medium transition-colors ${
                tab === id
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <VmsStat label="Profile Completeness" value={`${completeness.score}%`} tone={completeness.score >= 80 ? "green" : "amber"} />
              <VmsStat label="Training Status" value={trainingStatusFor(volunteer.id, store.trainingEnrollments)} />
              <VmsStat label="Attendance Records" value={attendance.length} />
              <VmsStat label="Field Duty" value={volunteer.fieldDutyStatus?.replace("_", " ") || "None"} />
            </div>

            <div className="grid gap-3 border border-border bg-surface-muted/40 p-4 sm:grid-cols-2">
              <div>
                <span className="font-semibold text-ink-soft">Contact:</span>{" "}
                <span className="text-ink">{volunteer.phone || "No phone"} / {volunteer.email || "No email"}</span>
              </div>
              <div>
                <span className="font-semibold text-ink-soft">Languages:</span>{" "}
                <span className="text-ink">{volunteer.languages.join(", ").toUpperCase()}</span>
              </div>
              <div>
                <span className="font-semibold text-ink-soft">Primary Skill:</span>{" "}
                <span className="text-ink">{volunteer.skills.join(", ")}</span>
              </div>
              <div>
                <span className="font-semibold text-ink-soft">Emergency Contact:</span>{" "}
                <span className="text-ink">{volunteer.emergencyContactName || "Not on file"}</span>
              </div>
              <div>
                <span className="font-semibold text-ink-soft">Shift Window:</span>{" "}
                <span className="text-ink">{volunteer.shiftStart} - {volunteer.shiftEnd}</span>
              </div>
              <div>
                <span className="font-semibold text-ink-soft">Hometown / State:</span>{" "}
                <span className="text-ink">{volunteer.district || "Nashik"}, {volunteer.state || "Maharashtra"}</span>
              </div>
            </div>

            {completeness.missing.length > 0 && (
              <div className="rounded-sm border border-status-amber-border bg-status-amber-bg p-3 text-[11px] text-ink-muted">
                <span className="font-semibold text-ink">Missing recommended fields:</span> {completeness.missing.join(", ")}
              </div>
            )}
          </div>
        )}

        {tab === "verification" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-sm border border-border bg-surface p-3">
              <div>
                <span className="font-semibold text-ink">Identity Verification Status:</span>
                <div className="mt-1">
                  <IdentityBadge status={volunteer.identityVerificationStatus} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => store.setIdentityVerification(volunteer.id, "verified", "Admin", "Verified official photo ID")}
                >
                  ✓ Mark Verified
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => store.setIdentityVerification(volunteer.id, "manual_review", "Admin", "Flagged for physical desk check")}
                >
                  Request Review
                </Button>
              </div>
            </div>

            <div className="border border-border p-3">
              <h4 className="font-semibold text-ink mb-2">Verification Audit Trail</h4>
              {identityLogs.length === 0 ? (
                <p className="text-ink-soft">No identity status events logged for this profile yet.</p>
              ) : (
                <ul className="space-y-2">
                  {identityLogs.map((log) => (
                    <li key={log.id} className="border-b border-border pb-1.5 flex justify-between">
                      <div>
                        <span className="font-semibold text-ink">{log.status.toUpperCase()}</span> by {log.actor}
                        {log.note && <p className="text-ink-muted text-[11px]">{log.note}</p>}
                      </div>
                      <span className="text-ink-soft font-mono-num text-[10px]">{log.at.slice(0, 16).replace("T", " ")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {tab === "training" && (
          <div className="space-y-4">
            <h4 className="font-semibold text-ink">Training Enrolment & Attendance</h4>
            {enrollments.length === 0 ? (
              <p className="text-ink-soft">Volunteer is not currently enrolled in any training module.</p>
            ) : (
              <div className="space-y-2">
                {enrollments.map((enr) => {
                  const sess = store.trainingSessions.find((s) => s.id === enr.sessionId);
                  return (
                    <div key={enr.id} className="flex items-center justify-between border border-border p-3">
                      <div>
                        <div className="font-semibold text-ink">{sess?.title || enr.sessionId}</div>
                        <div className="text-ink-soft text-[11px]">
                          Category: {sess?.category.replace("_", " ")} · Mode: {sess?.mode}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrainingBadge status={enr.status} />
                        {enr.status !== "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => store.completeTraining(enr.sessionId, volunteer.id, 95)}
                          >
                            Mark Completed
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "roster" && (
          <div className="space-y-4">
            <h4 className="font-semibold text-ink">Deployment Assignment</h4>
            {deployment ? (
              <div className="border border-border p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-ink">{deployment.name}</span>
                  <span className="font-bold text-primary uppercase">{deployment.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-ink-muted">
                  <div>Location: {deployment.location}</div>
                  <div>Shift: {deployment.shift} ({deployment.startTime} - {deployment.endTime})</div>
                  <div>Supervisor: {deployment.supervisor}</div>
                  <div>Assigned Slot: {assignment?.slotIndex}</div>
                </div>
              </div>
            ) : (
              <p className="text-ink-soft">Volunteer has no active deployment roster assignment.</p>
            )}
          </div>
        )}

        {tab === "welfare" && (
          <div className="space-y-4">
            <h4 className="font-semibold text-ink">Food & Accommodation (Welfare)</h4>
            <div className="border border-border p-3">
              <span className="font-semibold text-ink">Bed Allocation:</span>
              {accommodation ? (
                <div className="mt-1 text-ink-muted">
                  {accommodation.name} ({accommodation.address}) · Bed: <span className="font-bold text-ink">{bedAssignment?.bedLabel}</span>
                </div>
              ) : (
                <div className="mt-1 text-ink-soft">No accommodation camp assigned.</div>
              )}
            </div>

            <div className="border border-border p-3">
              <span className="font-semibold text-ink">Meal Coupons & Status:</span>
              {meals.length === 0 ? (
                <p className="mt-1 text-ink-soft">No meal allocations generated for today.</p>
              ) : (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {meals.map((m) => (
                    <div key={m.id} className="border border-border p-2 text-center rounded">
                      <div className="font-semibold capitalize text-ink">{m.meal}</div>
                      <div className="text-[10px] text-ink-soft">{m.status.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "activity" && (
          <div className="space-y-4">
            <h4 className="font-semibold text-ink">Field Activity History</h4>
            {activities.length === 0 ? (
              <p className="text-ink-soft">No field notes or check-ins recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {activities.map((act) => (
                  <li key={act.id} className="border border-border p-2 flex justify-between">
                    <div>
                      <span className="font-semibold text-ink capitalize">{act.type.replace("_", " ")}</span>
                      {act.note && <p className="text-ink-muted text-[11px]">{act.note}</p>}
                    </div>
                    <span className="text-[10px] font-mono-num text-ink-soft">{act.at.slice(11, 16)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex justify-end border-t border-border pt-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Profile
          </Button>
        </div>
      </div>
    </Modal>
  );
}
