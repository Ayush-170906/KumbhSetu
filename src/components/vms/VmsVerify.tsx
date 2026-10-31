"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import type { IdentityVerificationStatus, Volunteer } from "@/lib/types";
import { isAgeEligible, profileCompleteness } from "@/lib/volunteerOps";
import { IdentityBadge, Modal, VmsBanner, VmsStat } from "./vmsUi";

export function VmsVerify({ onProfile }: { onProfile: (id: string) => void }) {
  const store = useAppStore();
  const [filterStatus, setFilterStatus] = useState<IdentityVerificationStatus | "all">("all");
  const [reviewVolunteer, setReviewVolunteer] = useState<Volunteer | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewerName, setReviewerName] = useState("Control Room Desk 3");

  const volunteers = store.volunteers;

  const stats = useMemo(() => {
    return {
      total: volunteers.length,
      verified: volunteers.filter((v) => v.identityVerificationStatus === "verified").length,
      pending: volunteers.filter((v) =>
        ["consent_pending", "verification_pending", "manual_review"].includes(
          v.identityVerificationStatus ?? "not_initiated"
        )
      ).length,
      manualReview: volunteers.filter((v) => v.identityVerificationStatus === "manual_review").length,
      failed: volunteers.filter((v) => v.identityVerificationStatus === "failed").length,
    };
  }, [volunteers]);

  const filtered = useMemo(() => {
    if (filterStatus === "all") return volunteers;
    return volunteers.filter((v) => (v.identityVerificationStatus ?? "not_initiated") === filterStatus);
  }, [volunteers, filterStatus]);

  function handleVerifyAction(status: IdentityVerificationStatus) {
    if (!reviewVolunteer) return;
    store.setIdentityVerification(reviewVolunteer.id, status, reviewerName, reviewNote.trim() || undefined);
    setReviewVolunteer(null);
    setReviewNote("");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">Trust & Identity</p>
          <h1 className="font-editorial text-2xl text-ink">Verification Management</h1>
          <p className="text-xs text-ink-muted">
            Manual document review, demographic eligibility audits and physical desk verification queue.
          </p>
        </div>
      </div>

      <VmsBanner />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <VmsStat label="Total Profiles" value={stats.total} />
        <VmsStat label="Verified" value={stats.verified} tone="green" />
        <VmsStat label="Pending Audit" value={stats.pending} tone="amber" />
        <VmsStat label="Manual Desk Review" value={stats.manualReview} tone="amber" />
        <VmsStat label="Rejected / Failed" value={stats.failed} tone="red" />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 text-xs">
        <div className="flex flex-wrap gap-1.5">
          {[
            ["all", "All Records"],
            ["manual_review", "Manual Review Queue"],
            ["verification_pending", "Pending Checks"],
            ["consent_pending", "Consent Pending"],
            ["verified", "Verified"],
            ["failed", "Failed"],
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
          Showing {filtered.length} candidates
        </span>
      </div>

      {/* Verification Queue Table */}
      <div className="overflow-x-auto border border-border bg-surface shadow-card">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-surface-muted/60 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
            <tr>
              <th className="p-3">Volunteer ID & Name</th>
              <th className="p-3">Demographic Age</th>
              <th className="p-3">Completeness</th>
              <th className="p-3">Sponsoring NGO</th>
              <th className="p-3">Current Status</th>
              <th className="p-3 text-right">Audit & Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-ink">
            {filtered.map((v) => {
              const comp = profileCompleteness(v);
              const isEligible = isAgeEligible(v.yearOfBirth);
              const ngo = store.ngos.find((n) => n.id === v.ngoId);

              return (
                <tr key={v.id} className="hover:bg-surface-muted/40 transition-colors">
                  <td className="p-3">
                    <div className="font-mono-num font-bold text-primary text-[11px]">{v.id}</div>
                    <div className="font-semibold text-ink">{v.name}</div>
                    <div className="text-[10px] text-ink-soft">{v.phone || "No phone"}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-mono-num text-ink">{v.yearOfBirth || "N/A"}</div>
                    <div className="text-[10px]">
                      {isEligible ? (
                        <span className="text-status-green">✓ Eligible (18+)</span>
                      ) : (
                        <span className="text-status-red font-semibold">✗ Ineligible (under 18)</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-surface-muted rounded overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${comp.score}%` }}
                        />
                      </div>
                      <span className="font-mono-num text-[11px] text-ink-muted">{comp.score}%</span>
                    </div>
                  </td>
                  <td className="p-3 text-ink">
                    {ngo?.name || "Individual"}
                  </td>
                  <td className="p-3">
                    <IdentityBadge status={v.identityVerificationStatus} />
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReviewVolunteer(v)}
                      >
                        Review ID
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onProfile(v.id)}
                      >
                        Profile
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Review Decision Modal */}
      {reviewVolunteer && (
        <Modal
          open={true}
          title={`Document Verification Audit — ${reviewVolunteer.name} (${reviewVolunteer.id})`}
          onClose={() => setReviewVolunteer(null)}
        >
          <div className="space-y-4 text-xs">
            <div className="border border-border bg-surface-muted/40 p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-ink">
                <div><strong>Full Name:</strong> {reviewVolunteer.name}</div>
                <div><strong>YOB:</strong> {reviewVolunteer.yearOfBirth || "N/A"}</div>
                <div><strong>Mobile:</strong> {reviewVolunteer.phone || "N/A"}</div>
                <div><strong>Emergency Contact:</strong> {reviewVolunteer.emergencyContactName || "N/A"}</div>
                <div><strong>District:</strong> {reviewVolunteer.district || "Nashik"}</div>
                <div><strong>Verification Method:</strong> Physical Document Review</div>
              </div>
            </div>

            <div className="rounded border border-border bg-surface p-3 space-y-2">
              <span className="font-semibold text-ink">Reviewer Attribution & Desk Note:</span>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="Reviewer officer / desk identifier"
                className="w-full border border-border bg-surface px-3 py-1.5 text-xs text-ink mb-2"
              />
              <textarea
                rows={2}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Note on physical ID inspected (e.g., Verified Voter ID card / Driving Licence match)"
                className="w-full border border-border bg-surface p-2 text-xs text-ink"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
              <Button variant="ghost" size="sm" onClick={() => setReviewVolunteer(null)}>
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleVerifyAction("failed")}
                >
                  Reject Verification
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleVerifyAction("manual_review")}
                >
                  Hold for Physical Inspection
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleVerifyAction("verified")}
                >
                  ✓ Approve & Mark Verified
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
