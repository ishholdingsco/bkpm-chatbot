// Shared vocabulary for the chat <-> map integration (issue #7, WandeRound
// pattern). PLAIN module — no "use client", no mapbox/browser imports — so it
// can be used both by the server route (the tool *definitions* sent to DeepSeek)
// and by the client (the *executors* that drive the real Mapbox map).

import opportunitiesData from "@/data/opportunities.json";
import mineralsData from "@/data/minerals.json";
import industrialData from "@/data/industrial-estates.json";
import kekData from "@/data/kek.json";
import portsData from "@/data/ports.json";
import logamData from "@/data/mineral-logam.json";
import iupData from "@/data/iup-tambang.json";
import kawasanHutanData from "@/data/kawasan-hutan.json";
import geologiData from "@/data/geologi-litologi.json";

// Layers that actually carry point/polygon data and can be toggled. Mirrors
// MB_LAYER_GROUPS in MapboxMap.js (wiup/gdp/infra have no data yet, so the
// assistant must not pretend to toggle them).
export const MAP_LAYER_IDS = ["industrial", "kek", "featured", "minerals", "logam", "iup", "hutan", "geologi", "ports"];

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
  // IUP concession centroids so fly_to("Kalimantan Timur" / "batubara") frames
  // the real permits in that province/commodity (logam points are too dense to
  // add here — they'd over-broaden every region match).
  ...iupData.features.map((f) => ({ coordinates: polyCentroid(f.geometry), hay: [f.properties.prov, f.properties.commodity, f.properties.kab, f.properties.company] })),
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

// ─── Mining layers (IUP concessions + metal-mineral points) ───

// Normalise a free-text commodity to the canonical value stored in the data
// (IUP uses "Batubara"/"Nikel"/"Besi"; logam uses "Nikel" + "Besi *"/"Pasir Besi").
const COMMODITY_ALIASES = {
  nikel: "Nikel", nickel: "Nikel", ni: "Nikel",
  besi: "Besi", iron: "Besi", fe: "Besi", "pasir besi": "Besi",
  batubara: "Batubara", "batu bara": "Batubara", coal: "Batubara", c: "Batubara",
};
function canonCommodity(s) {
  const q = norm(s);
  if (!q) return null;
  if (COMMODITY_ALIASES[q]) return COMMODITY_ALIASES[q];
  for (const [k, v] of Object.entries(COMMODITY_ALIASES)) if (q.includes(k)) return v;
  return null;
}

// Centroid of a Polygon/MultiPolygon outer ring — good enough to frame the map.
function polyCentroid(geom) {
  const ring = geom.type === "Polygon" ? geom.coordinates[0] : geom.coordinates[0][0];
  let x = 0, y = 0;
  for (const [lng, lat] of ring) { x += lng; y += lat; }
  return [x / ring.length, y / ring.length];
}

// Does a logam point's commodity match a canonical commodity? (logam has only
// Nikel + the Besi family; never coal.)
function logamMatches(c, commodity) {
  if (!commodity) return true;
  if (commodity === "Nikel") return c === "Nikel";
  if (commodity === "Besi") return /besi/i.test(c);
  return false; // Batubara → logam has none
}

// Resolve a filter_mining call → which layers matched, the canonical
// commodity/province to push into a Mapbox setFilter, framing coords/bounds,
// and a human label. The client applies the real filter + camera (see MapPage).
export function selectMining(args = {}) {
  if (args.clear) return { clear: true, layers: [], commodity: null, province: null, coords: [], bounds: null, count: 0, label: null };

  const dataset = norm(args.dataset) || "both";
  const commodity = canonCommodity(args.commodity);
  const provinceQ = norm(args.province);
  const wantIup = dataset === "iup" || dataset === "both";
  // logam has no province field & no coal → skip it for province or coal queries.
  const wantLogam = (dataset === "logam" || dataset === "both") && !provinceQ && commodity !== "Batubara";

  const coords = [];
  const layers = [];
  let count = 0;
  let provinceApplied = false;

  // IUP polygons. The layer is ALWAYS turned on when requested (so the toggle
  // reliably reflects the chat), and a province that matches nothing (typo /
  // abbreviation like "Kaltim") gracefully relaxes to a commodity-only view.
  if (wantIup) {
    layers.push("iup");
    let m = iupData.features.filter((f) =>
      (!commodity || f.properties.commodity === commodity) &&
      (!provinceQ || norm(f.properties.prov).includes(provinceQ)));
    if (provinceQ && m.length) provinceApplied = true;
    else if (provinceQ) m = iupData.features.filter((f) => !commodity || f.properties.commodity === commodity);
    count += m.length;
    for (const f of m) coords.push(polyCentroid(f.geometry));
  }

  if (wantLogam) {
    layers.push("logam");
    const m = logamData.features.filter((f) => logamMatches(f.properties.commodity, commodity));
    count += m.length;
    for (const f of m) coords.push(f.geometry.coordinates);
  }

  const parts = [];
  if (commodity) parts.push(commodity);
  if (provinceApplied) parts.push(titleCase(args.province));
  const scope = layers.includes("iup") && !layers.includes("logam") ? "IUP" : layers.includes("logam") && !layers.includes("iup") ? "Mineral Logam" : "Tambang";
  const label = `${scope}${parts.length ? " · " + parts.join(" · ") : ""}`;

  return { clear: false, layers, commodity, province: provinceApplied ? provinceQ : null, coords, bounds: coords.length ? boundsOf(coords) : null, count, label };
}

