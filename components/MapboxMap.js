"use client";
// Mapbox GL JS landing-hero map, ported from content/map-mapbox.jsx.
// Renders Kawasan Industri (industrial estate) + KEK polygons + featured pins
// on top of a Mapbox basemap. Token comes from NEXT_PUBLIC_MAPBOX_TOKEN.

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const DEFAULT_STYLE = "mapbox://styles/mapbox/light-v11";

// Mapbox Standard with the "faded" theme — a calmer, monochromatic look.
export const MB_STANDARD_FADED = {
  version: 8,
  imports: [{
    id: "basemap",
    url: "mapbox://styles/mapbox/standard",
    config: {
      theme: "faded",
      lightPreset: "day",
      showPointOfInterestLabels: false,
      showTransitLabels: false,
      showRoadLabels: false,
      show3dObjects: false,
    },
  }],
  sources: {},
  layers: [],
};

const MB_PINS = {
  industrial: [
    { ll: [107.150, -6.260], n: "KIM Cikarang", size: 32, aspect: 1.4 },
    { ll: [110.220, -6.929], n: "Kendal IE", size: 22, aspect: 1.2 },
    { ll: [106.040, -6.020], n: "Cilegon", size: 24, aspect: 1.1 },
    { ll: [112.750, -7.250], n: "Surabaya IE", size: 26, aspect: 1.3 },
    { ll: [108.530, -6.730], n: "KI Subang", size: 20, aspect: 1.2 },
    { ll: [110.050, -6.450], n: "KI Brebes", size: 18, aspect: 1.1 },
    { ll: [99.450, 3.380], n: "Sei Mangkei", size: 20, aspect: 1.0 },
    { ll: [104.770, -3.720], n: "Tj. Api-api", size: 22, aspect: 1.2 },
    { ll: [104.030, 1.050], n: "Batam IE", size: 18, aspect: 1.1 },
    { ll: [100.380, -0.940], n: "KI Padang", size: 18, aspect: 1.0 },
    { ll: [105.260, -5.380], n: "KI Tj. Bintang", size: 20, aspect: 1.1 },
    { ll: [95.330, 5.550], n: "KI Ladong · Aceh", size: 18, aspect: 1.0 },
    { ll: [117.550, 0.500], n: "KIPI Maloy", size: 26, aspect: 1.0 },
    { ll: [114.300, -3.330], n: "KI Batulicin", size: 22, aspect: 1.0 },
    { ll: [109.330, -0.020], n: "KI Mempawah", size: 18, aspect: 1.1 },
    { ll: [121.060, -2.531], n: "IMIP Morowali", size: 38, aspect: 0.9 },
    { ll: [122.620, -3.992], n: "PT VDNI Konawe", size: 30, aspect: 1.0 },
    { ll: [125.190, 1.440], n: "Bitung IE", size: 22, aspect: 1.1 },
    { ll: [119.430, -5.140], n: "KI Makassar", size: 22, aspect: 1.2 },
    { ll: [131.250, -0.880], n: "KI Sorong", size: 26, aspect: 1.1 },
    { ll: [136.080, -2.530], n: "KI Teluk Bintuni", size: 28, aspect: 1.0 },
    { ll: [140.700, -2.530], n: "KI Jayapura", size: 18, aspect: 1.0 },
    { ll: [115.200, -8.610], n: "KI Bali Selatan", size: 14, aspect: 1.1 },
    { ll: [116.450, -8.580], n: "KI Lombok", size: 16, aspect: 1.0 },
    { ll: [123.580, -10.180], n: "KI Kupang", size: 18, aspect: 1.1 },
  ],
  kek: [
    { ll: [98.700, 3.580], n: "KEK Sei Mangkei", r: 30 },
    { ll: [121.060, -2.531], n: "KEK Morowali", r: 38 },
    { ll: [116.830, -1.250], n: "KEK Maloy Batuta", r: 32 },
    { ll: [131.250, -0.880], n: "KEK Sorong", r: 30 },
    { ll: [114.420, -8.190], n: "KEK Singhasari", r: 22 },
    { ll: [104.080, 1.150], n: "KEK Nongsa", r: 18 },
    { ll: [116.270, -8.890], n: "KEK Mandalika", r: 18 },
    { ll: [124.470, -10.170], n: "KEK Tanjung", r: 22 },
    { ll: [115.560, -8.810], n: "KEK Sanur", r: 14 },
    { ll: [134.040, -3.550], n: "KEK Bintuni", r: 30 },
  ],
  featured: [
    { ll: [121.060, -2.531], k: "sulawesi-ni", label: "Nickel midstream · Sulawesi", ticket: "$400M" },
    { ll: [99.450, 3.380], k: "sei-mangkei", label: "Palm + biorefinery · N. Sumatra", ticket: "$220M" },
    { ll: [104.770, -3.720], k: "tj-api-api", label: "Coal-to-DME · S. Sumatra", ticket: "$1.2B" },
    { ll: [104.030, 1.050], k: "batam-dc", label: "Hyperscale data centers · Batam", ticket: "$220M" },
    { ll: [131.250, -0.880], k: "sorong", label: "LNG + petrochem · Sorong", ticket: "$680M" },
    { ll: [136.080, -2.530], k: "bintuni", label: "Methanol · Teluk Bintuni", ticket: "$340M" },
    { ll: [116.270, -8.890], k: "mandalika", label: "Tourism + EV grid · Lombok", ticket: "$180M" },
    { ll: [124.470, -10.170], k: "tanjung-ntt", label: "Aquaculture cluster · NTT", ticket: "$95M" },
    { ll: [140.700, -2.530], k: "jayapura", label: "Cold-chain hub · Jayapura", ticket: "$60M" },
  ],
};

