"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { SimTag } from "@/components/ui/SimTag";
import { useAppStore } from "@/store/useAppStore";
import { isTrained, locationDistribution, ngoParticipation, registrationTrend, trainingStatusFor } from "@/lib/volunteerOps";
import { BarChart, VmsBanner, VmsStat } from "./vmsUi";
import { VmsDirectory } from "./VmsDirectory";
import { VmsNgo } from "./VmsNgo";
import { VmsBulk } from "./VmsBulk";
import { VmsVerify } from "./VmsVerify";
import { VmsTraining } from "./VmsTraining";
import { VmsDeploy } from "./VmsDeploy";
import { VmsAttendance } from "./VmsAttendance";
import { VmsField } from "./VmsField";
import { VmsWelfare } from "./VmsWelfare";
import { VmsReports } from "./VmsReports";
import { VmsRegister } from "./VmsRegister";

export type VmsView =
  | "overview"
  | "volunteers"
  | "ngos"
  | "bulk"
  | "verification"
  | "training"
  | "deployment"
  | "attendance"
  | "field"
  | "welfare"
  | "reports"
  | "register";

const NAV: { id: VmsView; label: string; icon: IconName }[] = [
  { id: "overview", label: "Overview", icon: "layers" },
  { id: "volunteers", label: "Volunteers", icon: "volunteer" },
  { id: "ngos", label: "NGO Management", icon: "management" },
  { id: "bulk", label: "Bulk Registration", icon: "log" },
  { id: "verification", label: "Verification", icon: "shield" },
  { id: "training", label: "Training", icon: "target" },
  { id: "deployment", label: "Deployment & Rosters", icon: "route" },
  { id: "attendance", label: "Attendance", icon: "clock" },
  { id: "field", label: "Field Operations", icon: "map-pin" },
  { id: "welfare", label: "Food & Accommodation", icon: "food" },
  { id: "reports", label: "Reports", icon: "chart" },
];

export function VmsApp({ embedded = false }: { embedded?: boolean }) {
  const [view, setView] = useState<VmsView>("overview");
  const [profileId, setProfileId] = useState<string | null>(null);

  function open(next: VmsView, volunteerId?: string) {
    setView(next);
    if (volunteerId) setProfileId(volunteerId);
  }

  return (
    <div className={`flex min-h-0 flex-1 flex-col bg-ivory ${embedded ? "" : "min-h-screen"}`}>
      {!embedded && (
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
          <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-secondary text-white" aria-label="Home">
            <Icon name="route" className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-ink">Volunteer Command Center</div>
            <div className="text-[11px] text-ink-soft">Registration · verification · training · deployment</div>
          </div>
          <SimTag label="PROTOTYPE" />
          <Link href="/field" className="text-xs text-ink-muted hover:text-ink">
            Field companion
          </Link>
        </header>
      )}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <nav aria-label="Volunteer management" className="max-h-[28vh] w-full shrink-0 overflow-y-auto border-b border-border bg-surface lg:max-h-none lg:w-56 lg:border-b-0 lg:border-r">
          <div className="space-y-0.5 p-2">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => open(item.id)}
                aria-current={view === item.id ? "page" : undefined}
                className={`flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-[13px] ${
                  view === item.id ? "bg-primary-soft font-semibold text-primary-soft-ink" : "text-ink-muted hover:bg-surface-muted hover:text-ink"
                }`}
              >
                <Icon name={item.icon} className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>
        </nav>
        <div className="min-h-0 flex-1 overflow-y-auto scroll-thin p-4 sm:p-6">
          {view === "overview" && <Overview onOpen={open} />}
          {view === "volunteers" && <VmsDirectory profileId={profileId} onProfile={setProfileId} onRegister={() => open("register")} />}
          {view === "ngos" && <VmsNgo />}
          {view === "bulk" && <VmsBulk />}
          {view === "verification" && <VmsVerify onProfile={setProfileId} />}
          {view === "training" && <VmsTraining />}
          {view === "deployment" && <VmsDeploy />}
          {view === "attendance" && <VmsAttendance />}
          {view === "field" && <VmsField onProfile={(id: string) => { setProfileId(id); open("volunteers", id); }} />}
          {view === "welfare" && <VmsWelfare />}
          {view === "reports" && <VmsReports />}
          {view === "register" && <VmsRegister onDone={(id: string) => open("volunteers", id)} onCancel={() => open("volunteers")} />}
        </div>
      </div>
    </div>
  );
}

