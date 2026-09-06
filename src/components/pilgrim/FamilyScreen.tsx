"use client";

import { useState } from "react";
import type { Zone } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SimTag } from "@/components/ui/SimTag";

export function FamilyScreen({ zones }: { zones: Zone[] }) {
  const groups = useAppStore((s) => s.familyGroups);
  const createFamilyGroup = useAppStore((s) => s.createFamilyGroup);
  const addFamilyMember = useAppStore((s) => s.addFamilyMember);
  const removeFamilyMember = useAppStore((s) => s.removeFamilyMember);
  const setMeetingPoint = useAppStore((s) => s.setFamilyMeetingPoint);

  const group = groups[0];

  const [groupName, setGroupName] = useState("");
  const [mName, setMName] = useState("");
  const [mPhone, setMPhone] = useState("");
  const [mBand, setMBand] = useState("");
  const [mpZone, setMpZone] = useState(zones[0]?.id ?? "z01");
  const [mpLabel, setMpLabel] = useState("");
  const [editingMp, setEditingMp] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  if (!group) {
    return (
      <div className="flex-1 overflow-y-auto scroll-thin p-4 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-base font-semibold text-ink">Create a family group</h1>
            <p className="text-xs text-ink-muted mt-0.5">
              One shared code for everyone travelling together, plus a meeting point to head for if
              you get separated in the crowd.
            </p>
          </div>
          <SimTag label="ON THIS DEVICE" />
        </div>
        <label className="block">
          <span className="text-xs text-ink-muted">Group name</span>
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g. Sharma family"
            className="mt-1 w-full text-sm rounded-sm border border-border bg-surface px-3 py-2 focus:outline-none focus:border-primary"
          />
        </label>
        <Button className="w-full" size="lg" onClick={() => createFamilyGroup(groupName)}>
          Create group
        </Button>
        <p className="text-[11px] text-ink-soft leading-relaxed">
          Tip: write everyone&rsquo;s name and a phone number on a slip or a wristband for children
          and elders before you enter the ghats.
        </p>
      </div>
    );
  }

  const mp = group.meetingPoint;
  const mpZoneName = mp ? zones.find((z) => z.id === mp.zoneId)?.shortName ?? mp.zoneId : "";

  return (
    <div className="flex-1 overflow-y-auto scroll-thin p-4 space-y-4 pb-8">
      {/* Code card */}
      <div className="rounded-md border border-primary bg-gradient-to-br from-primary-soft to-primary-soft/40 p-4 text-center">
        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary-dark">
          {group.name} · group code
        </div>
        <div className="text-3xl font-mono-num font-semibold text-ink tracking-wider mt-1">
          {group.id}
        </div>
        <p className="text-[11px] text-ink-muted mt-2">
          Share this code with everyone in your group. Quote it at any help desk if someone is
          separated — staff can pull up your members and meeting point.
        </p>
      </div>

      {/* Meeting point */}
      <Section title="Meeting point">
        {mp && !editingMp ? (
          <div className="rounded-sm border border-border bg-surface p-3 flex items-start gap-2.5">
            <Icon name="map-pin" className="h-4 w-4 text-primary-dark shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-ink">{mp.label}</div>
              <div className="text-[11px] text-ink-soft">{mpZoneName}</div>
              <button
                onClick={() => {
                  setMpLabel(mp.label);
                  setMpZone(mp.zoneId);
                  setEditingMp(true);
                }}
                className="text-[11px] text-primary hover:text-primary-dark mt-1"
              >
                Change
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <select
                value={mpZone}
                onChange={(e) => setMpZone(e.target.value)}
                className="text-sm rounded-sm border border-border bg-surface px-2 py-1.5 focus:outline-none focus:border-primary"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.shortName}
                  </option>
                ))}
              </select>
              <input
                value={mpLabel}
                onChange={(e) => setMpLabel(e.target.value)}
                placeholder="e.g. Gate 4, orange pole"
                className="text-sm rounded-sm border border-border bg-surface px-2 py-1.5 focus:outline-none focus:border-primary"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={!mpLabel.trim()}
              onClick={() => {
                setMeetingPoint(group.id, { zoneId: mpZone, label: mpLabel.trim() });
                setEditingMp(false);
              }}
            >
              {mp ? "Update meeting point" : "Set meeting point"}
            </Button>
          </div>
        )}
      </Section>

      {/* Members */}
      <Section title={`Members (${group.members.length})`}>
        <div className="space-y-1.5">
          {group.members.map((m) => (
            <div key={m.id} className="rounded-sm border border-border bg-surface p-2.5">
              <div className="flex items-start justify-between gap-2">
                <label className="flex items-start gap-2 min-w-0">
                  <input
                    type="checkbox"
                    checked={!!checked[m.id]}
                    onChange={(e) => setChecked((c) => ({ ...c, [m.id]: e.target.checked }))}
                    className="h-4 w-4 accent-primary mt-0.5"
                  />
                  <span className="min-w-0">
                    <span
                      className={`text-sm font-medium ${
                        checked[m.id] ? "text-ink-soft line-through" : "text-ink"
                      }`}
                    >
                      {m.name}
                    </span>
                    <span className="block text-[11px] text-ink-soft">
                      {[m.phone, m.wristband ? `band ${m.wristband}` : null, m.note]
                        .filter(Boolean)
                        .join(" · ") || "no details"}
                    </span>
                  </span>
                </label>
                <button
                  onClick={() => removeFamilyMember(group.id, m.id)}
                  className="text-ink-soft hover:text-status-red p-1 shrink-0"
                  aria-label={`Remove ${m.name}`}
                >
                  <Icon name="close" className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {group.members.length === 0 && (
            <p className="text-xs text-ink-soft">No members added yet.</p>
          )}
        </div>

        <div className="mt-3 rounded-sm border border-border bg-surface-muted/40 p-2.5 space-y-2">
          <input
            value={mName}
            onChange={(e) => setMName(e.target.value)}
            placeholder="Name"
            className="w-full text-sm rounded-sm border border-border bg-surface px-2 py-1.5 focus:outline-none focus:border-primary"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={mPhone}
              onChange={(e) => setMPhone(e.target.value)}
              inputMode="tel"
              placeholder="Phone (optional)"
              className="text-sm rounded-sm border border-border bg-surface px-2 py-1.5 focus:outline-none focus:border-primary"
            />
            <input
              value={mBand}
              onChange={(e) => setMBand(e.target.value)}
              placeholder="Wristband no."
              className="text-sm rounded-sm border border-border bg-surface px-2 py-1.5 focus:outline-none focus:border-primary"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={!mName.trim()}
            onClick={() => {
              addFamilyMember(group.id, { name: mName, phone: mPhone, wristband: mBand });
              setMName("");
              setMPhone("");
              setMBand("");
            }}
          >
            Add member
          </Button>
        </div>
      </Section>

      <p className="text-[10px] text-ink-soft leading-relaxed">
        Stored on this device for the demo. In a live deployment the group code would be looked up by
        help-desk and control-room staff and linked to lost &amp; found.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft mb-2">
        {title}
      </div>
      {children}
    </div>
  );
}