function mbBlob([lng, lat], radiusKm, sides = 11, seed = 1, aspect = 1.0) {
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  let s = (seed * 9301 + 49297) % 233280;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const ring = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    const w = 0.55 + rnd() * 0.55;
    ring.push([lng + Math.cos(a) * dLng * w * aspect, lat + Math.sin(a) * dLat * w]);
  }
  ring.push(ring[0]);
  return ring;
}

export default function MapboxMap({
  center = [118.0, -2.5],
  zoom = 4.0,
  bearing = 0,
  showOverlays = true,
  interactive = true,
  onPinClick,
  deemphasizeOthers = true,
  style,
}) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    if (!MAPBOX_TOKEN) { setErrored(true); return; }

    mapboxgl.accessToken = MAPBOX_TOKEN;
    let map;
    try {
      map = new mapboxgl.Map({
        container: ref.current,
        style: style || DEFAULT_STYLE,
        center, zoom, bearing,
        attributionControl: false,
        interactive,
        preserveDrawingBuffer: true,
        projection: "globe",
      });
    } catch (e) {
      setErrored(true);
      return;
    }
    mapRef.current = map;

    map.on("error", (e) => {
      if (e?.error?.status === 401 || e?.error?.status === 403) setErrored(true);
    });

    map.on("load", () => {
      if (deemphasizeOthers) addCountryMask(map);
      if (showOverlays) addMbOverlays(map, onPinClick);
      setReady(true);
    });

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(ref.current);
    return () => { ro.disconnect(); map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#cfe6f2" }}>
      <div ref={ref} style={{ width: "100%", height: "100%" }} />
      {!ready && !errored && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#5a6b88", fontFamily: "IBM Plex Mono, monospace", fontSize: 11, letterSpacing: "0.12em",
          pointerEvents: "none",
        }}>LOADING ATLAS…</div>
      )}
      {errored && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#a55", fontFamily: "IBM Plex Mono, monospace", fontSize: 11, textAlign: "center", padding: 24,
        }}>MAP FAILED TO LOAD — check NEXT_PUBLIC_MAPBOX_TOKEN</div>
      )}
    </div>
  );
}

