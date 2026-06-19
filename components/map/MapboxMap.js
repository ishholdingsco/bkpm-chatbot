"use client";
// Mapbox GL JS landing-hero map, ported from content/map-mapbox.jsx.
// Renders Kawasan Industri (industrial estate) + KEK polygons + featured pins
// on top of a Mapbox basemap. Token comes from NEXT_PUBLIC_MAPBOX_TOKEN.

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import industrialData from "@/data/industrial-estates.json";
import kekData from "@/data/kek.json";
import opportunitiesData from "@/data/opportunities.json";
import mineralsData from "@/data/minerals.json";
import portsData from "@/data/ports.json";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const DEFAULT_STYLE = "mapbox://styles/mapbox/light-v11";

// Toggle key (LayerPanel `id`) → the Mapbox layer ids it shows/hides. Keys not
// listed here (wiup, gdp, infra) have no point data yet, so their toggles are
// harmless no-ops until those datasets land. Used by the `layers` prop below.
export const MB_LAYER_GROUPS = {
  industrial: ["mb-industrial-fill", "mb-industrial-line"],
  kek: ["mb-kek-fill", "mb-kek-line"],
  minerals: ["mb-minerals-halo", "mb-minerals-dot"],
  ports: ["mb-ports-dot"],
};

// Which LayerPanel toggles actually drive a Mapbox layer (the rest await data).
export const MB_LAYER_KEYS = Object.keys(MB_LAYER_GROUPS);

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
    ll: o.coordinates, k: o.id, label: o.label, ticket: o.ticket, province: o.province, status: o.status,
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

// The featured-opportunity layers we filter when chat highlights a subset.
const FEATURED_LAYERS = ["mb-featured-halo", "mb-featured-ring", "mb-featured-hit"];

const MapboxMap = forwardRef(function MapboxMap({
  center = [118.0, -2.5],
  zoom = 4.0,
  bearing = 0,
  showOverlays = true,
  interactive = true,
  onPinClick,
  deemphasizeOthers = true,
  style,
  layers,
  pinFilter,
}, apiRef) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [errored, setErrored] = useState(false);

  // Imperative handle so the chat (via MapPage) can drive the camera. Exposed
  // once the map exists; methods no-op safely before then. Issue #7.
  useImperativeHandle(apiRef, () => ({
    flyTo(opts) {
      const map = mapRef.current;
      if (map) map.flyTo({ essential: true, ...opts });
    },
    fitBounds(bounds, opts) {
      const map = mapRef.current;
      if (map && bounds) map.fitBounds(bounds, { padding: 80, maxZoom: 8, duration: 1200, ...opts });
    },
    // Map-control buttons (issue #25): the +/−, GPS and compass live in
    // MapScreens but need the real instance, so we expose thin wrappers.
    zoomIn() { mapRef.current?.zoomIn(); },
    zoomOut() { mapRef.current?.zoomOut(); },
    // Compass: bring the camera back to north and flat.
    resetNorth() { mapRef.current?.easeTo({ bearing: 0, pitch: 0 }); },
    // GPS: fly to the browser's geolocation; silently no-op if denied/unavailable.
    locate() {
      const map = mapRef.current;
      if (!map || typeof navigator === "undefined" || !navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => map.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 9, essential: true }),
        () => {}
      );
    },
  }), []);

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

  // Reflect the parent's active-layer state onto the real Mapbox layers. Runs
  // once the map is ready and again whenever `layers` changes, so toggling a
  // pill in LayerPanel shows/hides its layers instantly without a reload.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !layers) return;
    for (const [key, ids] of Object.entries(MB_LAYER_GROUPS)) {
      const visibility = layers[key] ? "visible" : "none";
      ids.forEach((id) => {
        if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visibility);
      });
    }
  }, [ready, layers]);

  // Highlight a subset of featured opportunity pins when chat filters them.
  // `pinFilter.ids` is an array of opportunity ids; null/undefined shows all.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const ids = pinFilter?.ids;
    const filter = Array.isArray(ids) ? ["in", ["get", "kind"], ["literal", ids]] : null;
    FEATURED_LAYERS.forEach((id) => {
      if (map.getLayer(id)) map.setFilter(id, filter);
    });
  }, [ready, pinFilter]);

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
});

