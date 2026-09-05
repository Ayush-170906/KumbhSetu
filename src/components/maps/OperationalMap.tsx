"use client";

import type { Zone, Facility, Volunteer, Incident, RiskBand } from "@/lib/types";
import { MAP_VIEWBOX } from "@/lib/seed";
import { facilityIconName } from "@/components/pilgrim/facilityMeta";
import { Icon } from "@/components/ui/Icon";

const bandFill: Record<RiskBand, string> = {
  green: "rgba(31,110,69,0.10)",
  yellow: "rgba(160,104,22,0.14)",
  red: "rgba(168,56,42,0.16)",
};
const bandStroke: Record<RiskBand, string> = {
  green: "rgba(31,110,69,0.35)",
  yellow: "rgba(160,104,22,0.45)",
  red: "rgba(168,56,42,0.5)",
};
const bandDot: Record<RiskBand, string> = {
  green: "var(--color-status-green)",
  yellow: "var(--color-status-amber)",
  red: "var(--color-status-red)",
};

function polygonPoints(points: { x: number; y: number }[]) {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

export function OperationalMap({
  zones,
  facilities = [],
  volunteers = [],
  incidents = [],
  selectedZoneId,
  onZoneClick,
  onIncidentClick,
  showFacilities = true,
  showVolunteers = true,
  className = "",
}: {
  zones: Zone[];
  facilities?: Facility[];
  volunteers?: Volunteer[];
  incidents?: Incident[];
  selectedZoneId?: string;
  onZoneClick?: (zoneId: string) => void;
  onIncidentClick?: (incidentId: string) => void;
  showFacilities?: boolean;
  showVolunteers?: boolean;
  className?: string;
}) {
  const openIncidents = incidents.filter((i) => !["resolved", "cancelled"].includes(i.status));

  return (
    <svg
      viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
      className={`w-full h-full ${className}`}
      role="img"
      aria-label="Operational map — simulated zone layout"
    >
      <defs>
        <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="var(--color-border)" opacity="0.5" />
        </pattern>
      </defs>

      <rect x={0} y={0} width={MAP_VIEWBOX.width} height={MAP_VIEWBOX.height} fill="var(--color-ivory-deep)" />
      <rect x={0} y={0} width={MAP_VIEWBOX.width} height={MAP_VIEWBOX.height} fill="url(#grid)" />

      {/* River */}
      <path
        d="M 0 300 C 150 260, 260 340, 340 320 C 420 300, 560 260, 660 300 C 780 340, 880 300, 1000 320"
        fill="none"
        stroke="var(--color-map-river)"
        strokeOpacity={0.35}
        strokeWidth={54}
        strokeLinecap="round"
      />
      <path
        d="M 0 300 C 150 260, 260 340, 340 320 C 420 300, 560 260, 660 300 C 780 340, 880 300, 1000 320"
        fill="none"
        stroke="var(--color-map-river)"
        strokeOpacity={0.55}
        strokeWidth={2}
      />

      {/* Zones */}
      {zones.map((zone) => {
        const selected = zone.id === selectedZoneId;
        return (
          <g key={zone.id}>
            <polygon
              points={polygonPoints(zone.polygon)}
              fill={bandFill[zone.riskBand]}
              stroke={selected ? "var(--color-primary)" : bandStroke[zone.riskBand]}
              strokeWidth={selected ? 2.5 : 1.25}
              className={onZoneClick ? "cursor-pointer transition-[stroke,fill] duration-200" : undefined}
              onClick={() => onZoneClick?.(zone.id)}
            />
            <g transform={`translate(${zone.labelPoint.x}, ${zone.labelPoint.y})`} pointerEvents="none">
              <rect x={-46} y={-24} width={92} height={40} rx={2} fill="var(--color-surface)" stroke="var(--color-border)" opacity={0.94} />
              <text x={0} y={-8} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--color-ink)">
                {zone.shortName}
              </text>
              <circle cx={-32} cy={7} r={3} fill={bandDot[zone.riskBand]} />
              <text x={-24} y={10} fontSize={9.5} fill="var(--color-ink-muted)">
                risk {zone.riskScore}
              </text>
            </g>
          </g>
        );
      })}

      {/* Facilities */}
      {showFacilities &&
        facilities.map((f) => (
          <g key={f.id} transform={`translate(${f.position.x}, ${f.position.y})`}>
            <circle r={9} fill="var(--color-surface)" stroke="var(--color-border-strong)" strokeWidth={1} />
            <FacilityGlyph type={f.type} />
          </g>
        ))}

      {/* Volunteers */}
      {showVolunteers &&
        volunteers.map((v) => (
          <g key={v.id} transform={`translate(${v.position.x}, ${v.position.y})`} style={{ transition: "transform 1.1s linear" }}>
            <circle
              r={5.5}
              fill={
                v.availability === "available"
                  ? "var(--color-status-green)"
                  : v.availability === "on_task"
                  ? "var(--color-primary)"
                  : "var(--color-ink-soft)"
              }
              stroke="var(--color-surface)"
              strokeWidth={1.5}
            />
          </g>
        ))}

      {/* Incidents */}
      {openIncidents.map((inc) => (
        <g
          key={inc.id}
          transform={`translate(${inc.position.x}, ${inc.position.y})`}
          className={onIncidentClick ? "cursor-pointer" : undefined}
          onClick={() => onIncidentClick?.(inc.id)}
        >
          <circle r={13} fill={bandDot[inc.severity === "critical" ? "red" : inc.severity === "moderate" ? "yellow" : "green"]} opacity={0.28} className="map-pulse" />
          <circle r={6} fill={inc.severity === "critical" ? "var(--color-status-red)" : inc.severity === "moderate" ? "var(--color-status-amber)" : "var(--color-status-green)"} stroke="var(--color-surface)" strokeWidth={1.5} />
        </g>
      ))}
    </svg>
  );
}

function FacilityGlyph({ type }: { type: Facility["type"] }) {
  const name = facilityIconName(type);
  return (
    <Icon
      name={name}
      className="text-ink-muted"
      strokeWidth={2}
      x={-5.5}
      y={-5.5}
      width={11}
      height={11}
    />
  );
}