// ─── Kawasan hutan (forest-function areas, vectorized from the KLHK raster) ───

// The forest-function classes carried by data/kawasan-hutan.json. `aliases` let
// the assistant pass natural language ("lindung", "konversi", "HPT"). NOTE: the
// data is raster-derived and has NO province attribute — function filter only.
const HUTAN_CLASSES = [
  { id: "hl",  code: "HL",      fungsi: "Hutan Lindung",                          aliases: ["lindung", "protected", "protection"] },
  { id: "hk",  code: "KSA-KPA", fungsi: "Hutan Konservasi (KSA/KPA)",             aliases: ["konservasi", "conservation", "ksa", "kpa", "suaka", "taman nasional", "cagar"] },
  { id: "hpt", code: "HPT",     fungsi: "Hutan Produksi Terbatas",               aliases: ["produksi terbatas", "terbatas", "limited production"] },
  { id: "hp",  code: "HP",      fungsi: "Hutan Produksi Tetap",                  aliases: ["produksi tetap", "tetap", "permanent production"] },
  { id: "hpk", code: "HPK",     fungsi: "Hutan Produksi yg Dapat Dikonversi",    aliases: ["konversi", "dikonversi", "convertible", "convert"] },
];

// Match a free-text forest function to its class(es). "produksi" alone matches
// all three production classes (their `fungsi` contains it); "" matches nothing.
function matchHutan(q) {
  const s = norm(q);
  if (!s) return [];
  return HUTAN_CLASSES.filter((c) =>
    [c.id, c.code, c.fungsi, ...c.aliases].map(norm).some((h) => h && (h.includes(s) || s.includes(h))));
}

// Push every [lng,lat] vertex of a GeoJSON geometry into `out` (recursing
// through Polygon / MultiPolygon nesting). Used only to compute a framing bbox.
function collectCoords(geom, out) {
  const walk = (a) => {
    if (typeof a[0] === "number") { out.push(a); return; }
    for (const x of a) walk(x);
  };
  if (geom && geom.coordinates) walk(geom.coordinates);
}

// ─ Region → clip box. We have no province boundaries, so we approximate a
// region's extent from the coordinates we DO have: the data points tagged with
// that region (IUP/opportunities/etc., via regionCoords). Where that's too
// sparse (e.g. Papua has no IUP), we fall back to the REGIONS registry's
// hand-tuned center+zoom. Returns [[minLng,minLat],[maxLng,maxLat]] or null.
function spanForZoom(z) {
  return 360 / Math.pow(2, z); // ≈ visible longitude width at that zoom
}
function getRegionClipBounds(region) {
  const coords = regionCoords(region);
  if (coords.length >= 4) {
    const b = boundsOf(coords);
    const dx = b[1][0] - b[0][0], dy = b[1][1] - b[0][1];
    const px = Math.max(dx * 0.15, 0.4), py = Math.max(dy * 0.15, 0.4); // pad the cluster
    return [[b[0][0] - px, b[0][1] - py], [b[1][0] + px, b[1][1] + py]];
  }
  const r = norm(region);
  const known = REGIONS[r] || REGIONS[Object.keys(REGIONS).find((k) => r.includes(k) || k.includes(r))];
  if (known && known.center) {
    const halfLng = (spanForZoom(known.zoom) / 2) * 1.05;
    const halfLat = halfLng * 0.7;
    const [lng, lat] = known.center;
    return [[lng - halfLng, lat - halfLat], [lng + halfLng, lat + halfLat]];
  }
  return null;
}

