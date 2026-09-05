# Kumbh Setu — Prototype Notes

Status: **P1 — Demo MVP** (see roadmap on the landing page). This document is the technical
companion to the PRD — what was actually built, how, and what's left before any pilot claim.

## 1. What was built

- A full design system (color tokens, type scale, restrained civic-tech visual language) distinct
  from generic SaaS/AI-dashboard aesthetics.
- A **centralized data model and mock backend** (`src/lib/types.ts`, `src/lib/seed.ts`,
  `src/lib/api.ts`) — no screen hardcodes its own fake data.
- A single **Zustand store** (`src/store/useAppStore.ts`) implementing the real incident lifecycle:
  report → triage → dispatch → accept/decline → arrive → resolve/escalate, with a rule-based
  Kumbh Pulse risk recalculation on every incident change.
- **Cross-tab live sync** (`src/store/sync.ts`, `BroadcastChannel`) — Pilgrim, Volunteer and
  Management genuinely share state when opened in separate browser tabs, not just within one page.
- Three role experiences (Pilgrim, Volunteer, Management) plus a landing page and a scripted,
  synchronized `/demo` view.
- An abstract SVG geospatial map (zones, river, facilities, volunteers, incidents) — no external
  map API key required.
- A second, **real GIS map** (Leaflet + OpenStreetMap, no API key) showing the actual
  Nashik–Trimbakeshwar corridor, with a real-infrastructure reference layer (hospitals, police
  posts) sourced from Nashik Monitor / NTKMA open data — toggle it from Management → Live
  Operations → "Real Map (GIS)".
- Photo-based incident reporting ("snap and report") from both Pilgrim (facility issues) and
  Volunteer (field evidence on an active task), visible to Management on the incident record.
- A volunteer-to-volunteer zone chat and a rule-based "Sevak Assistant" for volunteers, and an
  upgraded Pilgrim assistant that can act on your behalf (e.g. jump straight into the SOS flow),
  not just answer questions.

## 1a. This round's additions (judge-feedback pass)

Added directly in response to live judge feedback during the SPRINT, cross-checked against the
Drive's Guidelines, 4-Towers framework, and Personas document:

| Ask | What shipped | Where |
|---|---|---|
| "GIS mapping" | Real Leaflet/OSM map of the actual Nashik–Trimbakeshwar corridor, plus a real hospital/police reference layer from Nashik Monitor (NTKMA open data) | `RealMapView.tsx`, `ZONE_GEO`/`REAL_INFRASTRUCTURE` in `seed.ts` |
| "Image to comment/complaint" | Pilgrim can snap a photo + note to report a facility issue; Volunteers can attach photo evidence to an active task — both land on the incident record Management sees | `ReportIssueScreen.tsx`, `TaskDetail.tsx`, `attachPhoto` in the store |
| "Chat between volunteers" | A live per-zone volunteer coordination channel, synced the same way incidents are | `ZoneChat.tsx`, `sendZoneMessage` in the store |
| "Agentic AI" | Two rule-based assistants that **act**, not just answer: the Pilgrim agent can jump straight into the SOS flow or the facility list; the volunteer "Sevak Assistant" answers task/protocol questions grounded in this session's real data. Neither calls an external LLM — there's no API key wired into this environment, and the guidelines explicitly require explaining every line shipped, so this is honestly rule-based intent routing, not a hosted model | `AssistantScreen.tsx`, `SevakAssistant.tsx` |
| Bhashini / multilingual | The EN/हिंदी/मराठी toggle is explicitly labeled "Bhashini-ready" — built to the same interface shape (translate on the client, keyed strings) that a Bhashini API integration would slot into later | `HomeScreen.tsx`, `src/lib/i18n.ts` |
| "3 dashboards" | Confirmed and framed explicitly on the landing page — Pilgrim, Volunteer and Management are three separately routable, fully distinct experiences sharing one live backbone, not three views of the same screen | `RoleCards.tsx`, `/pilgrim` `/volunteer` `/management` |

Real data note: `REAL_INFRASTRUCTURE` in `seed.ts` holds five real, publicly registered
hospitals/police posts pulled from Nashik Monitor's open GeoJSON
(github.com/tanmayk1234/nashik-monitor-v2, itself sourced from the NTKMA mobility plan and
government registries). They render on the Real Map as reference points only — they are
deliberately NOT wired into the simulated dispatch/incident system, so simulated data is never
presented as if it were live operational data from a real facility.

## 2. Architecture

```
src/
  app/                    Next.js App Router routes (/, /pilgrim, /volunteer, /management, /demo)
  components/
    ui/                   Design-system primitives (Button, StatusPill, Panel, Drawer, Icon, ...)
    maps/                 OperationalMap, MapLegend, ZoneIntelligence
    incidents/            IncidentCard, IncidentDetail, IncidentTimeline, StageStepper
    pulse/                RiskGauge, PulsePanel (Kumbh Pulse explainability UI)
    pilgrim/ volunteer/   Screens for each role app
    management/           Control room shell, analytics, event log
    demo/                 3-pane synchronized demo engine UI
    landing/              Marketing/landing sections
  lib/
    types.ts              Core domain model (User, Zone, Incident, Task, RiskSnapshot, ...)
    seed.ts                Synthetic seed data (zones, facilities, volunteers, risk baselines)
    dispatch.ts            Pure business logic: nearest-volunteer matching, risk scoring, ETA
    api.ts                 Mock API surface (getZones, createIncident, subscribeToRealtimeEvents, ...)
    incidentMeta.ts, format.ts   Shared display helpers
  store/
    useAppStore.ts         Single source of truth + all state transitions
    sync.ts                Cross-tab BroadcastChannel sync
```

