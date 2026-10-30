# Kumbh Setu product design and dataset audit

**Reviewed:** 2026-10-31 · **Scope:** current local prototype and routes available at `http://localhost:3000/`.

## Drive access and local dataset findings

The three supplied Drive folders could not be listed. The connected Drive integration reports `DISABLED_BY_ADMIN` with installation policy `NOT_AVAILABLE`; remote content inspected: **0 files, 0 nested folders**. See [DRIVE_RESOURCE_INVENTORY.md](DRIVE_RESOURCE_INVENTORY.md).

The repository has 36 ignored Nashik Monitor GeoJSON files, 12,128 features total, and a normalized 2,943-record directory already in the app. Structural parsing succeeded for all 36. Raw layers span transit, facilities, NTKMA mobility-plan features, commercial places, waste derivatives, CCTV points and congestion annotations. They do not establish a current official inventory: provenance and point accuracy vary, some records are generated/approximate, and a dataset license was not confirmed separately from the code license.

| Dataset group | Recommendation | Reason / product fit |
|---|---|---|
| Existing normalized 2,943-record directory | REFERENCE ONLY | Already searchable in management; useful for geographic context, not live availability, capacity or dispatch. Missing addresses/phones and repeat coordinates remain. |
| NTKMA mobility-plan routes, ghats, holding/parking/staging areas | INTEGRATE AFTER VALIDATION | Could help map context and demo geography. Need current authority approval, geometry review and clear data terms first. |
| NMPML/RTI transit stops and depots | INTEGRATE AFTER VALIDATION | Could add transit context; verify operator, date, coordinate source and republication terms. |
| Hospital, ambulance, police, fire, toilet and other public facility layers | REFERENCE ONLY | Useful to inform future map context, but not verified as staffed/open/reachable. Reconcile with primary authority before operational use. |
| Commercial POIs | REJECT for response operations | Directory/geocoder records do not establish emergency suitability or accuracy. |
| CCTV camera points / camera preview photos | REJECT as security evidence | Inventory/imagery provenance uncertain; camera points do not prove a connected or surveyed camera system. Security page now shows no mock alerts or footage. |
| Congestion points/polygons | REJECT as crowd evidence | Not a validated measured density feed; would create false operational confidence. |
| Waste route/checkpoint/zone derivatives | REFERENCE ONLY, restricted | Source derives from a one-day vehicle tracking export; do not expose live worker/resource positions or infer current sanitation service. |
| Historical attendance / footfall / live crowd feeds | NOT FOUND LOCALLY | No confirmed source in repository; seeded figures remain synthetic. |

No new datasets were integrated. Existing credited Nashik photographs remain in use; no new imagery was added because Drive assets were inaccessible and no newly verified licensed photo was needed. Emergency contacts shown are official public numbers only: 112, 108 and 1098; see [REFERENCES.md](REFERENCES.md).

## Route review

Reviewed in the running browser: `/`, `/pilgrim`, `/field`, `/management`, `/demo`, `/login`, `/about`, `/board`, `/enroll` and supporting management views. Mobile checks at 390px found no material horizontal overflow on sampled routes. The landing page remains the strongest route: distinctive Kumbh photography, warm editorial typography and clear role entry. The mobile layout is readable, though the hero occupies a large first-screen share.

The design does not read as wholly generic: Nashik imagery, warm paper/vermillion palette, serif display type and operational lifecycle content create a recognizable identity. The weaker pattern is inconsistency between editorial public pages and dense operational views, with repeated compact cards and small text. Copy also previously overstated real dispatch, live authority notices and security analytics; fixes are listed below. It is not possible to infer whether AI was used to author the product. The useful test is whether UI choices feel specific, coherent and evidence-backed.

### Scores out of 10

Scores are an honest design review, not a production-readiness certification. “Before” describes the observed state before this pass’s trust fixes; “After” is the current local implementation, with remaining gaps noted.