// ─ Sutherland–Hodgman clip of one ring against an axis-aligned rectangle. The
// rect is convex, so this is exact even for concave rings. Ring is [lng,lat]…
// (GeoJSON closes first==last; we strip then re-close). Returns null if nothing
// survives.
function clipRingToRect(ring, [[minX, minY], [maxX, maxY]]) {
  let pts = ring.slice(0, -1); // drop duplicate closing vertex
  const edge = (inside, isect) => {
    if (!pts.length) return;
    const res = [];
    for (let i = 0; i < pts.length; i++) {
      const cur = pts[i], prev = pts[(i + pts.length - 1) % pts.length];
      const ci = inside(cur), pi = inside(prev);
      if (ci) { if (!pi) res.push(isect(prev, cur)); res.push(cur); }
      else if (pi) res.push(isect(prev, cur));
    }
    pts = res;
  };
  const lx = (a, b, x) => { const t = (x - a[0]) / (b[0] - a[0]); return [x, a[1] + t * (b[1] - a[1])]; };
  const ly = (a, b, y) => { const t = (y - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), y]; };
  edge((p) => p[0] >= minX, (a, b) => lx(a, b, minX));
  edge((p) => p[0] <= maxX, (a, b) => lx(a, b, maxX));
  edge((p) => p[1] >= minY, (a, b) => ly(a, b, minY));
  edge((p) => p[1] <= maxY, (a, b) => ly(a, b, maxY));
  if (pts.length < 3) return null;
  pts.push(pts[0]); // re-close
  return pts;
}

// Clip a Polygon/MultiPolygon GeoJSON geometry to a rect; null if fully outside.
function clipGeometryToRect(geom, rect) {
  const clipPoly = (poly) => {
    const outer = clipRingToRect(poly[0], rect);
    if (!outer) return null;
    const rings = [outer];
    for (let i = 1; i < poly.length; i++) { const h = clipRingToRect(poly[i], rect); if (h) rings.push(h); }
    return rings;
  };
  if (geom.type === "Polygon") {
    const p = clipPoly(geom.coordinates);
    return p ? { type: "Polygon", coordinates: p } : null;
  }
  const polys = geom.coordinates.map(clipPoly).filter(Boolean);
  return polys.length ? { type: "MultiPolygon", coordinates: polys } : null;
}

// Resolve a filter_kawasan_hutan call → the layer to show, the class ids to keep
// (null = show all functions), a camera `frame`, and a label. The client turns
// the 'hutan' layer ON, pushes the Mapbox setFilter, and frames the result.
//
// `region` only moves the camera: the data is nationwide with NO province field,
// so we can't clip the forest to a province — but when the user says "hutan
// lindung di Papua" we still zoom to Papua (frame from the REGIONS registry)
// while showing all national HL. Without a region we frame the whole extent of
// the matched function(s).
export function selectKawasanHutan(args = {}) {
  if (args.clear) return { clear: true, layers: [], ids: null, frame: null, data: null, count: 0, label: null };

  const matched = matchHutan(args.fungsi);
  const classes = matched.length ? matched : HUTAN_CLASSES;
  const ids = matched.length ? matched.map((c) => c.id) : null; // null → all functions
  const wantIds = new Set(classes.map((c) => c.id));
  const feats = kawasanHutanData.features.filter((f) => wantIds.has(f.properties.id));

  let frame = null, data = null, regionLabel = null;
  if (args.region) {
    const clip = getRegionClipBounds(args.region);
    const fly = resolveFlyTo({ region: args.region });
    regionLabel = fly?.label || null;
    if (clip) {
      // Clip each matched function to the region box → forest shows only there.
      const clipped = [];
      for (const f of feats) {
        const g = clipGeometryToRect(f.geometry, clip);
        if (g) clipped.push({ type: "Feature", properties: f.properties, geometry: g });
      }
      data = { type: "FeatureCollection", features: clipped };
      frame = { bounds: clip };
    } else {
      frame = fly; // unknown region → can't clip, just frame what we can
    }
  } else {
    // No region → whole national extent of the matched function(s).
    const coords = [];
    for (const f of feats) collectCoords(f.geometry, coords);
    frame = coords.length ? { bounds: boundsOf(coords) } : null;
  }

  const parts = [];
  if (matched.length) parts.push(matched.map((c) => c.fungsi).join(" · "));
  if (regionLabel) parts.push(regionLabel);
  const label = "Kawasan Hutan" + (parts.length ? " · " + parts.join(" · ") : "");
  return { clear: false, layers: ["hutan"], ids, frame, data, count: classes.length, label };
}

// ─── Geologi litologi (major rock-type groups, vectorized from the ESDM raster) ───