The **only** stateful data layer is the Zustand store. `api.ts` is a thin async-wrapped façade
over it — swapping it for real HTTP/WebSocket calls later would not require touching any screen.

## 3. Data model

`User`, `Zone`, `Facility`, `Incident`, `Task`, `Volunteer`, `RiskSnapshot`, `Resource`,
`Notification`, `AuditEvent` — see `src/lib/types.ts` for full field definitions. Every material
state transition is appended to `auditLog` with a timestamp (System Event Log in Management).

## 4. Demo scenario

`/demo` runs a fixed scripted scenario — "Medical Assistance, Ghat 4" — driving the real store
actions (not a fake animation) with paced delays so a live audience can watch each stage land
across all three panes: SOS raised → triaged → nearest volunteer dispatched → accepted → arrived →
resolved. "Replay Scenario" resets all state and reruns it identically.

For a live walkthrough across separate tabs/devices instead, open `/pilgrim`, `/volunteer` and
`/management` side by side — raising an SOS in Pilgrim will appear in Management within
milliseconds and notify the matching Volunteer, via the cross-tab sync layer.

## 5. What is simulated

- All zones, facilities, volunteers, incidents and risk numbers are **synthetic seed data** —
  not real Nashik–Trimbakeshwar operational data. Labeled `SIMULATION MODE` / `DEMO` throughout.
- The map is an abstract SVG layout inspired by general Kumbh geography (ghats, a river, a temple
  perimeter), not a real GPS map.
- Kumbh Pulse is **Stage 0** per the PRD's model progression: transparent rule-based scoring over
  synthetic signals — not a calibrated or validated crowd-safety model.
- "Ask Kumbh Setu" answers from a small canned/derived rule set over the demo dataset, not a live
  LLM or authoritative event data source.
- Analytics baseline numbers (peak-activity histogram, category baseline counts) are illustrative
  session flavor, blended with real session incidents — clearly labeled.

## 6. What is genuinely implemented and functional

- The full incident lifecycle state machine, including automatic nearest-available-volunteer
  dispatch, decline/reassignment, and risk recalculation tied to real open-incident counts.
- Real cross-tab/cross-window synchronization of all state.
- A working offline/degraded-connectivity simulation on the Pilgrim SOS flow (adds fallback delay
  and messaging; the connectivity toggle is real client state, not decorative).
- A real audit trail (System Event Log) built from actual action dispatches, not mocked rows.
- Kumbh Pulse's explainability bars are computed from live zone density + open incident load, not
  static images — they change when incidents change.

## 6a. Tower 4 ("Pilgrim Experience") alignment

Kumbhathon SPRINT's official 4-Towers framework scores this build against Tower 4's five
redefined problem statements. Four features were added specifically against that rubric:

| Tower 4 problem statement | What was built | Where |
|---|---|---|
| "Volunteers that follow the crowd" — profile real skill/language, dynamically route | Dispatch now scores candidates on required skill (derived from incident type) and the pilgrim's preferred language before distance; the match reason ("matched on skill + language") is shown to the pilgrim, the volunteer, and in the incident record | `src/lib/dispatch.ts` (`findNearestAvailableVolunteer`, `requiredSkillFor`), `Volunteer.languages` |
| "Reuniting families fast" — structured lost-person/item matching workflow | Found-person reports now create a real record and are auto-scored (keyword overlap) against every open missing-person case; Management sees ranked matches and confirms with one click, which resolves the case | `src/lib/dispatch.ts` (`textMatchScore`), `LostFoundView.tsx`, `reportFoundPerson`/`confirmLostFoundMatch` in the store |
| "Guidance pilgrims can trust, without creating new crowds" — police-approved advisories | Management can publish a zone-scoped or event-wide advisory (Notice / Advisory / Police Warning) that appears live on every open Pilgrim tab within milliseconds, via the same cross-tab sync used for incidents | `AdvisoriesView.tsx`, `publishAdvisory`/`retractAdvisory` in the store |
| Accessibility / multilingual guidance | A working EN / हिंदी / मराठी switcher on the Pilgrim home and SOS screens, plus a per-SOS "preferred responder language" the dispatch logic actually honors | `src/lib/i18n.ts`, `LanguageSwitcher.tsx` |

Honestly scoped: multilingual coverage is the Home and SOS screens only (the highest-traffic
pilgrim paths), not the full app — see `src/lib/i18n.ts` for the exact string set. Lost & Found
matching is transparent keyword overlap, not NLP/ML, by design — a human always confirms.

## 7. What remains for a real pilot

- Replace the mock API layer with a real backend (Postgres/PostGIS + WebSocket or SSE), keeping
  the same `src/lib/api.ts` function signatures.
- Replace BroadcastChannel (same-browser only) with a real realtime channel for cross-device sync.
- Authentication/role-based access control; today role is chosen by navigating to a route.
- Real geospatial data (actual zone boundaries, facility GPS coordinates) behind the same
  `OperationalMap` component, which already accepts arbitrary polygon/point data.
- Kumbh Pulse Stage 1+: validated historical data, calibrated forecasting, human-reviewed
  thresholds — per the PRD's staged model progression and pilot-gate requirements.
- Privacy/security review for the Lost & Found and location-sharing workflows before any real data
  is used, per the PRD's data governance section.

## 8. Recommended next steps

1. Stakeholder walkthrough of `/demo` and the three role apps against the PRD's golden path.
2. Validate the abstract zone layout against actual Kumbh ghat/zone geography with a domain expert.
3. Decide the real-time transport for a multi-device pilot (WebSocket service vs. managed realtime
   provider) and swap it in behind `subscribeToRealtimeEvents()`.
4. Define the actual pilot success metrics (Section 16/17 of the PRD) before any field test.
