# Nashik Monitor v2 — raw GeoJSON

Open data compiled for the Kumbhathon initiative from the NTKMA mobility plan
and government registries.

- Live site: https://nashik-monitor-v2.vercel.app
- Repo: https://github.com/tanmayk1234/nashik-monitor-v2 (branch `master`, `public/data/*.geojson`)

## Refresh

```bash
# download all 36 datasets into this folder, then:
node scripts/build-nashik-directory.mjs
```

The raw `.geojson` files are gitignored (they total ~7 MB, mostly route/waste
polygons we don't use). Only the normalised output `src/data/nashikDirectory.json`
(~680 KB, point directory) is committed and shipped.
