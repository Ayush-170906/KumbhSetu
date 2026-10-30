# Data validation and limitations

**Scope:** repository data visible locally. The three supplied Drive folders were not listable because the Drive connector is disabled by the administrator; no claims are made about their datasets or completeness.

## Nashik Monitor-derived place directory

| Check | Observed result |
|---|---:|
| Normalized records (`src/data/nashikDirectory.json`) | 2,943 |
| Dataset labels recorded in the file | 26 |
| Missing place names | 0 |
| Missing addresses | 526 |
| Missing phone fields | 2,121 |
| Missing confidence fields | 2,491 |
| Coordinates outside valid latitude/longitude numeric ranges or missing | 0 |
| Duplicate IDs | 0 |
| Repeated coordinates at 6 decimal places | 202 coordinate groups with duplicates |
| Coordinate bounds in the file | latitude 19.703220–20.160097; longitude 73.413016–73.936827 |
| `generatedAt` metadata | 2026-09-06 |

These are structural checks against the normalized JSON, not field verification. The bounds are plausible for a Nashik-area collection but do not prove that each feature is correctly located, in the correct municipality, or appropriate for the 2027 operation. Repeated coordinates may represent real co-located facilities or geocoding/normalization duplication; they have not been resolved. Missing phone/address/confidence fields should remain missing rather than be inferred.

The provenance note identifies Nashik Monitor v2 as open data compiled for the Kumbhathon initiative from NTKMA mobility planning and government registries. **36 raw GeoJSON files are present locally under `data/nashik-monitor/` but are gitignored.** All 36 parsed structurally (12,128 total features). This does not validate feature accuracy, freshness, geometry, or terms. The upstream README describes generated/approximate points in some layers, including CCTV, and congestion records are not measured density. The code license does not establish a license for the data; no per-dataset license was confirmed. See the upstream project's [README](https://github.com/tanmayk1234/nashik-monitor-v2) and obtain publisher/authority confirmation before integrating or redistributing layers.

The raw files span ambulance, blood-bank, hostel, bus, commercial service/food, congestion, diagnostic lab, emergency/movement/VIP/waste routes, fire, ghat, market, lodging, hospital, hotel, mall, temple, parking, petrol, police, toilet, rail station, staging, waste zones/checkpoints, and CCTV records. Their suitability varies. Mobility-plan and transit layers may be **integrated after validation** as read-only reference; facility layers are **reference only** pending source-age and availability checks; unverified/generated CCTV or congestion inputs are **rejected** as operational evidence. Waste tracking derivatives should not be exposed as live worker/resource locations.

### Raw GeoJSON inventory (local, gitignored)

Counts below are features parsed from the local FeatureCollections. Geometry counts do not validate positional accuracy or currentness. Recommendation is for product use, not a license grant.

