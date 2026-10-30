# Drive resource integration plan

**Status: preliminary and access-limited.** The three supplied Drive folders could not be listed using the available tools, so this plan maps known repository resources and defines how newly accessible materials should be evaluated. It does not assert that any Drive resource exists or was integrated.

## Existing modules and resource fit

| Module | Existing support | Useful resource to seek in the Drive folders | Integration path and guardrails |
|---|---|---|---|
| Pilgrim Portal (`/pilgrim`) | SOS and incident reporting, missing-person workflow, language selection and Setu assistance. | Officially approved emergency contacts, verified venue names/entry points, multilingual public guidance, accessible maps, and properly licensed local photographs. | Add references to app knowledge/UI only after checking issuer, publication date, geographic scope, language and license. Do not present demo contacts or locations as live response services. |
| Field Volunteer Portal (`/field`) | Assignment queue, acknowledgement, status, notes, escalation, ground reports and Setu. | Approved SOPs, response checklists, zone maps, escalation contacts, radio procedure and multilingual field phrases. | Convert only operationally approved guidance into concise versioned checklists. Preserve source/title/date and review owner. Keep scenario fixtures separate from real incident records. |
| Management (`/management`) | Incident queue, dispatch lifecycle, event timeline, signals and a real-world reference city directory. | Official control-room workflow, signed operational plans, verified facility/contact lists and incident classification guidance. | Integrate after reconciliation with existing data. Never silently overwrite the 2,943-record directory or make an unverified phone number dispatch-critical. Keep audit/source links with each imported dataset. |
| Kumbh Pulse | Rule-based aggregation of field signals with explainable inputs; current operational numbers are simulation/reference values. | Published crowd-management methodology, approved density thresholds, validated zone boundaries and documented data collection methods. | Translate a source into an explicit methodology note and tests only after domain review. Do not relabel synthetic seed values as observations or forecasts. |
| Setu AI | Mock/local providers, retrieval knowledge base, typed actions and human confirmation gates; optional provider path documented. | Primary-source FAQ/SOP text, reviewed Hindi/Marathi/Tamil translations, API docs and safe operational knowledge. | Store source metadata beside knowledge passages; separate public factual content from internal/restricted instructions. Require human confirmation for high-impact writes and clearly disclose model/provider status. |
| Demo (`/demo`) | Medical, missing-person and crowd-congestion deterministic scenarios using app lifecycle actions; isolated browser-local state. | Approved scenario narratives, generalized maps or public photos, and rubric/evaluation criteria. | Use only synthetic named people/incidents unless scenario data is explicitly cleared and anonymized. Label all values simulated. Do not import personal data or operational credentials. |

## Existing repository integrations confirmed

1. **Nashik Monitor v2 directory:** `src/data/nashikDirectory.json` is consumed through `src/lib/nashikDirectory.ts`; management shows it as a reference directory and code comments explicitly keep it separate from simulated incident dispatch. Source note: `data/nashik-monitor/SOURCE.md`. No Drive resource justified a change.
2. **Wikimedia photographs:** four local Kumbh/Nashik photographs are used in overview surfaces, with source and license details in `public/images/kumbh/CREDITS.md` and the central manifest `src/lib/kumbhImagery.ts`. No Drive resource justified a change.
3. **Simulation/demo:** scenario state, seed data and scripted narration remain clearly identified as demo/simulation in existing documentation. No Drive resource justified a change.

## Intake procedure once Drive is accessible

1. Record each file's stable Drive ID, parent folder, filename, owner, MIME type, modified time, sharing state and checksum where downloadable.
2. Review content before classifying it. Mark source authority, date/version, geographic coverage, license/permission, sensitive information and intended audience.
3. Compare duplicates by content/hash and version history; resolve conflicting facts with the issuing authority rather than choosing the newest filename.
4. Prefer normalized, documented datasets over manual copy/paste. Keep originals unchanged and add a reproducible import/validation step for structured data.
5. Store public assets only after permission/license review. Keep restricted/internal material out of public bundles and Git.
6. Update `DRIVE_RESOURCE_INVENTORY.md`, `RESOURCE_PROVENANCE.md`, `IMAGE_CREDITS.md`, and `DATA_VALIDATION.md` in the same change as an integration. Add UI/source labels distinguishing verified operational data, reference data, and synthetic demo data.

## Not integrated in this pass

No new Drive documents, photos, coordinates, datasets, APIs, operational guidelines or Kumbhathon criteria were imported because their contents and permissions were unavailable for inspection. This avoids fabricating provenance or exposing unknown private material. Existing local material remains as-is.
