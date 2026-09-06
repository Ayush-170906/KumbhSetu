# Kumbh Setu — Reference Links

Every external reference used or worth citing for the platform, in one place.
Grouped by purpose. Where a link's exact URL couldn't be verified from here it is
marked _(verify)_.

---

## 1. The event & the authorities

| What | Link |
|---|---|
| Simhastha Kumbh Mela — overview (Nashik & Trimbakeshwar) | https://en.wikipedia.org/wiki/Simhastha |
| Kumbh Mela — overview | https://en.wikipedia.org/wiki/Kumbh_Mela |
| Kumbh Mela — Encyclopædia Britannica | https://www.britannica.com/topic/Kumbh-Mela |
| Nashik Municipal Corporation | https://nmc.gov.in/ |
| Trimbakeshwar Municipal Council | https://trimbakeshwarmc.in/ _(verify)_ |
| Government of Maharashtra | https://www.maharashtra.gov.in/ |
| Kumbh Mela 2015 (Nashik) archived portal | https://web.archive.org/web/2015*/kumbhmela.gov.in _(archive)_ |
| NTKMA / Nashik–Trimbak mobility plan | referenced via Nashik Monitor (below) — original plan not public online _(verify)_ |

## 2. Data sources used in this build

| What | Link |
|---|---|
| **Nashik Monitor v2** — live map, 36 open datasets | https://nashik-monitor-v2.vercel.app/ |
| Nashik Monitor v2 — source (branch `master`, `public/data/*.geojson`) | https://github.com/tanmayk1234/nashik-monitor-v2 |
| Nashik Monitor v1 (older) | https://github.com/tanmayk1234/nashik-monitor _(verify)_ |
| OpenStreetMap — base map tiles | https://www.openstreetmap.org/ |
| OSM Nashik relation | https://www.openstreetmap.org/relation/1943098 _(verify)_ |
| Leaflet — mapping library | https://leafletjs.com/ |

Local copy: `data/nashik-monitor/` (raw GeoJSON, gitignored) →
`scripts/build-nashik-directory.mjs` → `src/data/nashikDirectory.json` (shipped).

## 3. Cultural & historical context (for the knowledge base)

| Topic | Link |
|---|---|
| Samudra Manthan (churning of the ocean) | https://en.wikipedia.org/wiki/Samudra_Manthan |
| Akharas (monastic orders) | https://en.wikipedia.org/wiki/Akhara |
| Naga sadhus | https://en.wikipedia.org/wiki/Naga_sadhu |
| Shahi Snan / Amrit Snan (royal bath) | https://en.wikipedia.org/wiki/Kumbh_Mela#Bathing_dates |
| Trimbakeshwar Shiva Temple (Jyotirlinga) | https://en.wikipedia.org/wiki/Trimbakeshwar_Shiva_Temple |
| Jyotirlinga (the twelve) | https://en.wikipedia.org/wiki/Jyotirlinga |
| Kushavarta Kund | https://en.wikipedia.org/wiki/Kushavarta |
| Godavari River (rises at Trimbakeshwar) | https://en.wikipedia.org/wiki/Godavari_River |
| Ramkund, Nashik | https://en.wikipedia.org/wiki/Ramkund |
| Panchavati, Nashik | https://en.wikipedia.org/wiki/Panchavati,_Nashik |
| Adi Shankaracharya (credited with organising akharas) | https://en.wikipedia.org/wiki/Adi_Shankara |
| Simhastha 2015 Nashik — news coverage | https://timesofindia.indiatimes.com/topic/nashik-kumbh-mela |

## 4. Crowd safety & mass-gathering management

| What | Link |
|---|---|
| WHO — Public health for mass gatherings: key considerations | https://www.who.int/publications/i/item/public-health-for-mass-gatherings-key-considerations |
| WHO — Communicable disease alert and response for mass gatherings | https://www.who.int/publications/i/item/WHO-HSE-EPR-2008.8 _(verify)_ |
| UK Green Guide — Guide to Safety at Sports Grounds (crowd density) | https://sgsa.org.uk/greenguide/ |
| HSE (UK) — Managing crowds safely | https://www.hse.gov.uk/pubns/priced/hsg154.pdf _(verify)_ |
| "Crowd disasters as systemic failures" — Helbing & Mukerji | https://epjdatascience.springeropen.com/articles/10.1140/epjds3 |
| Kumbh Mela crowd management — Harvard South Asia Institute study | https://southasiainstitute.harvard.edu/kumbh-mela/ _(verify)_ |
| MIT Media Lab — Kumbhathon | https://www.media.mit.edu/projects/kumbhathon/overview/ |
| Kumbhathon — Innovation for Impact | https://kumbhathon.in/ _(verify)_ |
| Nashik stampede 2015 — incident report coverage | https://en.wikipedia.org/wiki/2015_Nashik_stampede _(verify)_ |

## 5. Language & AI (for the provider layer)

| What | Link |
|---|---|
| **Bhashini** — National Language Translation Mission | https://bhashini.gov.in/ |
| Bhashini — developer / ULCA | https://bhashini.gov.in/ulca |
| AI4Bharat — IndicTrans2 | https://github.com/AI4Bharat/IndicTrans2 |
| AI4Bharat — IndicConformer / Indic STT | https://github.com/AI4Bharat/IndicConformerASR _(verify)_ |
| AI4Bharat — models hub | https://ai4bharat.iitm.ac.in/ |
| **Sarvam AI** — speech / translation / chat for Indian languages | https://www.sarvam.ai/ |
| Sarvam — developer console | https://indus.sarvam.ai/ |
| Sarvam — docs | https://docs.sarvam.ai/ |
| Web Speech API (browser STT/TTS) | https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API |

## 6. This project's own artifacts

| Doc | Path |
|---|---|
| Platform report (PDF) | `Kumbh_Setu_Platform_Report.pdf` (repo root) |
| Role personas (PDF) | `Kumbh_Setu_Role_Personas.pdf` (repo root) |
| Pitch deck | `docs/Kumbh_Setu_Pitch.pptx` |
| AI Field Companion — architecture | `docs/AI_FIELD_COMPANION.md` |
| Prototype notes | `PROTOTYPE.md` |
| Screenshots | `docs/screenshots/` |
| Repo | https://github.com/Ayush-170906/KumbhSetu |

---

_Encyclopedic links (Wikipedia / Britannica) are used for stable background
context in the knowledge base; operational content is deferred to the Mela
authority. Anything marked `(verify)` should be checked before it goes in a
public deck._