// Lithology groups carried by data/geologi-litologi.json. `aliases` let the
// assistant pass natural language (EN & ID). NOTE: raster-derived, NO province
// attribute — group filter only. Group assignment is best-effort from formation
// names, and many formations land in "other" (undifferentiated).
const GEOLOGI_GROUPS = [
  { id: "alluvium",    litologi: "Aluvium & Endapan Permukaan", aliases: ["aluvium", "alluvium", "endapan", "sedimen lepas", "tanah", "soil", "quaternary deposit"] },
  { id: "volcanic",    litologi: "Batuan Gunungapi",            aliases: ["gunungapi", "gunung api", "vulkanik", "volcanic", "lava", "tuf", "andesit", "basalt", "breksi"] },
  { id: "limestone",   litologi: "Batugamping & Karbonat",      aliases: ["batugamping", "gamping", "limestone", "karbonat", "carbonate", "dolomit", "terumbu", "reef"] },
  { id: "clastic",     litologi: "Batuan Sedimen Klastik",      aliases: ["sedimen klastik", "clastic", "batupasir", "sandstone", "batulempung", "serpih", "shale", "konglomerat"] },
  { id: "intrusive",   litologi: "Batuan Terobosan (Intrusi)",  aliases: ["terobosan", "intrusi", "intrusive", "granit", "granite", "diorit", "plutonik", "plutonic", "batolit"] },
  { id: "metamorphic", litologi: "Batuan Malihan (Metamorf)",   aliases: ["malihan", "metamorf", "metamorphic", "sekis", "schist", "gneis", "marmer", "marble", "filit", "bancuh", "melange"] },
  { id: "ultramafic",  litologi: "Batuan Ultramafik & Mafik",   aliases: ["ultramafik", "ultramafic", "ultrabasa", "peridotit", "ofiolit", "ophiolite", "serpentinit", "gabro", "mafik"] },
  { id: "other",       litologi: "Formasi / Batuan Tak Terinci", aliases: ["lain", "lainnya", "tak terinci", "undifferentiated", "other", "formasi"] },
];

// Match free-text lithology to its group(s). "" matches nothing (= show all).
function matchGeologi(q) {
  const s = norm(q);
  if (!s) return [];
  return GEOLOGI_GROUPS.filter((c) =>
    [c.id, c.litologi, ...c.aliases].map(norm).some((h) => h && (h.includes(s) || s.includes(h))));
}

