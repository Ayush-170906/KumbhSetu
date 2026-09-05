"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from "react-leaflet";
import type { Zone, Facility, Volunteer, Incident, RiskBand } from "@/lib/types";
import { ZONE_GEO, NASHIK_CENTROID, TRIMBAKESHWAR_CENTROID, REAL_INFRASTRUCTURE } from "@/lib/seed";
import { jitterFromId } from "@/lib/format";
import { bandLabel } from "@/components/ui/StatusPill";

const bandColor: Record<RiskBand, string> = {
  green: "#1f6e45",
  yellow: "#a06816",
  red: "#a8382a",
};

export function RealMapView({
  zones,
  facilities = [],
  volunteers = [],
  incidents = [],
}: {
  zones: Zone[];
  facilities?: Facility[];
  volunteers?: Volunteer[];
  incidents?: Incident[];
}) {
  const openIncidents = incidents.filter((i) => !["resolved", "cancelled"].includes(i.status));

  return (
    <MapContainer
      center={[19.97, 73.66]}
      zoom={10}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", background: "var(--color-ivory-deep)" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · facility reference via <a href="https://github.com/tanmayk1234/nashik-monitor-v2" target="_blank" rel="noreferrer">Nashik Monitor</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {REAL_INFRASTRUCTURE.map((f) => (
        <CircleMarker
          key={f.name}
          center={f.position}
          radius={5}
          pathOptions={{
            color: f.type === "hospital" ? "#a8382a" : "#43301f",
            fillColor: "#fffdf8",
            fillOpacity: 1,
            weight: 2,
            dashArray: "2 2",
          }}
        >
          <Popup>
            <div style={{ fontFamily: "var(--font-ui)", fontSize: 12 }}>
              <strong>{f.name}</strong>
              <br />
              Real {f.type === "hospital" ? "registered hospital" : "police post"} — reference only, not part of the simulation
            </div>
          </Popup>
        </CircleMarker>
      ))}

      <Polyline
        positions={[NASHIK_CENTROID, TRIMBAKESHWAR_CENTROID]}
        pathOptions={{ color: "#7a6636", weight: 2, dashArray: "6 8", opacity: 0.7 }}
      />

      {zones.map((zone) => {
        const geo = ZONE_GEO[zone.id];
        if (!geo) return null;
        return (
          <CircleMarker
            key={zone.id}
            center={geo}
            radius={16}
            pathOptions={{
              color: bandColor[zone.riskBand],
              fillColor: bandColor[zone.riskBand],
              fillOpacity: 0.25,
              weight: 2,
            }}
          >
            <Popup>
              <div style={{ fontFamily: "var(--font-ui)", fontSize: 12 }}>
                <strong>{zone.name}</strong>
                <br />
                Risk {zone.riskScore}/100 · {bandLabel(zone.riskBand)}
                <br />
                Density: {zone.density}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}

      {facilities.map((f) => {
        const base = ZONE_GEO[f.zoneId];
        if (!base) return null;
        const [dx, dy] = jitterFromId(f.id, 0.003);
        return (
          <CircleMarker
            key={f.id}
            center={[base[0] + dx, base[1] + dy]}
            radius={4}
            pathOptions={{ color: "#6d5f4d", fillColor: "#fffdf8", fillOpacity: 1, weight: 1.5 }}
          >
            <Popup>
              <div style={{ fontFamily: "var(--font-ui)", fontSize: 12 }}>{f.name}</div>
            </Popup>
          </CircleMarker>
        );
      })}

      {volunteers.map((v) => {
        const base = ZONE_GEO[v.zoneId];
        if (!base) return null;
        const [dx, dy] = jitterFromId(v.id, 0.0035);
        const color = v.availability === "available" ? "#1f6e45" : v.availability === "on_task" ? "#bf5326" : "#9c8d76";
        return (
          <CircleMarker
            key={v.id}
            center={[base[0] + dx, base[1] + dy]}
            radius={5}
            pathOptions={{ color: "#fffdf8", fillColor: color, fillOpacity: 1, weight: 1.5 }}
          >
            <Popup>
              <div style={{ fontFamily: "var(--font-ui)", fontSize: 12 }}>{v.name} · {v.id}</div>
            </Popup>
          </CircleMarker>
        );
      })}

      {openIncidents.map((inc) => {
        const base = ZONE_GEO[inc.zoneId];
        if (!base) return null;
        return (
          <CircleMarker
            key={inc.id}
            center={base}
            radius={9}
            pathOptions={{
              color: "#fffdf8",
              fillColor: inc.severity === "critical" ? "#a8382a" : inc.severity === "moderate" ? "#a06816" : "#1f6e45",
              fillOpacity: 0.95,
              weight: 2,
            }}
          >
            <Popup>
              <div style={{ fontFamily: "var(--font-ui)", fontSize: 12 }}>
                <strong>{inc.code}</strong>
                <br />
                {inc.summary}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
