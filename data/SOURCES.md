# Data sources & disclaimer

> **Prototype data — not for production use.** These JSON files were compiled for the
> Wilaya pitch prototype to replace hardcoded dummy data. Coordinates are approximate
> (zone/cluster centroids, not surveyed boundaries) and some figures are indicative
> estimates. **Verify against the official sources below before any real use.**

**Compiled:** 2026-06-19

## Files

| File | Contents | Primary source |
| --- | --- | --- |
| `kek.json` | 24 Special Economic Zones (KEK) | Dewan Nasional KEK; list cross-checked via Kompas (Oct 2024) |
| `industrial-estates.json` | Selected major industrial estates (Kawasan Industri) | Kemenperin SIINas + company disclosures |
| `minerals.json` | Mineral/resource deposit clusters (Ni, Cu, Au, bauxite, coal, tin) | ESDM Minerba + company disclosures |
| `ports.json` | Strategic & PSN sea ports | Kemenhub / Pelindo |
| `opportunities.json` | Featured investment opportunities (illustrative) | Compiled from BKPM priority/hilirisasi projects |
| `sectors.json` | Priority sectors + foreign-ownership caps | Perpres 10/2021 (Positive Investment List) |
| `investment-realization.json` | National / province / sector realization | BKPM FY2024 release (Jan 2025), Q3 2024 data |
| `economic-indicators.json` | Per-province GDRP (PDRB), growth, unemployment | BPS WebAPI (webapi.bps.go.id), 2024 — CSV item D06 |
| `hazard.json` | Per-province multi-hazard risk index | InaRISK / BNPB (inarisk.bnpb.go.id) — CSV item D11 |
| `value-chains.json` | Headline downstreaming (hilirisasi) export totals — Nikel / Sawit / Kelapa / Rumput Laut, 2023 | BKPM, GAPKI, BPS / UN Comtrade, KKP / UNIDO — CSV item D03 (per-commodity refs below) |
| `data-requirements.csv` | Data-sourcing catalogue (D01–D16): source, access, feasibility, risk | Compiled by the team (planning artifact, not data) |

## Data-requirements catalogue (`data-requirements.csv`)

`data-requirements.csv` is **not a dataset** — it is the team's blueprint of the 16
datasets (D01–D16) the production platform would need, each with primary/secondary
sources, access method, update frequency, POC feasibility, risks and mitigations.
It is the provenance map behind the JSON above and the roadmap for layers still to be
added (e.g. RTRW zoning D07, WIUP concession polygons D09, geology D13). The chat
assistant's source registry (`app/api/chat/route.js`) is derived from this file so
answers cite the real primary source for each topic.

## Key figures (FY2024, BKPM)

- Total realization: **Rp1,714.2 trillion** (+20.8% YoY) — FDI Rp900.2T, domestic Rp814.0T, 2,456,130 jobs.
- Top provinces: Jawa Barat (251.1), DKI Jakarta (241.9), Jawa Timur (147.3), Sulawesi Tengah (139.9), Banten (105.6).

## References

- Kementerian Investasi & Hilirisasi / BKPM — https://www.bkpm.go.id, https://data.bkpm.go.id
- NSWI / OSS — https://oss.go.id
- Dewan Nasional KEK — https://kek.go.id
- BPS — https://www.bps.go.id
- ESDM Minerba (MODI / WIUP) — https://www.minerba.esdm.go.id
- Kemenperin SIINas — https://siinas.kemenperin.go.id
- 24 KEK list (Oct 2024): Kompas — https://www.kompas.com/tren/read/2024/10/10/190000165/daftar-24-kek-di-indonesia-ada-dua-zona-baru-jelang-jokowi-lengser
- FY2024 realization: CNN Indonesia (Jan 2025) — https://www.cnnindonesia.com/ekonomi/20250131100843-92-1193040/realisasi-investasi-tembus-rp1714-t-pada-2024

### Value-chain headline trade (`value-chains.json`, 2023)

Export totals are sourced; import/surplus and per-node tree figures are indicative.

- **Nikel** — nickel downstreaming export value ~US$33.5B (2023), Kementerian Investasi/BKPM via ANTARA — https://en.antaranews.com/news/320483/downstreaming-propels-nickel-export-value-tenfold-minister
- **Sawit** — palm oil + derivatives export value US$30.32B (2023), GAPKI — https://gapki.id/en/news/2024/02/28/palm-oil-industry-performance-in-2023-prospects-for-2024/
- **Kelapa** — coconut product exports ~US$1.55B (2023), BPS / UN Comtrade (WITS) — https://wits.worldbank.org/trade/comtrade/en/country/IDN/year/2023/tradeflow/Exports/partner/ALL/product/080110
- **Rumput Laut** — seaweed exports ~US$0.60B (2023; dried US$399.3M + carrageenan US$187.1M + agar US$13.3M), KKP / UNIDO — https://hub.unido.org/sites/default/files/publications/Blue%20Economy%20Policy%20Brief%20Indonesias%20Seaweed%20Industry%20as%20Key%20Sources%20of%20Growth%20-%20UNIDO.pdf