| Dimension | Before | After | Evidence / remaining gap |
|---|---:|---:|---|
| Visual identity and differentiation | 7.5 | 8.0 | Nashik imagery and warm editorial identity are memorable; dashboard styling is less distinctive. |
| Typography and hierarchy | 8.0 | 8.0 | Display/body pairing is clear; some operational captions remain small. |
| Colour and contrast | 8.0 | 8.0 | Restrained warm palette; full contrast audit not completed. |
| Layout and spacing | 7.5 | 7.6 | Clear page rhythm, but public and operator shells differ and management is dense. |
| Landing page | 7.5 | 8.0 | Strong image/role entry and workflow copy; could show an actual product preview. |
| Pilgrim experience | 6.5 | 7.5 | SOS/reporting now disclose local-only behavior and link to 112; broader multilingual usability and assistive-technology QA remain. |
| Volunteer experience | 6.0 | 7.5 | Task queue is the default tab; needs more field testing for task-first ergonomics and touch targets. |
| Management dashboard | 6.0 | 7.3 | Search, filters, responsive layout and synthetic-data notices are present; density and simulated operational metrics need careful review. |
| Guided demo | 8.0 | 8.5 | Medical, crowd and missing-child scenarios exercise app actions; isolation/replay suite passes. |
| Mobile responsiveness | 7.5 | 7.6 | Sampled routes fit 390px width; tablet and broader device matrix not completed. |
| Accessibility | 6.5 | 7.0 | Focus styling and semantic controls exist; screen-reader, zoom, contrast and complete keyboard journey audits remain. |
| Interaction design | 7.0 | 7.5 | Incident lifecycle and scenario transitions are meaningful; some prototypes still have non-persistent/no backend actions by design. |
| Cross-route consistency | 7.0 | 7.5 | Updated trust labels and design tokens help; public/operations page shells still diverge. |
| Trust and data presentation | 4.5 | 7.2 | Removed fake emergency SMS, unverified control-room numbers, fabricated bulletins, false camera alerts and forecast claims. Other synthetic records still require visible context on every entry path. |
| Overall product polish | 6.8 | 7.6 | Noticeable improvements, but this remains a local prototype requiring authority validation and field usability testing. |

**Overall score:** Before 7.0/10; after 7.7/10 (unweighted mean of the 15 after-scores is 7.65). Not 10/10 and not deployment-ready.

## AI-generic design audit

- **Distinctive choices:** relevant Nashik photography with credits, editorial serif headline, restrained saffron/ink palette, role-specific operational tasks, and incident lifecycle detail.
- **Generic or repeated choices:** role-card grid, repeated rounded containers, dense KPI panels, a generic assistant-first volunteer surface, and broad “connected response platform” claims. Changing the volunteer default to its task queue makes that route more task-specific.
- **Previously misleading placeholders:** fictional authority bulletins, unsupported crowd forecasts/confidence, mock CCTV matches/weapons, hardcoded SMS routing and unverified helplines. These were removed or relabeled as synthetic/local-only.
- **Remaining review:** inspect AI companion copy, scenario narratives, seed data and every role entry for implied live response; test visual hierarchy and keyboard operation with intended users. Do not equate polished styling with operational readiness.

## Changes made this pass

- Replaced the security mock CCTV grid and fabricated detections with a concise integration-safeguards page.
- Made pilgrim SOS explicitly local-only, removed the dummy SMS destination and added a direct 112 call action.
- Clarified local-only pilgrim issue and lost-person reports; added privacy guidance to public reporting and volunteer enrollment.
- Replaced fictitious board announcements with clearly illustrative examples; removed unverified 2027 control-room and lost-and-found numbers.
- Labeled Pulse scores synthetic and removed forecast/confidence presentation; removed historical-pattern claims from seeded narratives.
- Corrected Setu emergency and reporting guidance so it does not promise dispatch, synchronization or external notifications; directed urgent real-world help to 112.
- Made the volunteer task queue the default field tab.
- Renamed the city directory as reference-only and documented variable quality/licensing.
- Fixed `setDemoScenario` BroadcastChannel serialization by including the action in both serialization allowlists; added clone-safe coverage to the demo test.

## Validation and outstanding work

- Demo scenario lifecycle/isolation test: passed.
- TypeScript: passed (`npx tsc --noEmit`).
- Lint: passed with no warnings (`npm run lint`).
- Demo lifecycle/isolation: passed (`npm run test:demo`).
- Production build: passed with `npm run build -- --webpack` (Next 16.3.4 / webpack).
- HTTP smoke: all 10 app routes and `/api/setu/status` returned HTTP 200.
- Browser: actual in-app browser checked the landing, pilgrim, volunteer, management, demo, login, overview, board and enrollment routes. Mobile sampling at 390px exposed and fixed the overview footer overflow; no horizontal overflow remained on the recheck. Medical scenario start and switching to crowd congestion were observed in the browser. The final landing page is left open. The console log has pre-fix development errors from earlier in the audit (BroadcastChannel serialization and temporary compile errors); final route navigation after the fixes produced no new errors. Full accessibility and device-matrix testing remain outstanding.
- No new images or data layers integrated; no source licensing claims beyond recorded photo credits and official emergency reference links.
- To approach a true 10/10: authority-verified and licensed operational data, backend/auth/security/privacy review, validated response procedures, accessibility audit with users, field trials, responsive-device matrix, telemetry/error handling and an approved live demo environment.
