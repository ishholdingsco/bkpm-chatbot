// Shared vocabulary for the chat <-> map integration (issue #7, WandeRound
// pattern). PLAIN module — no "use client", no mapbox/browser imports — so it
// can be used both by the server route (the tool *definitions* sent to DeepSeek)
// and by the client (the *executors* that drive the real Mapbox map).

import opportunitiesData from "@/data/opportunities.json";
import mineralsData from "@/data/minerals.json";
import industrialData from "@/data/industrial-estates.json";
import kekData from "@/data/kek.json";
import portsData from "@/data/ports.json";

// Layers that actually carry point/polygon data and can be toggled. Mirrors
// MB_LAYER_GROUPS in MapboxMap.js (wiup/gdp/infra have no data yet, so the
// assistant must not pretend to toggle them).
export const MAP_LAYER_IDS = ["industrial", "kek", "minerals", "ports"];

// Named regions the assistant can fly to. Lowercase keys; values are
// { center:[lng,lat], zoom, label }. `label` is what the sidebar header shows.
export const REGIONS = {
  indonesia: { center: [118.0, -2.5], zoom: 4.0, label: "Indonesia" },
  sumatra: { center: [101.5, 0.0], zoom: 4.9, label: "Sumatra" },
  sumatera: { center: [101.5, 0.0], zoom: 4.9, label: "Sumatra" },
  java: { center: [110.0, -7.2], zoom: 5.6, label: "Jawa" },
  jawa: { center: [110.0, -7.2], zoom: 5.6, label: "Jawa" },
  kalimantan: { center: [114.0, 0.0], zoom: 4.7, label: "Kalimantan" },
  borneo: { center: [114.0, 0.0], zoom: 4.7, label: "Kalimantan" },
  sulawesi: { center: [121.0, -2.5], zoom: 5.3, label: "Sulawesi" },
  morowali: { center: [122.1, -2.83], zoom: 7.4, label: "Morowali · Sulawesi" },
  konawe: { center: [122.0, -3.9], zoom: 7.4, label: "Konawe · Sulawesi" },
  halmahera: { center: [127.95, 0.5], zoom: 7.0, label: "Halmahera" },
  "weda bay": { center: [127.95, 0.52], zoom: 8.0, label: "Weda Bay · Halmahera" },
  "maluku utara": { center: [127.9, 0.6], zoom: 6.4, label: "Maluku Utara" },
  maluku: { center: [128.5, -3.2], zoom: 5.4, label: "Maluku" },
  papua: { center: [137.0, -4.0], zoom: 4.7, label: "Papua" },
  bali: { center: [115.1, -8.4], zoom: 8.0, label: "Bali" },
  "nusa tenggara": { center: [119.5, -8.8], zoom: 5.4, label: "Nusa Tenggara" },
  lombok: { center: [116.3, -8.6], zoom: 8.4, label: "Lombok" },
  batam: { center: [104.05, 1.1], zoom: 9.3, label: "Batam" },
  "kepulauan riau": { center: [104.4, 1.0], zoom: 6.3, label: "Kepulauan Riau" },
  jakarta: { center: [106.85, -6.2], zoom: 8.4, label: "Jakarta" },
};

function norm(s) {
  return String(s || "").trim().toLowerCase();
}

// Every mapped data point, with the text we match a region term against. Used
// to frame fly_to on the *real* coordinates rather than a hand-typed centre.
const REGION_POINTS = [
  ...mineralsData.deposits.map((d) => ({ coordinates: d.coordinates, hay: [d.name, d.province, d.commodity] })),
  ...opportunitiesData.opportunities.map((o) => ({ coordinates: o.coordinates, hay: [o.label, o.province, o.sector] })),
  ...industrialData.estates.map((e) => ({ coordinates: e.coordinates, hay: [e.name, e.province, e.location] })),
  ...kekData.estates.map((e) => ({ coordinates: e.coordinates, hay: [e.name, e.province, e.location] })),
  ...portsData.ports.map((p) => ({ coordinates: p.coordinates, hay: [p.name, p.province] })),
];

// Bounding box [[minLng,minLat],[maxLng,maxLat]] of a list of [lng,lat] points.
export function boundsOf(coords) {
  let minLng = 180, minLat = 90, maxLng = -180, maxLat = -90;
  for (const [lng, lat] of coords) {
    minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
  }
  return [[minLng, minLat], [maxLng, maxLat]];
}

// Coordinates of every data point whose name/province/etc. matches `term`.
function regionCoords(term) {
  const q = norm(term);
  if (!q) return [];
  return REGION_POINTS.filter((p) => p.hay.some((h) => norm(h).includes(q))).map((p) => p.coordinates);
}