export default MapboxMap;

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
    properties: { label: p.label, kind: p.k, ticket: p.ticket || "", province: p.province || "", status: p.status || "" },
    geometry: { type: "Point", coordinates: p.ll },
  }));
  map.addSource("mb-featured", { type: "geojson", data: { type: "FeatureCollection", features: featFeats } });

  map.addLayer({ id: "mb-featured-halo", type: "circle", source: "mb-featured", paint: { "circle-radius": 14, "circle-color": "#c44a36", "circle-opacity": 0.10, "circle-blur": 0.3 } });
  map.addLayer({ id: "mb-featured-hit", type: "circle", source: "mb-featured", paint: { "circle-radius": 20, "circle-color": "#000", "circle-opacity": 0.001 } });
  map.addLayer({ id: "mb-featured-ring", type: "circle", source: "mb-featured", paint: { "circle-radius": 5, "circle-color": "#c44a36", "circle-stroke-color": "#fff", "circle-stroke-width": 1.5 } });

  // Mineral / resource deposit clusters and strategic sea ports. Both start
  // hidden (visibility:none) — they're off by default in LayerPanel and never
  // shown on the public Landing, which renders the map without the `layers`
  // prop. The MB_LAYER_GROUPS effect flips them on when toggled.
  const minFeats = mineralsData.deposits.map((d) => ({
    type: "Feature",
    properties: { name: d.name, commodity: d.commodity, color: d.color || "#e8533f" },
    geometry: { type: "Point", coordinates: d.coordinates },
  }));
  map.addSource("mb-minerals", { type: "geojson", data: { type: "FeatureCollection", features: minFeats } });
  map.addLayer({ id: "mb-minerals-halo", type: "circle", source: "mb-minerals", layout: { visibility: "none" }, paint: { "circle-radius": 13, "circle-color": ["get", "color"], "circle-opacity": 0.18, "circle-blur": 0.3 } });
  map.addLayer({ id: "mb-minerals-dot", type: "circle", source: "mb-minerals", layout: { visibility: "none" }, paint: { "circle-radius": 5, "circle-color": ["get", "color"], "circle-stroke-color": "#fff", "circle-stroke-width": 1.5 } });

  const portFeats = portsData.ports.map((p) => ({
    type: "Feature",
    properties: { name: p.name, kind: p.type, province: p.province },
    geometry: { type: "Point", coordinates: p.coordinates },
  }));
  map.addSource("mb-ports", { type: "geojson", data: { type: "FeatureCollection", features: portFeats } });
  map.addLayer({ id: "mb-ports-dot", type: "circle", source: "mb-ports", layout: { visibility: "none" }, paint: { "circle-radius": 5, "circle-color": "#1a1a2e", "circle-stroke-color": "#fff", "circle-stroke-width": 1.5 } });

  const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 14, className: "mb-tip" });
  const enter = (e) => {
    map.getCanvas().style.cursor = "pointer";
    const f = e.features?.[0];
    if (!f) return;
    const { label, ticket, province, status } = f.properties;
    const chip = (text, color) =>
      `<span style="font:600 8px/1 'IBM Plex Mono',monospace;color:${color};letter-spacing:0.06em;border:1px solid ${color}33;background:${color}14;border-radius:5px;padding:3px 5px;white-space:nowrap;">${text}</span>`;
    const html = `
      ${province ? `<div style="font:500 9px/1.4 'IBM Plex Mono',monospace;color:#8a8a9a;letter-spacing:0.08em;text-transform:uppercase;">${province}</div>` : ""}
      <div style="font:600 12px/1.3 Inter,system-ui,sans-serif;color:#1a1a2e;margin-top:2px;">${label}</div>
      ${ticket || status ? `<div style="display:flex;gap:4px;margin-top:6px;">${ticket ? chip(ticket + " · TICKET", "#e8533f") : ""}${status ? chip(status, "#1a8a5a") : ""}</div>` : ""}
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

  // Point layers (minerals, ports) share a name + tag hover popup anchored to
  // the feature's own coordinates.
  const addPointHoverPopup = (layerId, tagFor, tagColor) => {
    map.on("mouseenter", layerId, (e) => {
      map.getCanvas().style.cursor = "pointer";
      const f = e.features?.[0];
      if (!f) return;
      popup.setLngLat(f.geometry.coordinates.slice()).setHTML(
        `<div style="font:600 12px/1.3 Inter,system-ui,sans-serif;color:#1a1a2e;">${f.properties.name}</div>
         <div style="font:500 10px/1.4 'IBM Plex Mono',monospace;color:${tagColor};letter-spacing:0.06em;margin-top:2px;">${tagFor(f.properties)}</div>`
      ).addTo(map);
    });
    map.on("mouseleave", layerId, leave);
  };

  addPointHoverPopup("mb-minerals-dot", (p) => (p.commodity || "MINERAL").toUpperCase(), "#c08a2e");
  addPointHoverPopup("mb-ports-dot", (p) => (p.kind || "SEA PORT").toUpperCase(), "#1a1a2e");
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
