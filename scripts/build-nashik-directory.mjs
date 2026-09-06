// Normalize the Nashik Monitor GeoJSON datasets into one compact directory JSON
// the Management "City Directory" view loads.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";

const SRC = "C:\\Users\\ASUS\\OneDrive\\Desktop\\KumbhSetu\\data\\nashik-monitor";
const OUT = "C:\\Users\\ASUS\\OneDrive\\Desktop\\KumbhSetu\\src\\data\\nashikDirectory.json";

// file -> { group, label } . Only point-style operational datasets.
const MAP = {
  "hospitals":            { group: "medical",   label: "Hospital" },
  "ambulances":           { group: "medical",   label: "Ambulance point" },
  "blood-banks":          { group: "medical",   label: "Blood bank" },
  "diagnostic-labs":      { group: "medical",   label: "Diagnostic lab" },
  "police-stations":      { group: "safety",    label: "Police station" },
  "fire-stations":        { group: "safety",    label: "Fire station" },
  "congestion-points":    { group: "crowd",     label: "Known congestion point" },
  "holding-areas":        { group: "crowd",     label: "Holding area" },
  "staging-areas":        { group: "crowd",     label: "Staging area" },
  "public-toilets":       { group: "sanitation",label: "Public toilet" },
  "ghats":                { group: "religious", label: "Ghat" },
  "mandirs":              { group: "religious", label: "Mandir" },
  "hotels":               { group: "stay",      label: "Hotel" },
  "guest-houses":         { group: "stay",      label: "Guest house" },
  "boys-hostels":         { group: "stay",      label: "Boys hostel" },
  "girls-hostels":        { group: "stay",      label: "Girls hostel" },
  "cloud-kitchens":       { group: "food",      label: "Cloud kitchen" },
  "vegetable-markets":    { group: "food",      label: "Vegetable market" },
  "petrol-pumps":         { group: "transport", label: "Petrol pump" },
  "bus-depots":           { group: "transport", label: "Bus depot" },
  "railway-station":      { group: "transport", label: "Railway station" },
  "parking-zones":        { group: "transport", label: "Parking zone" },
  "car-service-centers":  { group: "transport", label: "Car service" },
  "two-wheeler-service":  { group: "transport", label: "Two-wheeler service" },
  "malls":                { group: "other",     label: "Mall" },
  "watch-stores":         { group: "other",     label: "Watch store" },
};

// crude centroid for non-point geometries
function centroid(geom) {
  if (!geom) return null;
  if (geom.type === "Point") return geom.coordinates;
  const pts = [];
  const walk = (c) => {
    if (typeof c[0] === "number") pts.push(c);
    else c.forEach(walk);
  };
  walk(geom.coordinates);
  if (!pts.length) return null;
  const lng = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const lat = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return [lng, lat];
}

const pick = (p, keys) => {
  for (const k of keys) {
    const v = p?.[k];
    if (v != null && String(v).trim() && String(v).toLowerCase() !== "null") return String(v).trim();
  }
  return undefined;
};

const rows = [];
let idSeq = 0;
for (const [file, meta] of Object.entries(MAP)) {
  let g;
  try {
    g = JSON.parse(readFileSync(path.join(SRC, `${file}.geojson`), "utf8"));
  } catch {
    console.warn("skip (missing/bad):", file);
    continue;
  }
  const feats = g.features ?? [];
  for (const f of feats) {
    const c = centroid(f.geometry);
    if (!c) continue;
    const [lng, lat] = c;
    // Nashik–Trimbakeshwar sanity box (drop far outliers seen in the raw data)
    if (lat < 19.7 || lat > 20.2 || lng < 73.3 || lng > 73.95) continue;
    const p = f.properties ?? {};
    rows.push({
      id: `nm-${file}-${idSeq++}`,
      group: meta.group,
      kind: pick(p, ["facilityType", "type", "category"]) || meta.label,
      dataset: meta.label,
      name: pick(p, ["name", "title", "Name"]) || meta.label,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      address: pick(p, ["address", "Address", "location"]),
      phone: pick(p, ["phone", "contact", "Phone"]),
      beds: p.registeredBeds != null ? Number(p.registeredBeds) : undefined,
      confidence: pick(p, ["geocodeConfidence"]),
    });
  }
}

// dataset-level counts
const byDataset = {};
for (const r of rows) byDataset[r.dataset] = (byDataset[r.dataset] ?? 0) + 1;

const doc = {
  source: "Nashik Monitor v2 (github.com/tanmayk1234/nashik-monitor-v2) — open data, Kumbhathon initiative",
  generatedAt: new Date().toISOString().slice(0, 10),
  count: rows.length,
  datasets: Object.entries(byDataset).sort((a, b) => b[1] - a[1]).map(([label, n]) => ({ label, n })),
  places: rows,
};
writeFileSync(OUT, JSON.stringify(doc));
console.log(`wrote ${rows.length} places across ${Object.keys(byDataset).length} datasets -> ${OUT}`);
console.log("size KB:", (readFileSync(OUT).length / 1024) | 0);