// Resolve a filter_geologi call → the layer to show, group ids to keep (null =
// all), a camera `frame`, and a label. Mirrors selectKawasanHutan exactly: the
// data is nationwide with NO province field, so `region` clips to an APPROXIMATE
// rectangular extent (and moves the camera) but cannot follow province borders.
export function selectGeologi(args = {}) {
  if (args.clear) return { clear: true, layers: [], ids: null, frame: null, data: null, count: 0, label: null };

  const matched = matchGeologi(args.litologi);
  const groups = matched.length ? matched : GEOLOGI_GROUPS;
  const ids = matched.length ? matched.map((c) => c.id) : null; // null → all groups
  const wantIds = new Set(groups.map((c) => c.id));
  const feats = geologiData.features.filter((f) => wantIds.has(f.properties.id));

  let frame = null, data = null, regionLabel = null;
  if (args.region) {
    const clip = getRegionClipBounds(args.region);
    const fly = resolveFlyTo({ region: args.region });
    regionLabel = fly?.label || null;
    if (clip) {
      const clipped = [];
      for (const f of feats) {
        const g = clipGeometryToRect(f.geometry, clip);
        if (g) clipped.push({ type: "Feature", properties: f.properties, geometry: g });
      }
      data = { type: "FeatureCollection", features: clipped };
      frame = { bounds: clip };
    } else {
      frame = fly;
    }
  } else {
    const coords = [];
    for (const f of feats) collectCoords(f.geometry, coords);
    frame = coords.length ? { bounds: boundsOf(coords) } : null;
  }

  const parts = [];
  if (matched.length) parts.push(matched.map((c) => c.litologi).join(" · "));
  if (regionLabel) parts.push(regionLabel);
  const label = "Geologi" + (parts.length ? " · " + parts.join(" · ") : "");
  return { clear: false, layers: ["geologi"], ids, frame, data, count: groups.length, label };
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
        "Show or hide map data layers. Available layer ids: industrial (Kawasan Industri / industrial estates), kek (Special Economic Zones / KEK), featured (BKPM featured investment opportunities — the blue pins), minerals (mineral & mining deposit clusters), logam (metal-mineral occurrence points — nickel & iron, 900+ points), iup (mining business permit / IUP concession polygons — coal, nickel, iron), hutan (kawasan hutan / forest-function areas — KLHK, nationwide: Hutan Lindung, Konservasi, Produksi), geologi (geology / lithology — major rock-type groups, nationwide: volcanic, limestone, intrusive, alluvium, etc.), ports (strategic sea ports). Use `only` to show exactly one set and hide all others.",
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
  {
    type: "function",
    function: {
      name: "filter_mining",
      description:
        "Filter, show and zoom the mining layers on the map: IUP/IUPK/PKP2B concession polygons (commodities: coal/Batubara, nickel/Nikel, iron/Besi) and/or metal-mineral occurrence points (nickel & iron only). It automatically turns the matching layer(s) ON and frames them. Use when the user asks to see mining permits/IUP/concessions, or a specific commodity's or province's mining areas. Pass clear:true to remove the filter.",
      parameters: {
        type: "object",
        properties: {
          dataset: { type: "string", enum: ["iup", "logam", "both"], description: "'iup' = permit concession polygons, 'logam' = metal-mineral points, 'both' = both. Default both." },
          commodity: { type: "string", description: "Batubara/coal, Nikel/nickel, or Besi/iron." },
          province: { type: "string", description: "Indonesian province, e.g. 'Kalimantan Timur', 'Sulawesi Tengah'. Applies to IUP concessions only (logam points have no province)." },
          clear: { type: "boolean", description: "True to clear the mining filter and show all features again." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "filter_kawasan_hutan",
      description:
        "Show, filter and zoom the forest-area (kawasan hutan) layer — KLHK forest-function zones, nationwide, vectorized into polygons: Hutan Lindung (HL), Hutan Konservasi/KSA-KPA, Hutan Produksi Terbatas (HPT), Hutan Produksi Tetap (HP), Hutan Produksi yang dapat Dikonversi (HPK). It automatically turns the 'hutan' layer ON and frames the result. IMPORTANT: this is thematic raster-derived data with NO province attribute — filter by forest function only, never by province. Omit `fungsi` to show all functions. Pass clear:true to hide/clear the filter.",
      parameters: {
        type: "object",
        properties: {
          fungsi: { type: "string", description: "Forest function to isolate: 'lindung'/HL, 'konservasi'/KSA-KPA, 'produksi terbatas'/HPT, 'produksi tetap'/HP, 'konversi'/HPK. 'produksi' alone shows all three production classes. Omit to show every function." },
          region: { type: "string", description: "Optional region/province to focus on, e.g. 'Papua', 'Kalimantan', 'Kalimantan Selatan', 'Sulawesi'. Pass it whenever the user names a place. The map zooms there AND restricts the displayed forest to that region's area. NOTE: the forest data has no province field, so the restriction is an APPROXIMATE rectangular extent (derived from known data points / a region registry), not an exact province boundary — say so if precision matters." },
          clear: { type: "boolean", description: "True to clear the filter and show all forest functions again." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "filter_geologi",
      description:
        "Show, filter and zoom the geology / lithology (geologi litologi) layer — major rock-type groups vectorized from the ESDM Badan Geologi raster: Aluvium & Endapan Permukaan, Batuan Gunungapi (volcanic), Batugamping & Karbonat (limestone), Batuan Sedimen Klastik (clastic), Batuan Terobosan/Intrusi (intrusive), Batuan Malihan/Metamorf (metamorphic), Batuan Ultramafik & Mafik, and Formasi/Batuan Tak Terinci (undifferentiated). It automatically turns the 'geologi' layer ON and frames the result. IMPORTANT: this is thematic raster-derived data with NO province attribute — filter by rock-type group only, never by province; group assignment is best-effort (many formations land in 'undifferentiated'). Omit `litologi` to show all groups. Pass clear:true to hide/clear the filter.",
      parameters: {
        type: "object",
        properties: {
          litologi: { type: "string", description: "Rock-type group to isolate: 'aluvium'/alluvium, 'gunungapi'/volcanic, 'batugamping'/limestone, 'klastik'/sedimentary clastic, 'intrusi'/intrusive, 'malihan'/metamorphic, 'ultramafik'/ultramafic. Omit to show every group." },
          region: { type: "string", description: "Optional region/province to focus on, e.g. 'Sulawesi', 'Kalimantan', 'Papua'. Pass it whenever the user names a place. The map zooms there AND restricts the displayed geology to that region's area. NOTE: the data has no province field, so the restriction is an APPROXIMATE rectangular extent, not an exact province boundary — say so if precision matters." },
          clear: { type: "boolean", description: "True to clear the filter and show all lithology groups again." },
        },
      },
    },
  },
];