function Overview({ onOpen }: { onOpen: (view: VmsView) => void }) {
  const store = useAppStore();
  const stats = useMemo(() => {
    const volunteers = store.volunteers;
    const verified = volunteers.filter((v) => v.identityVerificationStatus === "verified").length;
    const pending = volunteers.filter((v) =>
      ["not_initiated", "consent_pending", "verification_pending", "manual_review"].includes(v.identityVerificationStatus ?? "not_initiated")
    ).length;
    const trained = volunteers.filter((v) => isTrained(v.id, store.trainingEnrollments)).length;
    const trainingPending = volunteers.filter((v) => trainingStatusFor(v.id, store.trainingEnrollments) !== "completed").length;
    const deployed = volunteers.filter((v) => store.rosterAssignments.some((a) => a.volunteerId === v.id)).length;
    const onField = volunteers.filter((v) => ["on_duty", "checked_in", "needs_assistance"].includes(v.fieldDutyStatus ?? "")).length;
    const available = volunteers.filter((v) => v.availability === "available" && v.fieldDutyStatus !== "absent").length;
    const absent = volunteers.filter((v) => v.fieldDutyStatus === "absent" || store.attendanceRecords.some((a) => a.volunteerId === v.id && a.status === "absent" && a.date === new Date().toISOString().slice(0, 10))).length;
    const ngoApproved = store.ngos.filter((n) => n.status === "approved").length;
    return { total: volunteers.length, verified, pending, trained, trainingPending, deployed, onField, available, absent, ngoApproved };
  }, [store.volunteers, store.trainingEnrollments, store.rosterAssignments, store.attendanceRecords, store.ngos]);

  const trend = registrationTrend(store.volunteers);
  const byZone = locationDistribution(store.volunteers);
  const ngoRows = ngoParticipation(store.ngos, store.volunteers);
  const attendanceToday = store.attendanceRecords.filter((a) => a.date === new Date().toISOString().slice(0, 10));
  const attSummary = [
    { label: "Present", value: attendanceToday.filter((a) => a.status === "present").length },
    { label: "Late", value: attendanceToday.filter((a) => a.status === "late").length },
    { label: "Absent", value: attendanceToday.filter((a) => a.status === "absent").length },
    { label: "Leave", value: attendanceToday.filter((a) => a.status === "leave").length },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">Volunteer operations</p>
          <h1 className="font-editorial text-2xl text-ink">Command Center</h1>
          <p className="mt-1 max-w-2xl text-xs text-ink-muted">
            Full lifecycle from NGO intake to field completion. Incident dispatch still runs from Live Operations; this workspace manages the people behind it.
          </p>
        </div>
        <SimTag label="DEMO DATA + SESSION" />
      </div>
      <VmsBanner />
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-5">
        <VmsStat label="Registered" value={stats.total} hint="All roster records" />
        <VmsStat label="Verified" value={stats.verified} tone="green" />
        <VmsStat label="Pending verification" value={stats.pending} tone="amber" />
        <VmsStat label="Trained" value={stats.trained} tone="green" hint="Completed a session" />
        <VmsStat label="Training pending" value={stats.trainingPending} />
        <VmsStat label="Deployed" value={stats.deployed} hint="On a saved roster" />
        <VmsStat label="On field" value={stats.onField} tone="green" />
        <VmsStat label="Available" value={stats.available} />
        <VmsStat label="Absent" value={stats.absent} tone="red" />
        <VmsStat label="Approved NGOs" value={stats.ngoApproved} hint={`${store.ngos.length} organisations`} />
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          ["register", "Register volunteer"],
          ["ngos", "Register NGO"],
          ["bulk", "Bulk registration"],
          ["verification", "Verify volunteers"],
          ["deployment", "Generate deployment roster"],
          ["training", "Manage training"],
          ["attendance", "Mark attendance"],
          ["field", "Track field volunteers"],
        ].map(([id, label]) => (
          <Button key={id} size="sm" variant={id === "register" ? "primary" : "outline"} onClick={() => onOpen(id as VmsView)}>
            {label}
          </Button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-ink">Registration trend</h2>
          <p className="mb-3 text-[11px] text-ink-soft">New enrolments by day (seed + this browser session)</p>
          <BarChart items={trend.map((t) => ({ label: t.date.slice(5), value: t.count }))} />
        </section>
        <section className="border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-ink">Location distribution</h2>
          <p className="mb-3 text-[11px] text-ink-soft">Volunteers by assigned zone</p>
          <BarChart
            items={Object.entries(byZone).map(([zoneId, value]) => ({
              label: store.zones.find((z) => z.id === zoneId)?.shortName ?? zoneId,
              value,
            }))}
          />
        </section>
        <section className="border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-ink">Deployment distribution</h2>
          <BarChart
            items={store.deployments.map((d) => ({
              label: d.name,
              value: store.rosterAssignments.filter((a) => a.deploymentId === d.id).length,
            }))}
          />
        </section>
        <section className="border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-ink">Training completion</h2>
          <BarChart
            items={store.trainingSessions.map((t) => ({
              label: t.title,
              value: store.trainingEnrollments.filter((e) => e.sessionId === t.id && e.status === "completed").length,
            }))}
          />
        </section>
        <section className="border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-ink">Attendance today</h2>
          <BarChart items={attSummary} />
        </section>
        <section className="border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-ink">NGO participation</h2>
          <BarChart items={ngoRows.map((row) => ({ label: row.ngo.name, value: row.count }))} />
        </section>
      </div>
    </div>
  );
}
