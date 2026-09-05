# Setu — AI Field Companion

A voice-first AI companion for volunteers and field personnel, integrated into
the existing Kumbh Setu platform. Setu lets a volunteer **speak naturally**, and
it understands, answers in the right language, retrieves verified information,
calls controlled tools, captures ground truth, and turns field observations into
operational signals for the control room.

> **This is a prototype in SIMULATION MODE.** Every provider is a local, offline
> implementation (see [Providers](#providers)). All zones, facilities,
> volunteers, incidents, risk scores and the knowledge base are synthetic. No
> external AI service or API key is required to run or demo any of it.

---

## 1. Where it lives

| Surface | Route / file | What it is |
|---|---|---|
| **Field Companion (primary)** | `/field` → `src/components/setu/FieldHome.tsx` | The volunteer's Setu-first home: greeting, tap-to-talk orb, live field status, the full conversation surface. |
| **Companion inside the field app** | `/volunteer` → "Ask Setu" tab | The same `SetuCompanion` embedded next to the task queue and team chat. |
| **Field Reports** | `/management` → "Field Reports" | Ground reports Setu captured, with source / verification status / evidence; corroborate or promote to an incident. |
| **Emerging Signals** | `/management` → "Kumbh Pulse" + Operations aside | Aggregated field signals — decision support, not automation. |

The three role dashboards (`/pilgrim`, `/volunteer`, `/management`) stay separate
and distinct. Setu is the volunteer's layer and it feeds the other two through
the same single Zustand store the rest of the app already uses.

---

## 2. Architecture

```
src/ai/
  providers/
    types.ts               AIProvider / SpeechProvider / TranslationProvider / VisionProvider interfaces
    mockLLMProvider.ts      deterministic rule engine → structured SetuTurn
    mockSpeechProvider.ts   Web Speech API wrapper + text-only fallback
    mockTranslationProvider.ts  bidirectional field phrasebook + word-by-word gloss (en/hi/mr/ta)
    mockVisionProvider.ts   photo + hint → structured observation
    index.ts                getProviders() — the ONE swap point for real providers
  intents.ts               SetuIntent taxonomy (§10) + transparent classifier
  schemas.ts               SetuTurn structured-output contract + validateTurn()
  prompts.ts               BASE + per-intent prompt blocks (used by a hosted model)
  knowledge/kb.ts          verified knowledge base + keyword retrieval (RAG stand-in)
  memory.ts                short-lived session context with idle TTL (§9/§32)
  tools/
    registry.ts            typed tool defs: risk class, authorize, validate, run, audit
    index.ts               executeTool() — the only path to a tool's run()
  orchestrator.ts          runTurn() / confirmPending() — retrieve → plan → validate → policy → execute → compose
  useSetu.ts               React binding: visible state machine, transcript, speech, confirm gate, translation mode

src/components/setu/       SetuCompanion, SetuOrb, SetuTranscript, SetuComposer,
                           SetuConfirmCard, SetuReportCard, SetuTranslatePanel,
                           FieldStatus, FieldHome
src/lib/signals.ts         deriveEmergingSignals() — Kumbh Pulse aggregation (§20)
```

### Turn flow

```
speech / text
      │
      ▼
useSetu.handleUserMessage
      │
      ▼
orchestrator.runTurn
  ├─ memory.observe(message)            resolve "she", "there", "the child"
  ├─ classifyIntent(message)            rule-based, inspectable
  ├─ retrieve(message, intent)          KB passages (RAG stand-in)
  ├─ operationalSummary(ctx)            compact live-state string
  ├─ provider.planTurn(request)  ─────► structured SetuTurn (intent, urgency,
  │                                     reply-by-language, tool?, requiresConfirmation)
  ├─ validateTurn()                     bad output → safeFallbackTurn
  ├─ applyMemoryEffects()               translation pair, pending report category
  └─ tool policy
       ├─ read tool            → executeTool now, compose reply + tool summary
       ├─ requiresConfirmation → return PendingConfirmation (nothing runs)
       └─ offline + write      → hold (except ground reports, which queue)
      │
      ▼
useSetu renders transcript / confirm card / report card / translation panel
      │  (on confirm) ▼
orchestrator.confirmPending → executeTool({confirmed:true}) → audit event
```

---

## 3. Providers

`getProviders()` (`src/ai/providers/index.ts`) is the single place a real
provider is swapped in. Every provider is behind an interface in
`providers/types.ts`.

| Interface | Mock implementation | Real drop-in |
|---|---|---|
| `AIProvider` | `MockLLMProvider` — regex/keyword intent rules → templated multilingual replies → tool selection. Deterministic. | An HTTP call to a hosted model that returns JSON matching `SetuTurn`, prompted from `src/ai/prompts.ts`. |
| `SpeechProvider` | `MockSpeechProvider` — uses the browser **Web Speech API** when present; otherwise reports `unavailable` and the UI falls back to text. TTS via `speechSynthesis`. | A cloud STT/TTS service (e.g. Bhashini ASR/TTS) behind the same `listen()` / `speak()` shape. |
| `TranslationProvider` | `MockTranslationProvider` — bidirectional field phrasebook (en/hi/mr/ta) + word-by-word gloss via an English pivot + script-based language detection. Out-of-vocabulary phrases are returned with a visible marker — never faked. | Bhashini / an NMT service behind `detectLanguage()` + `translate()`. |
| `VisionProvider` | `MockVisionProvider` — hint + image stats → structured observation with a confidence. | A vision model behind `describe()`. |

### Adding a real model (optional — not needed to run or demo)

1. `npm i @anthropic-ai/sdk`
2. Add `ANTHROPIC_API_KEY=…` to `.env.local` (never commit it; never inline it).
   For a browser build, proxy the call through a Next.js route handler so the
   key stays server-side.
3. Create `src/ai/providers/anthropicProvider.ts` implementing `AIProvider`:
   compose the system prompt with `buildSystemPrompt(intent)` from
   `src/ai/prompts.ts`, pass the retrieved KB + operational summary, and ask for
   a JSON object; run it through `validateTurn()` before returning.
4. In `src/ai/providers/index.ts`, return the new provider instead of
   `MockLLMProvider`. Nothing else changes — the orchestrator, tools and UI are
   untouched.

The strip at the top of the companion reads **SIMULATION MODE** while every
provider reports `simulated: true`, and **LIVE PROVIDERS** once a real one is in.

---

## 4. Intent taxonomy (§10)

`navigation · medical · lost_person · water · food · toilet · transport ·
accommodation · religious_information · accessibility · safety · crowd ·
complaint · emergency · volunteer_task · resource · translation · ground_report ·
information · zone_intelligence · other`

Classification is keyword/pattern scoring in `src/ai/intents.ts` — every rule is
readable and the matched fragments are returned for transparency. Raw labels are
shown to the volunteer only as a small tag on Setu's replies.

---

## 5. Tool-calling (§12–13)

The model never mutates state. It proposes one tool call; `executeTool()`
authorizes → validates arguments → applies the risk policy → runs → writes an
audit event.

| Risk class | Tools | Policy |
|---|---|---|
| **read** | `find_nearest_facility`, `get_facility_status`, `get_zone_status`, `get_crowd_status`, `get_nearest_volunteers`, `get_available_volunteers`, `get_my_tasks`, `get_incident`, `search_kumbh_knowledge`, `get_resource_status`, `get_emergency_contacts`, `get_operational_procedure`, `translate_text`, `end_translation_session` | Run immediately. |
| **low_write** | `create_ground_report`, `report_resource_issue`, `start_translation_session` | Run immediately, except `create_ground_report` which the companion routes through a **review & submit** card (§17). |
| **high_write** | `create_incident`, `escalate_incident`, `assign_volunteer`, `update_task_status` (resolve/escalate) | **Blocked** until the volunteer approves the confirm card. `executeTool` refuses a high-risk call without `confirmed: true`. |

Every tool has: typed inputs, an `authorize(ctx)` check (role-based — volunteer /
management), argument `validate()`, structured `ToolResult`, and an audit record
(`recordSetuAudit` → the System Event Log Management already shows).

---

## 6. Safety model

- **Medical (§14):** Setu never diagnoses. `MEDICAL_SAFETY_PROMPT` + the
  `kb-medical-*` passages drive it to name red flags, tell the volunteer to
  contact the medical response team, give the nearest **verified** facility, and
  offer to raise a CRITICAL incident (confirmed). It does not invent facilities.
- **Emergency mode (§15):** an emergency intent flips the surface to a
  high-priority layout, keeps questions to the essential one (location), then
  offers a single confirmed action.
- **Ground truth (§19):** every `GroundReport` carries `source`, `aiConfidence`,
  `status` (unverified → reported → corroborated → verified → resolved),
  `corroborations`, evidence and a timestamp. AI inference is labelled as
  inference; only the control room marks something `verified`.
- **Kumbh Pulse (§20):** `deriveEmergingSignals()` combines ≥2 independent
  reports, or a corroborated one, or a single high-severity high-impact one,
  with pilgrim demand and a matching resource flag, into a confidence-scored
  signal with its inputs shown. It is decision support; it never dispatches
  anything on its own.
- **Human-in-the-loop (§33):** no high-risk tool runs without an explicit tap.
- **Audit (§34):** every confirmed Setu action appends an audit event with the
  volunteer as actor and a `…_VIA_SETU` action name.
- **RBAC (§35):** `authorize(ctx)` gates every tool; volunteers act as
  themselves, management can act across the operation.
- **Offline (§28):** when connectivity is degraded, ground reports are saved
  locally with `queuedOffline: true` and `flushOfflineReports()` syncs them when
  it returns; every other write is held with a clear message.

---

## 7. Multilingual (§7)

MVP languages: **English, Hindi, Marathi, Tamil.** The volunteer picks their
language once. Two flows:

- **One-shot:** "translate 'where is the nearest water point' into Tamil",
  "how do I say I need help in Hindi", "… in Marathi for my understanding". Setu
  auto-detects the source language and returns just the translation, with a
  "read aloud" control in the target language.
- **Live session:** "help me talk to a Tamil-speaking pilgrim" opens a dedicated
  translation panel. The language pair is set once; each side then just
  speaks/types and Setu relays. Plain speech in a session is treated as content
  to relay, not a command (an emergency or an explicit "report…" / "create
  incident" / "end translation" still breaks out).

Translation quality is honest: exact/fuzzy phrasebook hits are marked
`phrasebook` with a confidence; a word-by-word gloss is marked `word-by-word`;
anything else returns the original text with an `[offline · couldn't translate]`
marker. Add more coverage in `PHRASEBOOK` / `GLOSSARY` in
`mockTranslationProvider.ts`, or swap in a real NMT provider.

---

## 8. Ground reporting (§17–19)

"Setu, report a water shortage here" →

1. Setu detects the category, pulls GPS + volunteer identity + time
   automatically, and asks only for what's missing (e.g. people affected).
2. It structures the report and shows a **review card**: category, summary,
   severity, estimated impact, location, source (`volunteer observation`), AI
   extraction confidence — labelled `UNVERIFIED`.
3. The volunteer can attach a photo (camera), then **Submit**.
4. `create_ground_report` writes to the store; Management sees it immediately in
   **Field Reports**; `deriveEmergingSignals` re-runs.
5. Corroborating reports (or a big single one) raise a **Kumbh Pulse** signal.
6. Management can **promote** a report to a dispatchable incident, which then
   flows through the existing dispatch / accept / arrive / resolve lifecycle.

Photo + voice (§18) goes through `MockVisionProvider.describe(dataUrl, hint)` →
a label, category hint, potential impact and confidence; a human always confirms.

---

## 9. Data model additions

`src/lib/types.ts`:

- `LanguageCode` gains `"ta"`.
- `GroundReport` — code, category, zone, position, summary/detail, severity,
  `estimatedPeopleAffected`, `source` (`EvidenceSource`), `reportedBy`,
  `status` (`VerificationStatus`), `corroborations`, `photoUrls`,
  `linkedIncidentId`, `queuedOffline`, `aiConfidence`.
- `EmergingSignal` — category, zone, headline, confidence, `reportIds`,
  `pilgrimRequestCount`, `resourceFlag`, `recommendedAction`, timestamps.

Store (`src/store/useAppStore.ts`) gains `groundReports`, `groundReportSeq`,
`emergingSignals` and the actions `createGroundReport`,
`corroborateGroundReport`, `updateGroundReportStatus`,
`promoteReportToIncident`, `flushOfflineReports`, `recordSetuAudit`. These are
registered in `persist.ts` and `sync.ts` `ACTION_KEYS` so they survive reloads
and stay stripped from cross-tab sync payloads.

---

## 10. Setup & demo

```bash
npm install
npm run dev            # http://localhost:3000 (or the next free port)
```

Open `/field`. No configuration, no keys.

**Killer demo (§52), all from `/field`:**

1. "What's happening in my zone" → live zone brief.
2. "Help me talk to a Tamil-speaking pilgrim" → translation panel.
   Pilgrim (Tamil) → English; you (English/Marathi) → Tamil; **Play** to speak it.
3. "A pilgrim near Gate 4 has collapsed and is not responding" → emergency mode,
   KB guidance, **confirm** → CRITICAL incident created + dispatched.
4. "Report a water shortage here" → "about 200 people are waiting, the tanker
   hasn't arrived" → review card → attach photo → **Submit** → `GR-4001`.
5. `/management` → **Field Reports**: see `GR-4001`; "Log corroborating report"
   twice → a **Kumbh Pulse** emerging signal appears (Operations aside + Pulse).
6. "Promote to incident" → dispatch from Operations → accept / arrive / resolve
   in `/volunteer` → full audit trail in the **Event Log**.

**Eval:** `npm run eval:setu` runs `src/ai/eval/` — intent accuracy, tool
selection, structured extraction, safety behaviour, hallucination resistance and
latency across a scenario set. See `src/ai/eval/README.md`.

---

## 11. Known limitations

- The reasoning provider is rule-based, not a hosted model — it is deliberately
  transparent and offline. Phrasings outside the rule set fall back to a generic
  "here's what I can do" reply.
- Translation is a field phrasebook + word gloss, not full NMT. Coverage is the
  common volunteer/pilgrim phrases; anything else is clearly marked as
  untranslated.
- Voice input needs a browser with the Web Speech API (Chrome/Edge/Android).
  Elsewhere the companion is text-only — every feature still works.
- GPS is simulated from the volunteer's map position.
- Kumbh Pulse signals run over synthetic reports and demo resource data — decision
  support only, labelled throughout, never a certified determination.
- Session memory is in-memory and cleared on an 8-minute idle timeout or "End".
