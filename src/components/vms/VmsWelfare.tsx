"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import type { MealType } from "@/lib/volunteerTypes";
import { Field, inputClass, Modal, VmsBanner, VmsStat } from "./vmsUi";

export function VmsWelfare() {
  const store = useAppStore();
  const [activeTab, setActiveTab] = useState<"food" | "accommodation">("food");
  const [showAssignBedModal, setShowAssignBedModal] = useState(false);
  const [showMealModal, setShowMealModal] = useState(false);

  const [mealForm, setMealForm] = useState({
    volunteerId: store.volunteers[0]?.id || "",
    date: new Date().toISOString().slice(0, 10),
    meal: "lunch" as MealType,
    location: "Panchavati Central Volunteer Langar #2",
    shift: "morning" as const,
  });

  const [bedForm, setBedForm] = useState({
    accommodationId: store.accommodations[0]?.id || "",
    volunteerId: store.volunteers[0]?.id || "",
    bedLabel: "B-12",
  });

  const totalAccommodations = store.accommodations.length;
  const totalBeds = store.accommodations.reduce((sum, a) => sum + a.capacity, 0);
  const occupiedBeds = store.accommodationAssignments.filter((a) => !a.checkOutAt).length;
  const mealsIssued = store.mealAllocations.filter((m) => m.status === "issued").length;
  const mealsEntitled = store.mealAllocations.length;

  function handleAllocateMeal(e: React.FormEvent) {
    e.preventDefault();
    store.allocateMeal({
      ...mealForm,
      entitled: true,
      status: "entitled",
    });
    setShowMealModal(false);
  }

  function handleAssignBed(e: React.FormEvent) {
    e.preventDefault();
    store.assignBed(bedForm.accommodationId, bedForm.volunteerId, bedForm.bedLabel);
    setShowAssignBedModal(false);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">Logistics & Volunteer Care</p>
          <h1 className="font-editorial text-2xl text-ink">Food & Accommodation (Welfare)</h1>
          <p className="text-xs text-ink-muted">
            Langar meal entitlement, coupon issuance and staging camp dormitory bed allocation.
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === "food" ? (
            <Button variant="primary" size="sm" onClick={() => setShowMealModal(true)}>
              <Icon name="food" className="mr-1.5 h-3.5 w-3.5" />
              + Issue Meal Entitlement
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => setShowAssignBedModal(true)}>
              <span className="mr-1.5 font-bold">+</span>
              Allocate Bed Space
            </Button>
          )}
        </div>
      </div>

      <VmsBanner />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <VmsStat label="Total Bed Capacity" value={totalBeds} hint={`${totalAccommodations} camp dormitories`} />
        <VmsStat
          label="Bed Occupancy"
          value={`${occupiedBeds} / ${totalBeds}`}
          tone={occupiedBeds > totalBeds * 0.9 ? "amber" : "green"}
        />
        <VmsStat label="Meals Entitled Today" value={mealsEntitled} />
        <VmsStat label="Meals Distributed" value={mealsIssued} tone="green" />
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-border text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("food")}
          className={`pb-2.5 px-4 font-semibold border-b-2 transition-colors ${
            activeTab === "food"
              ? "border-primary text-primary"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          Meal Distribution & Langar Points
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("accommodation")}
          className={`pb-2.5 px-4 font-semibold border-b-2 transition-colors ${
            activeTab === "accommodation"
              ? "border-primary text-primary"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          Accommodation Camps & Dormitories
        </button>
      </div>

      {/* Food Tab */}
      {activeTab === "food" && (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-border bg-surface shadow-card">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface-muted/60 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                <tr>
                  <th className="p-3">Volunteer</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Meal Type</th>
                  <th className="p-3">Distribution Point</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-ink">
                {store.mealAllocations.map((m) => {
                  const vol = store.volunteers.find((v) => v.id === m.volunteerId);

                  return (
                    <tr key={m.id} className="hover:bg-surface-muted/40 transition-colors">
                      <td className="p-3 font-semibold text-ink">
                        {vol?.name || m.volunteerId}
                        <div className="font-mono-num text-[10px] text-ink-soft">{m.volunteerId}</div>
                      </td>
                      <td className="p-3 font-mono-num">{m.date}</td>
                      <td className="p-3 capitalize font-medium">{m.meal}</td>
                      <td className="p-3 text-ink-muted">{m.location}</td>
                      <td className="p-3">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                            m.status === "issued"
                              ? "bg-status-green-bg text-status-green border border-status-green-border"
                              : "bg-surface-muted text-ink-soft border border-border"
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {m.status !== "issued" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => store.markMealDistributed(m.id, "issued")}
                          >
                            Mark Issued
                          </Button>
                        ) : (
                          <span className="text-[11px] text-status-green font-medium">✓ Distributed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Accommodation Tab */}
      {activeTab === "accommodation" && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {store.accommodations.map((acc) => {
              const assignments = store.accommodationAssignments.filter((a) => a.accommodationId === acc.id && !a.checkOutAt);
              const occupancyPct = Math.round((assignments.length / acc.capacity) * 100);

              return (
                <div key={acc.id} className="border border-border bg-surface p-4 shadow-card space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono-num text-[10px] font-bold text-primary">{acc.id}</span>
                      <h3 className="font-semibold text-sm text-ink">{acc.name}</h3>
                      <p className="text-[11px] text-ink-soft">{acc.address}</p>
                    </div>
                    <span className="rounded bg-surface-muted px-2 py-0.5 text-[10px] font-bold uppercase text-ink-muted">
                      {acc.type.replace("_", " ")}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-ink-muted">
                      <span>Occupancy:</span>
                      <span className="font-mono-num font-semibold">{assignments.length} / {acc.capacity} beds</span>
                    </div>
                    <div className="h-2 rounded bg-surface-muted overflow-hidden">
                      <div
                        className={`h-full ${occupancyPct > 90 ? "bg-status-amber" : "bg-primary"}`}
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="border-t border-border pt-2">
                    <span className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">
                      Current Residents:
                    </span>
                    <div className="max-h-24 overflow-y-auto space-y-1 text-[11px]">
                      {assignments.map((asgn) => {
                        const vol = store.volunteers.find((v) => v.id === asgn.volunteerId);
                        return (
                          <div key={asgn.id} className="flex justify-between items-center bg-surface-muted/50 px-2 py-1 rounded">
                            <span>{vol?.name || asgn.volunteerId} (Bed {asgn.bedLabel})</span>
                            <button
                              type="button"
                              onClick={() => store.accommodationCheck(asgn.id, "out")}
                              className="text-status-red hover:underline text-[10px]"
                            >
                              Check Out
                            </button>
                          </div>
                        );
                      })}
                      {assignments.length === 0 && (
                        <p className="text-[11px] text-ink-soft">Dormitory currently empty.</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Allocate Meal Modal */}
      <Modal open={showMealModal} title="Issue Volunteer Meal Coupon" onClose={() => setShowMealModal(false)}>
        <form onSubmit={handleAllocateMeal} className="space-y-4 text-xs">
          <Field label="Volunteer">
            <select
              value={mealForm.volunteerId}
              onChange={(e) => setMealForm({ ...mealForm, volunteerId: e.target.value })}
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
            <Field label="Meal">
              <select
                value={mealForm.meal}
                onChange={(e) => setMealForm({ ...mealForm, meal: e.target.value as MealType })}
                className={inputClass}
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
              </select>
            </Field>

            <Field label="Date">
              <input
                type="date"
                value={mealForm.date}
                onChange={(e) => setMealForm({ ...mealForm, date: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Distribution Langar / Counter">
            <input
              type="text"
              value={mealForm.location}
              onChange={(e) => setMealForm({ ...mealForm, location: e.target.value })}
              className={inputClass}
            />
          </Field>

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowMealModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Issue Entitlement
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Bed Modal */}
      <Modal open={showAssignBedModal} title="Allocate Staging Camp Bed" onClose={() => setShowAssignBedModal(false)}>
        <form onSubmit={handleAssignBed} className="space-y-4 text-xs">
          <Field label="Accommodation Facility">
            <select
              value={bedForm.accommodationId}
              onChange={(e) => setBedForm({ ...bedForm, accommodationId: e.target.value })}
              className={inputClass}
            >
              {store.accommodations.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.address})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Volunteer">
            <select
              value={bedForm.volunteerId}
              onChange={(e) => setBedForm({ ...bedForm, volunteerId: e.target.value })}
              className={inputClass}
            >
              {store.volunteers.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.id})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Bed / Cot Number">
            <input
              required
              type="text"
              value={bedForm.bedLabel}
              onChange={(e) => setBedForm({ ...bedForm, bedLabel: e.target.value })}
              placeholder="e.g., Block-A Bed 14"
              className={inputClass}
            />
          </Field>

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAssignBedModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Assign & Check In
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
