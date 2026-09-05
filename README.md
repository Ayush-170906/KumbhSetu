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
| `/pilgrim` | Mobile-first pilgrim app — map, SOS, facilities, lost & found, assistant |
| `/volunteer` | Field operations app — task queue, accept/navigate/arrive/resolve |
| `/management` | Control room — live map, Kumbh Pulse, incidents, analytics, event log |
| `/demo` | Scripted, synchronized 3-pane demo of the full SOS → resolution loop |

See `PROTOTYPE.md` for architecture, data model, what remains for a real pilot, and how each
feature maps to Kumbhathon SPRINT's Tower 4 ("Pilgrim Experience") judged problem statements —
skill/language-aware volunteer dispatch, Lost & Found match suggestions, live police/management
advisories, and a working multilingual (EN/हिंदी/मराठी) toggle.
