"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import {
  locationDistribution,
  ngoParticipation,
  registrationTrend,
  toCsv,
} from "@/lib/volunteerOps";
import { BarChart, VmsBanner, VmsStat } from "./vmsUi";

export function VmsReports() {
  const store = useAppStore();
  const [selectedReport, setSelectedReport] = useState<"deployment" | "attendance" | "ngo" | "verification">("deployment");

  const trend = registrationTrend(store.volunteers, 14);
  const byZone = locationDistribution(store.volunteers);
  const ngoData = ngoParticipation(store.ngos, store.volunteers);

  const attendanceToday = store.attendanceRecords.filter(
    (a) => a.date === new Date().toISOString().slice(0, 10)
  );

  const verificationFunnel = useMemo(() => {
    const total = store.volunteers.length;
    const verified = store.volunteers.filter((v) => v.identityVerificationStatus === "verified").length;
    const manualReview = store.volunteers.filter((v) => v.identityVerificationStatus === "manual_review").length;
    const pending = store.volunteers.filter((v) =>
      ["consent_pending", "verification_pending"].includes(v.identityVerificationStatus ?? "")
    ).length;
    const failed = store.volunteers.filter((v) => v.identityVerificationStatus === "failed").length;

    return [
      { label: "Total Registered", value: total },
      { label: "Verified (Pass)", value: verified },
      { label: "Manual Review", value: manualReview },
      { label: "Pending Consent/Checks", value: pending },
      { label: "Rejected / Ineligible", value: failed },
    ];
  }, [store.volunteers]);

  function exportReportCsv() {
    let rows: Record<string, string>[] = [];
    if (selectedReport === "deployment") {
      rows = store.deployments.map((d) => {
        const assigned = store.rosterAssignments.filter((a) => a.deploymentId === d.id).length;
        return {
          DeploymentOrder: d.name,
          Zone: d.zoneId,
          Location: d.location,
          Shift: d.shift,
          Required: String(d.requiredCount),
          Assigned: String(assigned),
          Shortfall: String(Math.max(0, d.requiredCount - assigned)),
          Status: d.status,
        };
      });
    } else if (selectedReport === "attendance") {
      rows = store.attendanceRecords.map((a) => ({
        VolunteerId: a.volunteerId,
        Date: a.date,
        Category: a.kind,
        Status: a.status,
        Method: a.method,
        MarkedBy: a.markedBy,
      }));
    } else if (selectedReport === "ngo") {
      rows = ngoData.map((row) => ({
        NgoName: row.ngo.name,
        RegistrationId: row.ngo.registrationId,
        PledgedCapacity: String(row.ngo.volunteerCountDeclared),
        ActualOnboarded: String(row.count),
        CompliancePct: String(Math.round((row.count / (row.ngo.volunteerCountDeclared || 1)) * 100)) + "%",
        Status: row.ngo.status,
      }));
    } else {
      rows = verificationFunnel.map((item) => ({
        Metric: item.label,
        Count: String(item.value),
      }));
    }

    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kumbh-vms-report-${selectedReport}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">Analytics & Oversight</p>
          <h1 className="font-editorial text-2xl text-ink">Volunteer Operations Reports</h1>
          <p className="text-xs text-ink-muted">
            Administrative audit data, quota mobilization rates and compliance export sheets for Nashik Collectorate.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportReportCsv}>
          <Icon name="log" className="mr-1.5 h-3.5 w-3.5" />
          Export {selectedReport.toUpperCase()} Report CSV
        </Button>
      </div>

      <VmsBanner />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <VmsStat label="Total Enrolled Force" value={store.volunteers.length} />
        <VmsStat
          label="Verification Rate"
          value={`${Math.round(
            (store.volunteers.filter((v) => v.identityVerificationStatus === "verified").length /
              Math.max(1, store.volunteers.length)) *
              100
          )}%`}
          tone="green"
        />
        <VmsStat
          label="Attendance Today"
          value={`${attendanceToday.filter((a) => a.status === "present").length} Present`}
          tone="green"
        />
        <VmsStat
          label="Active Deployments"
          value={store.deployments.filter((d) => d.status === "active" || d.status === "published").length}
        />
      </div>

      {/* Report Category Switcher */}
      <div className="flex border-b border-border text-xs gap-2 overflow-x-auto">
        {[
          ["deployment", "Deployment & Roster Saturation"],
          ["attendance", "Attendance & Muster Roll"],
          ["ngo", "NGO Quota & Participation"],
          ["verification", "Identity Verification Funnel"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSelectedReport(id as typeof selectedReport)}
            className={`pb-2.5 px-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              selectedReport === id
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Report Views */}
      {selectedReport === "deployment" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="border border-border bg-surface p-4 space-y-3">
            <h3 className="font-semibold text-sm text-ink">Headcount Saturation by Deployment</h3>
            <p className="text-[11px] text-ink-soft">Target requirements vs rostered volunteers</p>
            <BarChart
              items={store.deployments.map((d) => ({
                label: d.name,
                value: store.rosterAssignments.filter((a) => a.deploymentId === d.id).length,
              }))}
            />
          </div>

          <div className="border border-border bg-surface p-4 space-y-3">
            <h3 className="font-semibold text-sm text-ink">Geographic Zone Distribution</h3>
            <p className="text-[11px] text-ink-soft">Volunteer concentration across Nashik & Trimbakeshwar</p>
            <BarChart
              items={Object.entries(byZone).map(([zoneId, count]) => ({
                label: store.zones.find((z) => z.id === zoneId)?.name || zoneId,
                value: count,
              }))}
            />
          </div>
        </div>
      )}

      {selectedReport === "attendance" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="border border-border bg-surface p-4 space-y-3">
            <h3 className="font-semibold text-sm text-ink">Today&apos;s Roll Call Distribution</h3>
            <BarChart
              items={[
                { label: "Present (On-Time)", value: attendanceToday.filter((a) => a.status === "present").length },
                { label: "Late Arrivals", value: attendanceToday.filter((a) => a.status === "late").length },
                { label: "Absent", value: attendanceToday.filter((a) => a.status === "absent").length },
                { label: "Approved Leave", value: attendanceToday.filter((a) => a.status === "leave").length },
              ]}
            />
          </div>

          <div className="border border-border bg-surface p-4 space-y-3">
            <h3 className="font-semibold text-sm text-ink">Registration Trend (Past 14 Days)</h3>
            <BarChart items={trend.map((t) => ({ label: t.date.slice(5), value: t.count }))} />
          </div>
        </div>
      )}

      {selectedReport === "ngo" && (
        <div className="border border-border bg-surface p-4 space-y-3">
          <h3 className="font-semibold text-sm text-ink">NGO Mobilization vs Declared Capacity</h3>
          <BarChart
            items={ngoData.map((row) => ({
              label: `${row.ngo.name} (Pledged: ${row.ngo.volunteerCountDeclared})`,
              value: row.count,
            }))}
          />
        </div>
      )}

      {selectedReport === "verification" && (
        <div className="border border-border bg-surface p-4 space-y-3">
          <h3 className="font-semibold text-sm text-ink">Verification Audit Pipeline</h3>
          <p className="text-[11px] text-ink-soft">Breakdown of volunteer identity trust stages</p>
          <BarChart items={verificationFunnel} />
        </div>
      )}
    </div>
  );
}
