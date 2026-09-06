# Kumbh Setu

**AI-powered field-to-control-room coordination for mass gatherings.**

Kumbh Setu connects pilgrims, field workers and control-room operators through one
operational loop:

> **observe → corroborate → decide → respond → resolve → audit**

The core of the product is a field-worker AI companion (**Setu**) that turns spoken,
multilingual field observations into structured ground truth, and a control-room
signal layer (**Kumbh Pulse**) that aggregates those observations into an explainable
picture an operator can act on.

Built for Kumbhathon S.P.R.I.N.T. 2026 for the Nashik–Trimbakeshwar Simhastha Kumbh
Mela 2027. **This is a prototype.** All operational data is synthetic; see
`PROTOTYPE.md` for a line-by-line breakdown of simulated vs. functional.

---

## What each piece is

| Piece | What it does | Status |
|---|---|---|
| **Setu AI field companion** | Voice-first, multilingual companion for volunteers and operators. Understands an observation, asks the minimum follow-ups, drafts a structured field report, retrieves SOPs, proposes an authorized action. | Functional. Real reasoning via Sarvam when configured, local rule engine otherwise. |
| **Ground-truth ladder** | `unverified → reported → corroborated → verified → resolved`. Multiple reports never auto-equal truth — corroboration is a *candidate* a human verifies. | Functional |
| **Corroboration** | Groups reports by space / time / category / **independent source**; duplicates from one source don't inflate confidence. | Functional (rule-based) |
| **Kumbh Pulse** | Aggregates field reports, pilgrim requests, incidents and report velocity into a per-zone signal with contributors, confidence, trend and a recommended action. | Explainable prototype signal model over synthetic data — **not** a calibrated predictive model. |
| **Smart responder matching** | Ranks responders by location + availability + skill + language + workload, with a plain-English reason. | Functional (deterministic) |
| **Incident lifecycle + audit trail** | `report → triage → corroborate → verify → dispatch → acknowledge → in_progress → resolve → close`, every transition recorded with actor and role. | Functional (operational audit trail; not a cryptographic ledger) |
| **Offline / degraded mode** | SOS, field reports and cached SOPs work with no network; reports queue and sync on reconnect. SOS never depends on AI. | Functional |
| **Pilgrim experience** | Facilities, SOS, lost & found, Plan my Kumbh, Family Group, colour-coded Entry Pass, Common Board. | Functional prototype (Entry Pass is a simulation, not an authority-issued pass) |

---

## Run it

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The whole app runs on **local/simulated providers with
no keys** — no configuration needed.

Open `/pilgrim`, `/field` and `/management` in **separate browser tabs**: they stay
live-synchronized via `BroadcastChannel` (a prototype transport — same-browser only,
not production cross-device realtime), so an SOS raised in Pilgrim appears instantly
in Management. Or open `/demo` for a single-page guided walkthrough.

### Routes

| Route | Experience |
|---|---|
| `/` | Landing / product overview |
| `/field` | **Setu — AI field companion** (voice-first) |
| `/pilgrim` | Mobile-first pilgrim app |
| `/volunteer` | Field task queue + "Ask Setu" |
| `/management` | Control room — map, Kumbh Pulse, incidents, field reports, security concept view, city directory, analytics, event log |
| `/board` | Common Operations Board — one shared read-only picture (news, notices, instructions, live incidents, zone status, helplines, feedback) |
| `/enroll` | Volunteer self sign-up |
| `/demo` | Scripted 3-pane SOS → resolution walkthrough |

---

## Real AI (Sarvam) — optional

Setu's reasoning, translation, speech-to-text and TTS route through **Sarvam AI** when
configured, and fall back automatically on any failure:

```
Sarvam  →  browser capability / phrasebook  →  local mock
```

### Enable it

Copy `.env.example` to `.env` and set:

```bash
NEXT_PUBLIC_SETU_LIVE=1          # public flag — flips the provider wiring
SARVAM_API_KEY=sk_...            # server only — never sent to the browser
AI_PROVIDER=sarvam
TRANSLATION_PROVIDER=sarvam
SPEECH_PROVIDER=sarvam
TTS_PROVIDER=sarvam
```

Model IDs (`SARVAM_CHAT_MODEL`, `SARVAM_TRANSLATE_MODEL`, `SARVAM_STT_MODEL`,
`SARVAM_TTS_MODEL`) are configurable in `.env`.

