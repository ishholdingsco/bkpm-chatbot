"use client";
// Mapbox GL JS landing-hero map, ported from content/map-mapbox.jsx.
// Renders Kawasan Industri (industrial estate) + KEK polygons + featured pins
// on top of a Mapbox basemap. Token comes from NEXT_PUBLIC_MAPBOX_TOKEN.

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import industrialData from "@/data/industrial-estates.json";
import kekData from "@/data/kek.json";
import opportunitiesData from "@/data/opportunities.json";

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

// Map a real footprint (hectares) to a display blob radius in km. The blobs are
// stylized markers, not surveyed boundaries, so we scale sqrt(area) into a
// readable 8–38 km range and fall back to a default when area is unknown.
function displayRadiusKm(areaHa, fallback = 16) {
  if (!areaHa) return fallback;
  return Math.max(8, Math.min(38, Math.sqrt(areaHa) * 0.3));
}

// Adapt the static JSON (data/*.json) into the shape the overlay renderer wants.
const MB_PINS = {
  industrial: industrialData.estates.map((e) => ({
    ll: e.coordinates, n: e.name, size: displayRadiusKm(e.area_ha),
  })),
  kek: kekData.estates.map((e) => ({
    ll: e.coordinates, n: e.name, r: displayRadiusKm(e.area_ha, 20),
  })),
  featured: opportunitiesData.opportunities.map((o) => ({
    ll: o.coordinates, k: o.id, label: o.label, ticket: o.ticket,
  })),
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

// Add a GeoJSON source plus its fill + outline layers in one call — the same
// shape repeats per polygon category (industrial estates, KEK, …).
function addPolygonLayer(map, { id, features, fill, line }) {
  map.addSource(id, { type: "geojson", data: { type: "FeatureCollection", features } });
  map.addLayer({ id: `${id}-fill`, type: "fill", source: id, paint: fill });
  map.addLayer({ id: `${id}-line`, type: "line", source: id, paint: line });
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
    geometry: { type: "Polygon", coordinates: [mbBlob(p.ll, p.size, 11, 11 + i * 13)] },
  }));
  addPolygonLayer(map, {
    id: "mb-industrial",
    features: indFeats,
    fill: { "fill-color": "#f7b500", "fill-opacity": 0.55 },
    line: { "line-color": "#b07900", "line-width": 1.2 },
  });

  const kekFeats = MB_PINS.kek.map((p, i) => ({
    type: "Feature",
    properties: { name: p.n, kind: "kek" },
    geometry: { type: "Polygon", coordinates: [mbBlob(p.ll, p.r, 9, 31 + i * 7, 1.1)] },
  }));
  addPolygonLayer(map, {
    id: "mb-kek",
    features: kekFeats,
    fill: { "fill-color": "#7e4dd9", "fill-opacity": 0.30 },
    line: { "line-color": "#5a2eaa", "line-width": 1.2, "line-dasharray": [3, 2] },
  });

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

  // Both polygon layers share a name + category-tag hover popup; only the tag
  // text and accent colour differ.
  const addFillHoverPopup = (layerId, tag, tagColor) => {
    map.on("mouseenter", layerId, (e) => {
      map.getCanvas().style.cursor = "pointer";
      const f = e.features?.[0];
      if (!f) return;
      popup.setLngLat(e.lngLat).setHTML(
        `<div style="font:600 12px/1.3 Inter,system-ui,sans-serif;color:#1a1a2e;">${f.properties.name}</div>
         <div style="font:500 10px/1.4 'IBM Plex Mono',monospace;color:${tagColor};letter-spacing:0.06em;margin-top:2px;">${tag}</div>`
      ).addTo(map);
    });
    map.on("mouseleave", layerId, leave);
    map.on("mousemove", layerId, (e) => popup.setLngLat(e.lngLat));
  };

  addFillHoverPopup("mb-industrial-fill", "KAWASAN INDUSTRI", "#b07900");
  addFillHoverPopup("mb-kek-fill", "SPECIAL ECONOMIC ZONE", "#7e4dd9");
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
