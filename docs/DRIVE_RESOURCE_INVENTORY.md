# Google Drive resource inventory

**Drive audit status: inaccessible.** The available Google Drive connector reports `DISABLED_BY_ADMIN` and installation policy `NOT_AVAILABLE`; it cannot be enabled from this session. The supplied folders could not be listed, and no authentication, permission, or access control was bypassed. Remote files and nested folders inspected: **0**. This is not evidence that the folders are empty or that their owners denied access.

## Supplied folders

| Source folder | Folder ID | Listing status | Files / nested folders inspected | Notes |
|---|---|---|---:|---|
| Folder 1 | `1tbMRSw3fcWoc0q1Bij83hvXeAdAoV_t9` | Connector disabled by admin | 0 files / 0 nested folders | Names, types, owners, permissions and metadata unknown. |
| Folder 2 | `1IyNmaGZNJ35LHy3bjhZiuJfyCGn4PYMr` | Connector disabled by admin | 0 files / 0 nested folders | Names, types, owners, permissions and metadata unknown. |
| Folder 3 | `1QGnrRkRtXhlr202_z0UNQic3llZeRYU3` | Connector disabled by admin | 0 files / 0 nested folders | Names, types, owners, permissions and metadata unknown. |

**Remote totals:** 3 folders supplied; 0 folder listings, files, or nested folders inspected. Duplicate, freshness, licensing, and access restriction analysis for Drive material is therefore undetermined. This document does not infer that the folders are empty or that access was denied by their owners.

## Verifiable repository resources (not Drive contents)

These local materials were found while inspecting the application. They are not attributed to any of the three Drive folders.

| Resource | Type | Description and Kumbh Setu relevance | Classification / integration | Restrictions, duplicate, or validation notes |
|---|---|---|---|---|
| `src/data/nashikDirectory.json` | JSON point directory | 2,943 place records across 26 source dataset labels, including hospitals, toilets, ambulance points, police stations, ghats, holding areas, parking, and transit. | Open-data-derived reference geography; already rendered in management's city directory and available to Setu knowledge/tools. | Source attribution in `data/nashik-monitor/SOURCE.md` and `src/lib/nashikDirectory.ts` points to Nashik Monitor v2, described as Kumbhathon initiative open data compiled from NTKMA mobility planning and government registries. Not independently verified as official/current operational data. See `DATA_VALIDATION.md`. |
| `data/nashik-monitor/*.geojson` (36 files, gitignored) | GeoJSON FeatureCollections | 12,128 features across medical, public services, transit, mobility-plan routes/areas, commercial POIs, CCTV points and waste collection derivatives. | Local discovery only; no new layers integrated. **Integrate after validation** for selected mobility/transit references; **reference only** for facilities; **reject** synthetic/unclear crowd and CCTV layers for operational use. | All 36 parsed structurally. Source project flags approximate/generated points; CCTV is not a surveyed inventory; congestion is not measured density. Dataset licensing is not clearly documented. See `DATA_VALIDATION.md`. |
| `data/nashik-monitor/SOURCE.md` | Markdown provenance note | Describes the upstream Nashik Monitor v2 repository and local refresh process; raw GeoJSON is intentionally gitignored while normalized JSON is shipped. | Project-maintained source note; existing integration. | Raw files are present locally but ignored by git. Presence does not establish license, accuracy, currentness or authority approval. |
| `public/images/kumbh/{simhastha-nashik,godavari-ghats,goda-ghat-snan,trimbakeshwar-temple}.jpg` and `public/images/kumbh/CREDITS.md` | Four compressed JPEG photographs plus credit ledger | Nashik Simhastha, Godavari ghats, Goda Ghat snan, and Trimbakeshwar temple. | Existing local visuals used in public/overview surfaces. See `IMAGE_CREDITS.md`. | Wikimedia Commons file pages and stated CC BY / CC BY-SA licenses are recorded locally; retain attribution and applicable ShareAlike obligations. Not tied to Drive. |
| `public/images/cctv/camera1.jpg`–`camera6.jpg` | Six JPEGs | Legacy concept imagery; no longer shown in the security interface. | Assets retained but unused by the updated security page. | Provenance and licensing remain unknown. Do not redistribute until verified. |
| `docs/REFERENCES.md` | Reference link list | Lists event, authority, crowd-safety, language, technical, and project references. | Existing bibliography leads; not a verification record. | The document itself flags several URLs for verification and includes encyclopedic background links. Verify operational claims with primary/authoritative sources before public use. |
| `docs/AI_FIELD_COMPANION.md`, `docs/SPRINT_MEETUP_DEMO.md` | Product/technical documentation | Describes Setu architecture and the synthetic demo workflows/state boundary. | Existing project-authored documentation. | `AI_FIELD_COMPANION.md` labels the prototype simulation and mocked providers; demo data must remain visibly synthetic. |
| `docs/KumbhSetu-LiveDemo-MasterDoc.pdf`, `docs/KumbhSetu-TablePitch.pdf`, `docs/Kumbh_Setu_Judged.pptx`, `docs/archive/Kumbh_Setu_Pitch_16slide.pptx`, `docs/pitch-deck.html` | Local pitch/demo materials | Project presentation artifacts. | Repository resources; not attributed to Drive. | The Drive brief's requested audit is not complete; these files were inventoried by name/type only in this pass, not treated as verified official requirements or data sources. |
| `docs/screenshots/*.png` | 13 local screenshots | Screenshots of the existing pilgrim, field, and management surfaces. | Internal product reference material. | No external factual claims or operational data are inferred from screenshots. |

## Duplicate, age, and conflict findings

- No Drive duplicate or conflict assessment is possible until folder listings are accessible.
- Repository materials include multiple pitch/demo artifacts. Their contents and revision lineage were not cross-compared in this access-limited pass; treat them as potentially overlapping presentation documents, not independent evidence.
- The shipped directory identifies a generation date of `2026-09-06`; that timestamp is not evidence that each underlying record was current on that date.
- The reference list contains entries marked “verify.” Those links are leads, not authoritative validation.

## To complete the Drive audit

Provide a Drive connector with access to these folders, or export their folder trees/files into a workspace-readable location with original metadata and sharing/license information. Then inventory nested folders, compare file hashes and document versions, inspect relevant contents, and update this file and the companion plan/provenance/validation records. No Drive resources are integrated in this pass.
