"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import type { Ngo, NgoStatus } from "@/lib/volunteerTypes";
import { Field, inputClass, Modal, NgoBadge, VmsStat } from "./vmsUi";

export function VmsNgo() {
  const store = useAppStore();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedNgo, setSelectedNgo] = useState<Ngo | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectingNgoId, setRejectingNgoId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    registrationId: "",
    authorizedRepresentative: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    state: "Maharashtra",
    district: "Nashik",
    volunteerCountDeclared: 50,
    areasOfOperation: "Ramkund, Godavari Ghats, Panchavati",
    documentsOnFile: true,
  });

  const totalNgos = store.ngos.length;
  const approvedNgos = store.ngos.filter((n) => n.status === "approved").length;
  const pendingNgos = store.ngos.filter((n) => n.status === "submitted" || n.status === "under_verification").length;
  const totalDeclaredVolunteers = store.ngos.reduce((sum, n) => sum + (n.volunteerCountDeclared || 0), 0);

  function handleCreateNgo(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.registrationId) return;

    store.upsertNgo({
      name: form.name.trim(),
      registrationId: form.registrationId.trim(),
      authorizedRepresentative: form.authorizedRepresentative.trim(),
      contactPerson: form.contactPerson.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      state: form.state.trim(),
      district: form.district.trim(),
      volunteerCountDeclared: Number(form.volunteerCountDeclared) || 0,
      areasOfOperation: form.areasOfOperation.split(",").map((s) => s.trim()).filter(Boolean),
      documentsOnFile: form.documentsOnFile,
      status: "approved", // default approved in prototype for convenience
    });

    setShowRegisterModal(false);
    setForm({
      name: "",
      registrationId: "",
      authorizedRepresentative: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      state: "Maharashtra",
      district: "Nashik",
      volunteerCountDeclared: 50,
      areasOfOperation: "Ramkund, Godavari Ghats, Panchavati",
      documentsOnFile: true,
    });
  }

  function handleStatusChange(ngoId: string, status: NgoStatus) {
    if (status === "rejected") {
      setRejectingNgoId(ngoId);
      return;
    }
    store.setNgoStatus(ngoId, status);
  }

  function confirmRejection() {
    if (!rejectingNgoId) return;
    store.setNgoStatus(rejectingNgoId, "rejected", rejectionReason || "Criteria not met");
    setRejectingNgoId(null);
    setRejectionReason("");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">Partner Organizations</p>
          <h1 className="font-editorial text-2xl text-ink">NGO Management</h1>
          <p className="text-xs text-ink-muted">
            Accreditation, quota management and volunteer affiliation for participating civil society organizations.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowRegisterModal(true)}>
          <span className="mr-1.5 font-bold">+</span>
          Register NGO
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <VmsStat label="Registered NGOs" value={totalNgos} />
        <VmsStat label="Approved NGOs" value={approvedNgos} tone="green" />
        <VmsStat label="Pending Accreditation" value={pendingNgos} tone="amber" />
        <VmsStat label="Declared Quota" value={totalDeclaredVolunteers} hint="Pledged volunteer capacity" />
      </div>

      {/* NGO List Table */}
      <div className="overflow-x-auto border border-border bg-surface shadow-card">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-surface-muted/60 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
            <tr>
              <th className="p-3">Organization & Reg ID</th>
              <th className="p-3">Authorized Representative</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Pledged Volunteers</th>
              <th className="p-3">Registered on Setu</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-ink">
            {store.ngos.map((ngo) => {
              const actualVolunteers = store.volunteers.filter((v) => v.ngoId === ngo.id).length;

              return (
                <tr key={ngo.id} className="hover:bg-surface-muted/50 transition-colors">
                  <td className="p-3">
                    <div className="font-semibold text-ink">{ngo.name}</div>
                    <div className="font-mono-num text-[10px] text-ink-soft">Reg: {ngo.registrationId}</div>
                    <div className="text-[10px] text-ink-soft truncate max-w-xs">{ngo.areasOfOperation.join(", ")}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-ink">{ngo.authorizedRepresentative}</div>
                    <div className="text-[10px] text-ink-soft">{ngo.district}, {ngo.state}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-ink">{ngo.phone}</div>
                    <div className="text-[10px] text-ink-soft">{ngo.email}</div>
                  </td>
                  <td className="p-3 font-mono-num font-semibold text-ink">
                    {ngo.volunteerCountDeclared}
                  </td>
                  <td className="p-3 font-mono-num text-primary font-bold">
                    {actualVolunteers}
                  </td>
                  <td className="p-3">
                    <NgoBadge status={ngo.status} />
                    {ngo.rejectionReason && (
                      <div className="text-[10px] text-status-red mt-0.5">{ngo.rejectionReason}</div>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      {ngo.status !== "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(ngo.id, "approved")}
                        >
                          Approve
                        </Button>
                      )}
                      {ngo.status !== "rejected" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStatusChange(ngo.id, "rejected")}
                        >
                          Reject
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedNgo(ngo)}
                      >
                        Details
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Registration Modal */}
      <Modal open={showRegisterModal} title="Register New NGO / Organization" onClose={() => setShowRegisterModal(false)}>
        <form onSubmit={handleCreateNgo} className="space-y-4 text-xs">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="NGO Name *" hint="Official registered title">
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Bharat Sevashram Sangha"
                className={inputClass}
              />
            </Field>

            <Field label="Registration Number / Darpan ID *" hint="Govt or Trust Registration ID">
              <input
                required
                type="text"
                value={form.registrationId}
                onChange={(e) => setForm({ ...form, registrationId: e.target.value })}
                placeholder="MH/2018/0192837"
                className={inputClass}
              />
            </Field>

            <Field label="Authorized Representative">
              <input
                type="text"
                value={form.authorizedRepresentative}
                onChange={(e) => setForm({ ...form, authorizedRepresentative: e.target.value })}
                placeholder="e.g., Swami Atmananda"
                className={inputClass}
              />
            </Field>

            <Field label="Primary Contact Person">
              <input
                type="text"
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                placeholder="e.g., Dr. Arvind Joshi"
                className={inputClass}
              />
            </Field>

            <Field label="Official Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contact@ngo.org"
                className={inputClass}
              />
            </Field>

            <Field label="Contact Phone">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="98XXXXXXXX"
                className={inputClass}
              />
            </Field>

            <Field label="Declared Volunteer Capacity">
              <input
                type="number"
                min="1"
                max="5000"
                value={form.volunteerCountDeclared}
                onChange={(e) => setForm({ ...form, volunteerCountDeclared: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>

            <Field label="Areas of Operation / Sectors">
              <input
                type="text"
                value={form.areasOfOperation}
                onChange={(e) => setForm({ ...form, areasOfOperation: e.target.value })}
                placeholder="Ghats, Sadhugram, Trimbak Ring"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Registered Address">
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Full physical address"
              className={inputClass}
            />
          </Field>

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowRegisterModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save & Register NGO
            </Button>
          </div>
        </form>
      </Modal>

      {/* Rejection Modal */}
      <Modal open={Boolean(rejectingNgoId)} title="Specify Reason for Rejection" onClose={() => setRejectingNgoId(null)}>
        <div className="space-y-4 text-xs">
          <Field label="Rejection Justification">
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Missing valid trust deed or unauthorized representative."
              className="w-full border border-border bg-surface p-2 text-xs text-ink"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setRejectingNgoId(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={confirmRejection}>
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* NGO Details Drawer / Modal */}
      {selectedNgo && (
        <Modal open={true} title={`NGO Details — ${selectedNgo.name}`} onClose={() => setSelectedNgo(null)}>
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div>
                <h3 className="font-semibold text-sm text-ink">{selectedNgo.name}</h3>
                <p className="font-mono-num text-ink-soft">Reg ID: {selectedNgo.registrationId}</p>
              </div>
              <NgoBadge status={selectedNgo.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 border border-border bg-surface-muted/50 p-3">
              <div>
                <span className="font-semibold text-ink-soft">Authorized Rep:</span>{" "}
                <span className="text-ink">{selectedNgo.authorizedRepresentative}</span>
              </div>
              <div>
                <span className="font-semibold text-ink-soft">Contact Person:</span>{" "}
                <span className="text-ink">{selectedNgo.contactPerson}</span>
              </div>
              <div>
                <span className="font-semibold text-ink-soft">Email:</span>{" "}
                <span className="text-ink">{selectedNgo.email}</span>
              </div>
              <div>
                <span className="font-semibold text-ink-soft">Phone:</span>{" "}
                <span className="text-ink">{selectedNgo.phone}</span>
              </div>
              <div>
                <span className="font-semibold text-ink-soft">Declared Quota:</span>{" "}
                <span className="font-mono-num text-ink">{selectedNgo.volunteerCountDeclared} volunteers</span>
              </div>
              <div>
                <span className="font-semibold text-ink-soft">Address:</span>{" "}
                <span className="text-ink">{selectedNgo.address}, {selectedNgo.district}</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-ink mb-2">
                Affiliated Volunteers on Record ({store.volunteers.filter((v) => v.ngoId === selectedNgo.id).length})
              </h4>
              <div className="max-h-48 overflow-y-auto border border-border">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-surface-muted border-b border-border text-ink-soft">
                    <tr>
                      <th className="p-2">ID</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Zone</th>
                      <th className="p-2">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {store.volunteers.filter((v) => v.ngoId === selectedNgo.id).map((vol) => (
                      <tr key={vol.id}>
                        <td className="p-2 font-mono-num text-primary">{vol.id}</td>
                        <td className="p-2 font-medium text-ink">{vol.name}</td>
                        <td className="p-2 text-ink-soft">{vol.zoneId}</td>
                        <td className="p-2">{vol.identityVerificationStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end border-t border-border pt-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedNgo(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