function addMbOverlays(map, onPinClick) {
  const indFeats = MB_PINS.industrial.map((p, i) => ({
    type: "Feature",
    properties: { name: p.n, kind: "industrial" },
    geometry: { type: "Polygon", coordinates: [mbBlob(p.ll, p.size, 11, 11 + i * 13, p.aspect)] },
  }));
  map.addSource("mb-industrial", { type: "geojson", data: { type: "FeatureCollection", features: indFeats } });
  map.addLayer({ id: "mb-industrial-fill", type: "fill", source: "mb-industrial", paint: { "fill-color": "#f7b500", "fill-opacity": 0.55 } });
  map.addLayer({ id: "mb-industrial-line", type: "line", source: "mb-industrial", paint: { "line-color": "#b07900", "line-width": 1.2 } });

  const kekFeats = MB_PINS.kek.map((p, i) => ({
    type: "Feature",
    properties: { name: p.n, kind: "kek" },
    geometry: { type: "Polygon", coordinates: [mbBlob(p.ll, p.r, 9, 31 + i * 7, 1.1)] },
  }));
  map.addSource("mb-kek", { type: "geojson", data: { type: "FeatureCollection", features: kekFeats } });
  map.addLayer({ id: "mb-kek-fill", type: "fill", source: "mb-kek", paint: { "fill-color": "#7e4dd9", "fill-opacity": 0.30 } });
  map.addLayer({ id: "mb-kek-line", type: "line", source: "mb-kek", paint: { "line-color": "#5a2eaa", "line-width": 1.2, "line-dasharray": [3, 2] } });

  const featFeats = MB_PINS.featured.map((p) => ({
    type: "Feature",
    properties: { label: p.label, kind: p.k, ticket: p.ticket || "" },
    geometry: { type: "Point", coordinates: p.ll },
  }));
  map.addSource("mb-featured", { type: "geojson", data: { type: "FeatureCollection", features: featFeats } });

  map.addLayer({ id: "mb-featured-halo", type: "circle", source: "mb-featured", paint: { "circle-radius": 14, "circle-color": "#c44a36", "circle-opacity": 0.10, "circle-blur": 0.3 } });
  map.addLayer({ id: "mb-featured-hit", type: "circle", source: "mb-featured", paint: { "circle-radius": 20, "circle-color": "#000", "circle-opacity": 0.001 } });
  map.addLayer({ id: "mb-featured-ring", type: "circle", source: "mb-featured", paint: { "circle-radius": 5, "circle-color": "#c44a36", "circle-stroke-color": "#fff", "circle-stroke-width": 1.5 } });

  const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 14, className: "mb-tip" });
  const enter = (e) => {
    map.getCanvas().style.cursor = "pointer";
    const f = e.features?.[0];
    if (!f) return;
    const { label, ticket } = f.properties;
    const html = `
      <div style="font:600 12px/1.3 Inter,system-ui,sans-serif;color:#1a1a2e;">${label}</div>
      ${ticket ? `<div style="font:500 10px/1.4 'IBM Plex Mono',monospace;color:#e8533f;letter-spacing:0.06em;margin-top:2px;">${ticket} · TICKET</div>` : ""}
    `;
    popup.setLngLat(f.geometry.coordinates.slice()).setHTML(html).addTo(map);
  };
  const leave = () => { map.getCanvas().style.cursor = ""; popup.remove(); };
  ["mb-featured-hit", "mb-featured-ring"].forEach((id) => {
    map.on("mouseenter", id, enter);
    map.on("mouseleave", id, leave);
    map.on("click", id, (e) => {
      const k = e.features?.[0]?.properties?.kind;
      if (k && onPinClick) onPinClick(k);
    });
  });

  map.on("mouseenter", "mb-industrial-fill", (e) => {
    map.getCanvas().style.cursor = "pointer";
    const f = e.features?.[0];
    if (!f) return;
    popup.setLngLat(e.lngLat).setHTML(
      `<div style="font:600 12px/1.3 Inter,system-ui,sans-serif;color:#1a1a2e;">${f.properties.name}</div>
       <div style="font:500 10px/1.4 'IBM Plex Mono',monospace;color:#b07900;letter-spacing:0.06em;margin-top:2px;">KAWASAN INDUSTRI</div>`
    ).addTo(map);
  });
  map.on("mouseleave", "mb-industrial-fill", leave);
  map.on("mousemove", "mb-industrial-fill", (e) => popup.setLngLat(e.lngLat));

  map.on("mouseenter", "mb-kek-fill", (e) => {
    map.getCanvas().style.cursor = "pointer";
    const f = e.features?.[0];
    if (!f) return;
    popup.setLngLat(e.lngLat).setHTML(
      `<div style="font:600 12px/1.3 Inter,system-ui,sans-serif;color:#1a1a2e;">${f.properties.name}</div>
       <div style="font:500 10px/1.4 'IBM Plex Mono',monospace;color:#7e4dd9;letter-spacing:0.06em;margin-top:2px;">SPECIAL ECONOMIC ZONE</div>`
    ).addTo(map);
  });
  map.on("mouseleave", "mb-kek-fill", leave);
  map.on("mousemove", "mb-kek-fill", (e) => popup.setLngLat(e.lngLat));
}

// De-emphasize non-Indonesia using Mapbox's real country-boundaries source.
function addCountryMask(map) {
  if (!map.getSource("mb-countries")) {
    map.addSource("mb-countries", { type: "vector", url: "mapbox://mapbox.country-boundaries-v1" });
  }
  let firstSymbol;
  try {
    for (const l of map.getStyle().layers || []) { if (l.type === "symbol") { firstSymbol = l.id; break; } }
  } catch (e) { /* style import may not expose layers */ }
  try {
    map.addLayer({
      id: "mb-mask-fill",
      type: "fill",
      source: "mb-countries",
      "source-layer": "country_boundaries",
      filter: ["!=", ["get", "iso_3166_1_alpha_3"], "IDN"],
      paint: { "fill-color": "#e8e2d0", "fill-opacity": 0.78 },
    }, firstSymbol);
  } catch (e) { /* layer may already exist or style not ready */ }
}
