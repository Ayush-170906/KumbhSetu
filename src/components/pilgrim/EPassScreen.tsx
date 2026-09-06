"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { EPass, EPassCategory } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { EPASS_META, EPASS_CLUSTER_LABEL, epassPayload } from "@/lib/epass";
import { SNAN_CALENDAR } from "@/lib/snanCalendar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SimTag } from "@/components/ui/SimTag";

const CATS: EPassCategory[] = ["general", "senior_divyang", "family_children", "snan_slot"];

function fmtDate(iso: string): string {
  if (iso === "any") return "Any day (general visit)";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function EPassScreen() {
  const passes = useAppStore((s) => s.ePasses);
  const issueEPass = useAppStore((s) => s.issueEPass);

  const [creating, setCreating] = useState(passes.length === 0);
  const [holder, setHolder] = useState("");
  const [cluster, setCluster] = useState<EPass["cluster"]>("nashik");
  const [date, setDate] = useState("any");
  const [cat, setCat] = useState<EPassCategory>("general");
  const [size, setSize] = useState(2);

  function issue() {
    issueEPass({ holder, cluster, date, category: cat, partySize: size });
    setCreating(false);
    setHolder("");
  }

  if (creating) {
    return (
      <div className="flex-1 overflow-y-auto scroll-thin p-4 space-y-4 pb-8">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-base font-semibold text-ink">Get an entry pass</h1>
            <p className="text-xs text-ink-muted mt-0.5">
              A colour-coded pass with a scannable code — show it at the gate to use the right lane
              instead of the general queue.
            </p>
          </div>
          <SimTag label="DEMO PASS" />
        </div>

        <label className="block">
          <span className="text-xs text-ink-muted">Name on the pass</span>
          <input
            value={holder}
            onChange={(e) => setHolder(e.target.value)}
            placeholder="e.g. Sharma family"
            className="mt-1 w-full text-sm rounded-sm border border-border bg-surface px-3 py-2 focus:outline-none focus:border-primary"
          />
        </label>

        <div>
          <div className="text-xs text-ink-muted mb-1">Which cluster?</div>
          <div className="flex rounded-sm border border-border overflow-hidden">
            {(["nashik", "trimbakeshwar"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCluster(c)}
                className={`flex-1 text-[11px] py-2 font-medium transition-colors ${
                  cluster === c ? "bg-primary text-white" : "bg-surface text-ink-muted"
                }`}
              >
                {c === "nashik" ? "Nashik (Ramkund)" : "Trimbakeshwar"}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-xs text-ink-muted">Day</span>
          <select
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full text-sm rounded-sm border border-border bg-surface px-2 py-2 focus:outline-none focus:border-primary"
          >
            <option value="any">Any day (general visit)</option>
            {SNAN_CALENDAR.map((s) => (
              <option key={s.date} value={s.date}>
                {fmtDate(s.date)} — {s.name}
              </option>
            ))}
          </select>
        </label>

        <div>
          <div className="text-xs text-ink-muted mb-1.5">Pass type</div>
          <div className="space-y-1.5">
            {CATS.map((c) => {
              const m = EPASS_META[c];
              return (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`w-full flex items-center gap-2.5 rounded-sm border px-3 py-2 text-left transition-colors ${
                    cat === c ? "border-primary bg-primary-soft/40" : "border-border bg-surface"
                  }`}
                >
                  <span
                    className="h-4 w-4 rounded-sm shrink-0"
                    style={{ backgroundColor: `#${m.band}` }}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">{m.label}</span>
                    <span className="block text-[11px] text-ink-soft">{m.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-ink">Party size</span>
          <input
            type="number"
            min={1}
            max={50}
            value={size}
            onChange={(e) => setSize(Math.max(1, Number(e.target.value) || 1))}
            className="w-16 text-sm rounded-sm border border-border bg-surface px-2 py-1 focus:outline-none focus:border-primary"
          />
        </div>

        <Button className="w-full" size="lg" disabled={!holder.trim()} onClick={issue}>
          Issue pass
        </Button>
        {passes.length > 0 && (
          <button
            onClick={() => setCreating(false)}
            className="w-full text-xs text-ink-soft hover:text-ink"
          >
            Back to my passes
          </button>
        )}
        <p className="text-[10px] text-ink-soft leading-relaxed">
          Illustrative for the demo — a live pass would be issued by the Mela authority after
          registration and tied to your ID.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scroll-thin p-4 space-y-3 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-ink">My entry passes</h1>
        <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
          <Icon name="qr" className="h-3.5 w-3.5" /> New pass
        </Button>
      </div>
      {passes.map((p) => (
        <PassCard key={p.id} pass={p} />
      ))}
    </div>
  );
}

function PassCard({ pass }: { pass: EPass }) {
  const m = EPASS_META[pass.category];
  return (
    <div className="rounded-md border border-border bg-surface shadow-card overflow-hidden">
      <div
        className="px-4 py-2 flex items-center justify-between"
        style={{ backgroundColor: `#${m.band}`, color: `#${m.ink}` }}
      >
        <span className="text-xs font-bold uppercase tracking-wide">{m.label}</span>
        <span className="text-[10px] font-mono-num opacity-90">Kumbh Setu</span>
      </div>
      <div className="p-4 flex gap-4">
        <div className="rounded-sm bg-white p-2 border border-border shrink-0">
          <QRCodeSVG value={epassPayload(pass)} size={104} level="M" marginSize={0} fgColor="#241a12" />
        </div>
        <div className="min-w-0 text-xs space-y-1">
          <div className="text-sm font-semibold text-ink">{pass.holder}</div>
          <div className="font-mono-num text-ink-muted">{pass.id}</div>
          <div className="text-ink-soft">{EPASS_CLUSTER_LABEL[pass.cluster]}</div>
          <div className="text-ink-soft">
            {pass.date === "any"
              ? "Any day (general visit)"
              : new Date(`${pass.date}T00:00:00`).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
          </div>
          <div className="text-ink-soft">
            Party of {pass.partySize}
          </div>
        </div>
      </div>
      <div className="px-4 pb-3 text-[11px] text-ink-soft">{m.hint} Show this at the gate.</div>
    </div>
  );
}
