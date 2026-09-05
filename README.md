# Kumbh Setu

One connected platform for pilgrims, volunteers & management — a prototype civic-technology
product for large public gatherings, powered by the **Kumbh Pulse** explainable crowd-risk layer.

Built for Kumbhathon S.P.R.I.N.T. 2026. **This is a prototype.** All data is synthetic/demo data —
see `PROTOTYPE.md` for a full breakdown of what is simulated vs. functional.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Then open `/pilgrim`, `/volunteer` and
`/management` in **separate browser tabs** — they stay live-synchronized via `BroadcastChannel`,
so an SOS raised in Pilgrim appears instantly in Management and Volunteer. Or visit `/demo` for a
single-page, three-pane guided walkthrough of the same scenario.

## Routes

| Route | Experience |
|---|---|
| `/` | Landing / product overview |
| `/field` | **Setu — AI Field Companion.** Voice-first companion for volunteers: ask, translate, report and act, grounded in live data |
| `/pilgrim` | Mobile-first pilgrim app — map, SOS, facilities, lost & found, assistant |
| `/volunteer` | Field operations app — task queue, accept/navigate/arrive/resolve, "Ask Setu" tab |
| `/management` | Control room — live map, Kumbh Pulse, incidents, **Field Reports**, analytics, event log |
| `/demo` | Scripted, synchronized 3-pane demo of the full SOS → resolution loop |

### Setu — AI Field Companion

A voice-first AI companion for volunteers, integrated into the platform (not a
separate app). Speak naturally — Setu detects intent, answers in the right
language, retrieves verified knowledge, calls controlled tools (with a
confirmation gate for anything high-impact), runs live volunteer↔pilgrim
translation (EN/हिंदी/मराठी/தமிழ்), and turns field observations into structured
ground reports that reach the control room and feed Kumbh Pulse signals.

**No API key required** — every model / speech / translation provider is a local
offline implementation behind a swappable interface. `npm run eval:setu` runs
the reasoning-layer eval. Full write-up: [`docs/AI_FIELD_COMPANION.md`](docs/AI_FIELD_COMPANION.md).

See `PROTOTYPE.md` for architecture, data model, what remains for a real pilot, and how each
feature maps to Kumbhathon SPRINT's Tower 4 ("Pilgrim Experience") judged problem statements —
skill/language-aware volunteer dispatch, Lost & Found match suggestions, live police/management
advisories, and a working multilingual (EN/हिंदी/मराठी) toggle.
