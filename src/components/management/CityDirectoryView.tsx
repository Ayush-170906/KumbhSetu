"use client";

import { useMemo, useState } from "react";
import {
  NASHIK_DIRECTORY,
  GROUP_LABEL,
  GROUP_ORDER,
  groupCounts,
  placesIn,
  type DirectoryGroup,
} from "@/lib/nashikDirectory";
import { Icon } from "@/components/ui/Icon";
import { SimTag } from "@/components/ui/SimTag";

/**
 * Nashik-area reference records compiled by Nashik Monitor. Not a verified
 * inventory and not wired into the simulated dispatch system.
 */
export function CityDirectoryView() {
  const [group, setGroup] = useState<DirectoryGroup>("medical");
  const [query, setQuery] = useState("");
  const counts = useMemo(() => groupCounts(), []);
  const rows = useMemo(() => placesIn(group, query).slice(0, 400), [group, query]);
  const total = placesIn(group, query).length;

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h2 className="font-editorial text-xl text-ink">Place directory</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Nashik-area reference records — {NASHIK_DIRECTORY.count.toLocaleString()} entries across{" "}
            {NASHIK_DIRECTORY.datasets.length} datasets.
          </p>
        </div>
        <SimTag label="REFERENCE ONLY" />
      </div>
      <p className="text-[10px] text-ink-soft mb-2">Source: {NASHIK_DIRECTORY.source}</p>
      <div className="mb-4 border-l-2 border-status-amber bg-status-amber-bg/50 px-3 py-2 text-xs text-ink-muted">
        Source age, coverage and coordinate precision vary. This is not a live availability or capacity feed. Verify any facility and contact directly before operational use. Data licensing for the compiled records has not been independently confirmed.
        <a className="ml-1 underline underline-offset-2" href="https://github.com/tanmayk1234/nashik-monitor-v2" target="_blank" rel="noreferrer">Source notes</a>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {GROUP_ORDER.map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            className={`text-xs rounded-sm border px-2.5 py-1.5 transition-colors ${
              g === group
                ? "border-primary bg-primary-soft text-primary-soft-ink font-medium"
                : "border-border bg-surface text-ink-muted hover:border-primary-soft"
            }`}
          >
            {GROUP_LABEL[g]}
            <span className="ml-1.5 text-[10px] text-ink-soft">{counts[g].toLocaleString()}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 max-w-sm">
          <Icon name="search" className="h-3.5 w-3.5 text-ink-soft absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${GROUP_LABEL[group].toLowerCase()}…`}
            className="w-full text-sm rounded-sm border border-border bg-surface pl-8 pr-3 py-1.5 focus:outline-none focus:border-primary"
          />
        </div>
        <span className="text-xs text-ink-soft">
          {total.toLocaleString()} result{total === 1 ? "" : "s"}
          {total > rows.length ? ` · showing ${rows.length}` : ""}
        </span>
      </div>

      <div className="border border-border rounded-sm divide-y divide-border overflow-hidden">
        {rows.length === 0 && (
          <p className="text-xs text-ink-soft p-4">No matches in this category.</p>
        )}
        {rows.map((p) => (
          <div key={p.id} className="flex items-start gap-3 px-3 py-2.5 odd:bg-surface even:bg-surface-muted/40">
            <div className="flex-1 min-w-0">
              <div className="text-sm text-ink font-medium truncate">{p.name}</div>
              <div className="text-[11px] text-ink-soft mt-0.5">
                {p.kind}
                {p.address ? ` · ${p.address}` : ""}
              </div>
            </div>
            <div className="shrink-0 text-right text-[11px]">
              {p.phone && <div className="text-ink-muted font-mono-num">{p.phone}</div>}
              {p.beds ? <div className="text-ink-soft">{p.beds} beds</div> : null}
              <a
                href={`https://www.google.com/maps?q=${p.lat},${p.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-dark inline-flex items-center gap-0.5"
              >
                map <Icon name="arrow-up-right" className="h-3 w-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