| File stem | Features | Geometry types | Recommendation |
|---|---:|---|---|
| ambulances | 79 | Point | REFERENCE ONLY; verify fleet, location and availability with operator |
| blood-banks | 19 | Point | REFERENCE ONLY; verify issuer and service details |
| boys-hostels | 87 | Point | REJECT for operational response; lodging POI source needs review |
| bus-depots | 2 | Point | INTEGRATE AFTER VALIDATION; transit reference only |
| bus-stops | 1,854 | Point | INTEGRATE AFTER VALIDATION; RTI/operator source dated 2026-08-17 per upstream notes |
| car-service-centers | 97 | Point | REJECT for emergency-response use |
| cctv-cameras | 4,079 | Point | REJECT; upstream notes say indicative/generated locations, not a connected or surveyed camera inventory |
| cloud-kitchens | 21 | Point | REJECT for emergency-response use |
| congestion-points | 16 | 8 Point, 8 Polygon | REJECT as crowd-density evidence; not a validated measurement feed |
| diagnostic-labs | 10 | Point | REFERENCE ONLY; verify service and current operation |
| emergency-routes | 67 | 38 LineString, 29 Point | INTEGRATE AFTER VALIDATION; source/approval/date and network topology require review |
| fire-stations | 10 | Point | REFERENCE ONLY; verify jurisdiction and contact details |
| ghats | 40 | 20 Point, 20 Polygon | INTEGRATE AFTER VALIDATION; review geometry/site corrections and authority approval |
| girls-hostels | 23 | Point | REJECT for emergency-response use |
| grocery-shops | 745 | Point | REJECT for emergency-response use |
| guest-houses | 214 | Point | REJECT for emergency-response use |
| holding-areas | 60 | 30 Point, 30 Polygon | INTEGRATE AFTER VALIDATION; mobility-plan reference only |
| hospitals | 495 | Point | REFERENCE ONLY; reconcile with current authority and verify access/capacity before use |
| hotels | 46 | Point | REJECT for emergency-response use |
| malls | 11 | Point | REJECT for emergency-response use |
| mandirs | 1,089 | Point | REFERENCE ONLY; verify place identity and event relevance |
| movement-routes | 40 | LineString | INTEGRATE AFTER VALIDATION; route source and current approved use unknown |
| parking-zones | 52 | Polygon | INTEGRATE AFTER VALIDATION; validate boundaries, access and current operating plan |
| petrol-pumps | 87 | Point | REFERENCE ONLY; confirm current operation |
| police-stations | 71 | Point | REFERENCE ONLY; reconcile jurisdiction and official station directory |
| public-toilets | 274 | Point | REFERENCE ONLY; verify location, accessibility and operation |
| railway-station | 86 | 30 LineString, 14 Point, 42 Polygon | INTEGRATE AFTER VALIDATION; mixed geometries and source semantics need review |
| ring-road | 8 | LineString | REFERENCE ONLY pending geometry review; upstream notes describe closed loops |
| staging-areas | 13 | Point | INTEGRATE AFTER VALIDATION; confirm approved boundaries and current plan |
| two-wheeler-service | 95 | Point | REJECT for emergency-response use |
| vegetable-markets | 94 | Point | REJECT for emergency-response use |
| vip-routes | 19 | 16 LineString, 3 Point | REJECT from public interfaces; restricted-sensitivity and authority approval must be established |
| waste-checkpoints | 1,563 | Point | REJECT from public/live operations; derived from vehicle tracking and may reveal worker activity |
| waste-routes | 254 | LineString | REJECT from public/live operations; one-day vehicle-tracking derivative |
| waste-zones | 398 | Polygon | REFERENCE ONLY for planning research; not live sanitation status |
| watch-stores | 10 | Point | REJECT for emergency-response use; source/context unclear |

Across the raw catalog, source notes attribute subsets to an NTKMA mobility-plan KMZ, an NMPML RTI reply, an NMC waste-vehicle tracking export, and commercial/OSM directories. These subsets do not each carry a confirmed individual data license or complete field-level source metadata. No raw layer was added to the running product in this pass.

### Appropriate current interpretation

- The directory is **reference data**, not a verified live service directory. Presence of a hospital/ambulance point does not establish that it is open, staffed, reachable, or has capacity.
- It may support map context, reference search, and prototype demonstrations with this disclosure.
- Do not use unverified contact numbers, bed counts, facility availability, or nearest-place results as emergency dispatch truth.
- Keep demo incidents, volunteers, crowd values and responses labelled **synthetic/simulated**. A map can combine reference geography with simulated overlays; the UI must say so.
- Setu's AI-generated response is not a verified source. The existing product has human confirmation for high-impact writes and identifies the simulation mode; retain those controls.

## Validation needed before operational integration

1. Obtain the source dataset catalog, licenses, collection dates, coordinate reference system, field definitions and raw files from the upstream publisher.
2. Reconcile facilities and key event sites with current Nashik/Trimbakeshwar authority registries; verify coordinate positions against an authoritative map or site review.
3. Deduplicate using source IDs and reviewed place identity, not coordinates alone. Record provenance and confidence per feature.
4. Verify emergency phone numbers with the responsible authority and define a freshness/review cadence. Do not infer missing values.
5. Validate any crowd-density thresholds against an approved, cited methodology and event-specific plans; keep current synthetic risk scores out of operational claims.
6. For Drive data, record original file ID, publisher/owner, last modified/version, license, sensitive fields, validation results and all transformations before import.

## Values not available

No authoritative 2027 event site boundaries, route closures, operating hours, live crowd feeds, verified staffing, facility capacity, control-room contacts, or official Kumbhathon evaluation rubric were available in the inspected repository evidence for this pass. Do not present any such value as verified until an attributable primary source is obtained.
