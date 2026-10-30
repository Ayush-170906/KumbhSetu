# Kumbh Setu sprint meetup demo

## Current demo behavior

`/demo` offers three deterministic synthetic scenarios: a medical emergency, a missing child, and crowd congestion. The original missing-child flow remains intact. The medical and crowd flows use the app's incident, triage, dispatch, acknowledgement, arrival, resolution, escalation, note, and timeline actions. Narration and assistant dialogue are scripted; they are not live Sarvam responses. All scenario state is synthetic, and the abstract map uses reference geography rather than live GPS or crowd sensors.

Demo isolation uses the existing Zustand store with an explicit in-memory isolation flag. Starting a demo saves a return snapshot and loads a known synthetic seed atomically. While the flag is set, persistence skips demo state and BroadcastChannel neither sends it to normal tabs nor applies normal-tab updates into the demo view. Exiting restores the latest ordinarily persisted state, so updates from other tabs are retained; when storage is unavailable it uses the in-memory snapshot. Restart and scenario switching reset only the isolated demo copy. This is an application-level isolation boundary in the browser, not a separate database or security boundary. If the same tab navigates to a role app during the demo, those actions remain in the demo copy and are discarded on exit.

## Suggested 3–4 minute presentation

1. **0:00–0:25 — Problem and roles.** Open `/`, state that Kumbh Setu connects a pilgrim report, a field responder, and a control room for a mass-gathering response.
2. **0:25–1:00 — Start `/demo`.** Point out the synthetic-data label and the three role panels. Explain that the Tamil missing-child dialogue is scripted.
3. **1:00–1:40 — Field signal.** Show the two volunteer ground reports and how corroboration creates an explainable Kumbh Pulse signal. Call out that the scenario is simulated.
4. **1:40–2:35 — Control-room decision.** Show the signal promotion, incident severity, recommended responder, and confirmed assignment. Follow the incident identifier across the panels.
5. **2:35–3:20 — Field response and audit.** Show acceptance, arrival, resolution, and the chronological event log. Clarify that this is a browser-based simulation log, not an immutable audit service.
6. **3:20–3:45 — Close.** Summarize the field-to-control-room loop, then point to `/about` and the next milestone: isolated demo fixtures plus selectable medical, missing-person, and congestion scenarios.

Use **Skip step** to keep the walkthrough within the available time. Use **Restart** to reset the simulation and repeat the same scenario.

## Implementation notes

- State management: Zustand, local storage persistence, and BroadcastChannel synchronization between same-browser tabs.
- Setu provider paths are capability-dependent. The field UI has manual text fallback and confirmation for tool actions. Sarvam features require server-side credentials and reachable provider endpoints; scripted `/demo` dialogue does not prove those calls are live.
- Kumbh Pulse is rule-based decision support. Risk values and history in the seed/demo are synthetic, not validated forecasts.