function titleCase(s) {
  return String(s || "").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Resolve fly_to args → a camera target. Prefers `{ bounds, label }` framed from
// the real data coordinates in that region (so the cluster sits centred), and
// falls back to a `{ center, zoom, label }` from the REGIONS registry or an
// explicit lng/lat. Accepts a known region name (exact or loose contains-match).
export function resolveFlyTo(args = {}) {
  const lng = Number(args.lng);
  const lat = Number(args.lat);
  if (Number.isFinite(lng) && Number.isFinite(lat)) {
    return { center: [lng, lat], zoom: Number(args.zoom) || 7, label: args.region || "Lokasi terpilih" };
  }

  const region = norm(args.region);
  if (region) {
    const known = REGIONS[region] || REGIONS[Object.keys(REGIONS).find((k) => region.includes(k) || k.includes(region))];
    const coords = regionCoords(region);
    if (coords.length) {
      return { bounds: boundsOf(coords), label: known?.label || titleCase(args.region) };
    }
    if (known) return { ...known };
  }
  return { ...REGIONS.indonesia };
}

// Parse a foreign-cap string ("100%", "95%", "100% (with conditions)") → number.
function capPct(s) {
  const m = String(s || "").match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

// Select the featured opportunities matching a filter_opportunities call.
// Returns { ids, coords, bounds, count, label }. coords is the matched pins'
// [lng,lat]; bounds is their box (or null when nothing matched).
export function selectOpportunities(args = {}) {
  if (args.clear) return { ids: null, coords: null, bounds: null, count: null, label: null };

  const sector = norm(args.sector);
  const province = norm(args.province);
  const commodity = norm(args.commodity);
  const minPct = Number.isFinite(Number(args.min_foreign_pct)) ? Number(args.min_foreign_pct) : null;

  const matches = opportunitiesData.opportunities.filter((o) => {
    if (sector && !norm(o.sector).includes(sector)) return false;
    if (province && !norm(o.province).includes(province)) return false;
    if (commodity && !(norm(o.label).includes(commodity) || norm(o.sector).includes(commodity))) return false;
    if (minPct != null) {
      const c = capPct(o.foreignCap);
      if (c == null || c < minPct) return false;
    }
    return true;
  });

  const ids = matches.map((o) => o.id);
  const coords = matches.map((o) => o.coordinates);
  const bounds = matches.length ? boundsOf(coords) : null;
  // Tracked value of the matched pins, summed from ticketUsdM (millions). Lets
  // the "Opportunities in view" panel show a real total instead of a literal.
  const valueUsdM = matches.reduce((s, o) => s + (Number(o.ticketUsdM) || 0), 0);

  const parts = [];
  if (args.sector) parts.push(args.sector);
  if (args.commodity) parts.push(args.commodity);
  if (args.province) parts.push(args.province);
  if (minPct != null) parts.push("asing ≥" + minPct + "%");
  const label = parts.join(" · ") || "Semua peluang";
  return { ids, coords, bounds, count: matches.length, valueUsdM, label };
}

// Apply a set_layers call to the current active-layer state → next state. Only
// touches layers that have data (MAP_LAYER_IDS); ids without data are ignored.
export function applyLayerChange(active, args = {}) {
  const next = { ...active };
  const valid = (id) => MAP_LAYER_IDS.includes(id);
  if (Array.isArray(args.only)) {
    for (const id of MAP_LAYER_IDS) next[id] = false;
    for (const id of args.only) if (valid(id)) next[id] = true;
  }
  if (Array.isArray(args.show)) for (const id of args.show) if (valid(id)) next[id] = true;
  if (Array.isArray(args.hide)) for (const id of args.hide) if (valid(id)) next[id] = false;
  return next;
}

// OpenAI-compatible tool/function definitions handed to DeepSeek (server side).
export const MAP_TOOLS = [
  {
    type: "function",
    function: {
      name: "set_layers",
      description:
        "Show or hide map data layers. Available layer ids: industrial (Kawasan Industri / industrial estates), kek (Special Economic Zones / KEK), minerals (mineral & mining deposit clusters), ports (strategic sea ports). Use `only` to show exactly one set and hide all others.",
      parameters: {
        type: "object",
        properties: {
          show: { type: "array", items: { type: "string", enum: MAP_LAYER_IDS }, description: "Layer ids to turn ON." },
          hide: { type: "array", items: { type: "string", enum: MAP_LAYER_IDS }, description: "Layer ids to turn OFF." },
          only: { type: "array", items: { type: "string", enum: MAP_LAYER_IDS }, description: "Show only these layers; hide all others." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fly_to",
      description:
        "Pan and zoom the map to a region or coordinate. Prefer `region` using one of the known names: " +
        Object.keys(REGIONS).join(", ") +
        ". Otherwise pass explicit lng/lat (and optional zoom).",
      parameters: {
        type: "object",
        properties: {
          region: { type: "string", description: "A known region name (see list in the description)." },
          lng: { type: "number" },
          lat: { type: "number" },
          zoom: { type: "number", description: "4 (national) … 9 (city). Defaults to 6.5 for raw coordinates." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "filter_opportunities",
      description:
        "Filter and highlight the featured investment-opportunity pins on the map. Combine any of: sector, province, commodity, min_foreign_pct (e.g. 50 for foreign ownership ≥ 50%). Pass clear:true to remove the filter and show every pin again.",
      parameters: {
        type: "object",
        properties: {
          sector: { type: "string", description: "e.g. 'Critical minerals', 'EV battery', 'Renewable energy', 'Tourism'." },
          province: { type: "string", description: "Indonesian province name, e.g. 'Sulawesi Tengah'." },
          commodity: { type: "string", description: "e.g. 'nickel', 'copper', 'methanol'." },
          min_foreign_pct: { type: "number", description: "Minimum allowed foreign-ownership %, e.g. 50 or 100." },
          clear: { type: "boolean", description: "True to clear the filter." },
        },
      },
    },
  },
];