### How it's wired

- The key lives **only** on the server, inside `src/app/api/setu/*` route handlers
  (`chat`, `translate`, `stt`, `tts`, `status`). It is never in the client bundle,
  never logged, never in a `NEXT_PUBLIC_` var.
- `src/ai/providers/sarvamProvider.ts` holds the client adapters. Each implements the
  same interface as its `Mock*` sibling (`src/ai/providers/types.ts`) and delegates to
  that sibling on any error.
- `src/ai/providers/index.ts` picks Sarvam adapters vs. mocks from
  `NEXT_PUBLIC_SETU_LIVE`. `probeSetuStatus()` asks `/api/setu/status` which
  capabilities are actually live; the companion header shows **LIVE PROVIDERS** or
  **SIMULATION MODE** accordingly.
- Deterministic UI actions (open incidents, filter reports, change tabs, trigger SOS)
  never call the model. Sarvam is used only for natural-language understanding,
  translation, structured extraction and operational reasoning ("brief me",
  "why is this zone at risk?", shift handover).

**Without any of this set, the app is fully functional in simulation mode.**

---

## Architecture

```
Pilgrim / Field / Control-room UI
        │
        ▼
  src/ai/useSetu.ts  (React binding)
        │
        ▼
  src/ai/orchestrator.ts
   input → memory → intent → context retrieval → KB/SOP →
   live state → model plan → schema validation → persona authz →
   offline policy → risk policy → confirmation → tool execution →
   result → final response → audit
        │
        ├── providers  (src/ai/providers/*)  LLM · speech · translation · vision
        ├── tools      (src/ai/tools/*)      typed registry, per-tool role + risk class
        └── store      (src/store/*)         Zustand + localStorage + BroadcastChannel sync
```

- **The LLM never mutates state.** It *proposes* a tool call; the policy layer decides
  if it's allowed; the app executes it.
- **Risk classes:** `READ_ONLY`, `LOW_RISK_WRITE`, `OPERATIONAL_WRITE`,
  `HIGH_RISK_ACTION`, `EMERGENCY_ACTION`. High-risk actions require human confirmation.
- **Tenancy:** operational entities carry an event / zone scope today (single-tenant
  demo). A `PLATFORM → ORGANIZATION → EVENT → ZONE → USERS` hierarchy is the SaaS
  direction — see roadmap.

---

## Demo

The primary scenario is a **Tamil-speaking pilgrim with a missing child**:

1. Pilgrim speaks Tamil → STT + language detection → translation.
2. Setu identifies `lost_person`, asks the required questions.
3. Volunteer answers → Setu extracts a structured field report with zone + location.
4. Report reaches the control room; a seeded independent report corroborates it.
5. Kumbh Pulse signal for the zone rises, with contributors shown.
6. Operator clicks **Verify** → incident created.
7. Setu ranks responders; operator approves dispatch.
8. Volunteer accepts, resolves; control room sees resolution.
9. The event log shows the whole lifecycle with actor + role.

Use **Reset Demo** / **Run Demo Scenario** on `/demo` to restore deterministic state
before a presentation.

---

## Scripts

```bash
npm run dev          # dev server
npm run build        # production build
npm run lint         # eslint
npm run eval:setu    # Setu behaviour eval suite (tsx)
```

---

## Prototype limitations (be honest with judges)

- Kumbh Pulse is **rule-based over synthetic data**, not a trained/calibrated model.
- Cross-tab sync is `BroadcastChannel` — **same browser only**, not server realtime.
- The security / CCTV screen is a **concept view** with mock feeds — no camera network.
- The Entry Pass is a **prototype QR**, not an authority-issued pass.
- The audit trail is an **operational log**, not a cryptographically chained ledger.
- GIS layers use **public reference data** (Nashik Monitor / OpenStreetMap) plus
  synthetic operational overlays.

## Production roadmap

| Stage | Data | Infra |
|---|---|---|
| **Prototype** (now) | synthetic + public GIS | local, mock provider fallback |
| **Pilot** (one zone) | authorized operational data | secure backend, real users, security review, calibrated signals |
| **Production** | multi-event | Postgres + PostGIS, server realtime (WS/SSE), RBAC, observability, model eval, privacy controls, DR/SLA, official integrations |
