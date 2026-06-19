/* global React, L */
// Real Leaflet + OSM Indonesia map, drop-in replacement for IndonesiaMap.
// Uses Carto Positron / Voyager basemaps for a clean, restrained cartographic look
// that fits the BKPM design system (warm neutrals, low-saturation).

const { useEffect: useEffectMap, useRef: useRefMap, useState: useStateLM } = React;

// ─── Generate an irregular polygon around a center point.
// Used to fake plausible Kawasan Industri / KEK boundary shapes
// without shipping real GeoJSON. Deterministic per-seed so reloads are stable.
function blobPoly([lat, lng], radiusKm, sides = 11, seed = 1, aspect = 1.0) {
  // 1 deg lat ≈ 111 km; 1 deg lng ≈ 111 * cos(lat) km
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
  // simple LCG for reproducible jitter
  let s = (seed * 9301 + 49297) % 233280;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    const wobble = 0.55 + rnd() * 0.55; // 0.55–1.10 of nominal radius
    pts.push([
      lat + Math.sin(a) * dLat * wobble,
      lng + Math.cos(a) * dLng * wobble * aspect,
    ]);
  }
  return pts;
}

// ─── Real lat/lng for the layers (representative anchors, not exhaustive) ───
const PINS = {
  industrial: [
    { ll: [-6.260, 107.150], n: 'KIM Cikarang', t: 'Greater Jakarta',         size: 14, aspect: 1.4 },
    { ll: [-6.929, 110.220], n: 'Kendal IE',    t: 'Central Java',            size: 8,  aspect: 1.2 },
    { ll: [-6.020, 106.040], n: 'Cilegon',      t: 'Banten',                  size: 9,  aspect: 1.1 },
    { ll: [-7.250, 112.750], n: 'Surabaya IE',  t: 'East Java',               size: 10, aspect: 1.3 },
    { ll: [ 3.380,  99.450], n: 'Sei Mangkei',  t: 'North Sumatra',           size: 7,  aspect: 1.0 },
    { ll: [-3.720, 104.770], n: 'Tj. Api-api',  t: 'South Sumatra',           size: 8,  aspect: 1.2 },
    { ll: [-2.531, 121.060], n: 'IMIP Morowali',t: 'Central Sulawesi · Featured', size: 16, aspect: 0.9 },
    { ll: [ 1.050, 104.030], n: 'Batam IE',     t: 'Riau Islands',            size: 6,  aspect: 1.1 },
  ],
  kek: [
    { ll: [ 3.580,  98.700], n: 'KEK Sei Mangkei' },
    { ll: [-2.531, 121.060], n: 'KEK Morowali'    },
    { ll: [-1.250, 116.830], n: 'KEK Maloy Batuta'},
    { ll: [-0.880, 131.250], n: 'KEK Sorong'      },
    { ll: [-8.190, 114.420], n: 'KEK Singhasari'  },
    { ll: [ 1.150, 104.080], n: 'KEK Nongsa'      },
  ],
  // WIUP — concession blobs (lat, lng, radius_km)
  wiup: [
    { ll: [-2.500, 121.100], r: 60,  label: 'Sulawesi nickel belt' },
    { ll: [-3.700, 122.500], r: 50,  label: 'SE Sulawesi nickel'   },
    { ll: [-0.500, 116.000], r: 90,  label: 'East Kal. coal'        },
    { ll: [-2.800, 115.300], r: 70,  label: 'South Kal. coal'       },
    { ll: [-2.000,  99.500], r: 50,  label: 'West Sumatra'          },
  ],
  minerals: [
    { ll: [-2.531, 121.060], k: 'Ni',     c: '#e8533f' },
    { ll: [-3.992, 122.515], k: 'Ni',     c: '#e8533f' },
    { ll: [-4.080, 137.110], k: 'Cu+Au',  c: '#c8a13a' }, // Grasberg
    { ll: [ 0.180, 109.990], k: 'Bauxite',c: '#7e4dd9' },
    { ll: [-0.980, 116.350], k: 'Coal',   c: '#1a1a2e' },
    { ll: [-2.700, 115.500], k: 'Coal',   c: '#1a1a2e' },
    { ll: [-2.080, 106.110], k: 'Tin',    c: '#5a5a6e' },
  ],
  ports: [
    { ll: [-6.105, 106.880], n: 'Tj. Priok'   },
    { ll: [-7.200, 112.730], n: 'Tj. Perak'   },
    { ll: [ 3.789,  98.687], n: 'Belawan'     },
    { ll: [ 1.440, 125.190], n: 'Bitung'      },
    { ll: [-1.270, 116.830], n: 'Balikpapan'  },
    { ll: [-0.880, 131.250], n: 'Sorong'      },
  ],
  // Power corridor — line strung through real cities
  infra: [
    [ 3.789,  98.687], // Medan
    [-2.000,  99.500], // West Sumatra
    [-3.720, 104.770], // South Sumatra
    [-6.105, 106.880], // Jakarta
    [-7.200, 112.730], // Surabaya
    [-8.650, 115.220], // Bali
    [-1.270, 116.830], // Balikpapan
    [-2.531, 121.060], // Morowali
    [ 1.440, 125.190], // Bitung
    [-0.880, 131.250], // Sorong
  ],
  featured: [
    { ll: [-2.531, 121.060], k: 'sulawesi-ni', c: '#b94a1f' },
    { ll: [ 3.380,  99.450], k: 'sei-mangkei', c: '#2f6a4f' },
    { ll: [-3.720, 104.770], k: 'tj-api-api',  c: '#4264fb' },
  ],
};

// GDP per capita choropleth — coarse "island" rectangles approximated with bbox.
// Real choropleths need GeoJSON; for mockup fidelity we tint major archipelago regions.
const GDP_REGIONS = [
  { name: 'Java',       bbox: [[-9.0, 105.0],[-5.7, 114.6]], color: '#4264fb', op: 0.32 },
  { name: 'Bali',       bbox: [[-8.9, 114.4],[-8.0, 115.7]], color: '#4264fb', op: 0.30 },
  { name: 'Sumatra',    bbox: [[-6.0,  95.0],[ 6.0, 106.0]], color: '#a3b5ff', op: 0.28 },
  { name: 'Kalimantan', bbox: [[-4.2, 108.8],[ 4.2, 119.0]], color: '#7892ff', op: 0.30 },
  { name: 'Sulawesi',   bbox: [[-6.0, 118.5],[ 2.0, 125.5]], color: '#c9d2ff', op: 0.32 },
  { name: 'Maluku',     bbox: [[-8.5, 124.0],[ 2.5, 135.0]], color: '#dde2ff', op: 0.28 },
  { name: 'NTB+NTT',    bbox: [[-11.0, 116.0],[-8.0, 125.5]], color: '#dde2ff', op: 0.30 },
  { name: 'Papua',      bbox: [[-9.0, 130.5],[ 0.5, 141.0]], color: '#7892ff', op: 0.28 },
];

// Default Indonesia view — frames the whole archipelago
const ID_BOUNDS = [[-11.5, 94.5], [7.5, 142.0]];
const ID_CENTER = [-2.5, 118.0];

function LeafletMap({
  overlays = {},
  onPinClick,
  // viewport tuning
  center = ID_CENTER,
  zoom = null,           // if null, fitBounds(ID_BOUNDS)
  bounds = null,         // override bounds
  basemap = 'positron',  // 'positron' | 'voyager' | 'dark'
  interactive = true,
  showLabels = true,
}) {
  const ref = useRefMap(null);
  const mapRef = useRefMap(null);
  const layersRef = useRefMap({});

  // init once
  useEffectMap(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, {
      zoomControl: false,
      attributionControl: false,
      // Smoother wheel zoom: smaller increments, longer debounce, more wheel travel per level
      zoomSnap: 0,
      zoomDelta: 0.5,
      wheelDebounceTime: 60,
      wheelPxPerZoomLevel: 140,
      zoomAnimation: true,
      fadeAnimation: true,
      inertia: true,
      preferCanvas: true,
      worldCopyJump: false,
      // interactivity
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
    });
    mapRef.current = map;

    const tileUrls = {
      positron: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
      positronLabels: 'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',
      voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
      voyagerLabels: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
      dark: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
      darkLabels: 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
    };
    const baseKey = basemap;
    L.tileLayer(tileUrls[baseKey] || tileUrls.positron, {
      maxZoom: 12, minZoom: 3,
      subdomains: 'abcd',
    }).addTo(map);

    if (zoom != null) map.setView(center, zoom);
    else map.fitBounds(bounds || ID_BOUNDS, { padding: [10, 10] });

    // Optional labels overlay (drawn on top of overlays so place names stay legible)
    if (showLabels) {
      const lk = baseKey === 'dark' ? 'darkLabels' : baseKey === 'voyager' ? 'voyagerLabels' : 'positronLabels';
      const labels = L.tileLayer(tileUrls[lk], { maxZoom: 12, minZoom: 3, subdomains: 'abcd', pane: 'shadowPane' });
      labels.addTo(map);
    }

    // resize handling
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(ref.current);
    return () => { ro.disconnect(); map.remove(); mapRef.current = null; };
  // eslint-disable-next-line
  }, []);

  // overlays — rebuild on every change (cheap; small N)
  useEffectMap(() => {
    const map = mapRef.current;
    if (!map) return;
    Object.values(layersRef.current).forEach(g => map.removeLayer(g));
    layersRef.current = {};

    const add = (key, layer) => { layer.addTo(map); layersRef.current[key] = layer; };

    // GDP choropleth
    if (overlays.gdp) {
      const g = L.layerGroup();
      GDP_REGIONS.forEach(r => {
        L.rectangle(r.bbox, {
          color: r.color, weight: 0, fillColor: r.color, fillOpacity: r.op,
          interactive: false,
        }).addTo(g);
      });
      add('gdp', g);
    }

    // WIUP — concession circles
    if (overlays.wiup) {
      const g = L.layerGroup();
      PINS.wiup.forEach(p => {
        L.circle(p.ll, {
          radius: p.r * 1000,
          color: '#1a8a7e', weight: 1, fillColor: '#29b0a4', fillOpacity: 0.32,
        }).addTo(g);
      });
      add('wiup', g);
    }

    // Infrastructure corridor
    if (overlays.infra) {
      const g = L.layerGroup();
      L.polyline(PINS.infra, {
        color: '#f74565', weight: 2, dashArray: '4,3', opacity: 0.85,
      }).addTo(g);
      PINS.infra.forEach(ll => {
        L.circleMarker(ll, {
          radius: 3, color: '#fff', weight: 1, fillColor: '#f74565', fillOpacity: 1,
        }).addTo(g);
      });
      add('infra', g);
    }

    // KEK — special economic zones (polygon footprints, not points)
    if (overlays.kek) {
      const g = L.layerGroup();
      PINS.kek.forEach((p, i) => {
        const poly = blobPoly(p.ll, 14, 9, 31 + i * 7, 1.1);
        L.polygon(poly, {
          color: '#5a2eaa', weight: 1.2,
          fillColor: '#7e4dd9', fillOpacity: 0.32,
          dashArray: '3,2',
        }).bindTooltip(`KEK · ${p.n}`, { direction: 'top', sticky: true, className: 'lf-tip' }).addTo(g);
        // anchor dot at the centroid for legibility at low zoom
        L.circleMarker(p.ll, {
          radius: 3, color: '#5a2eaa', weight: 1, fillColor: '#fff', fillOpacity: 1,
          interactive: false,
        }).addTo(g);
      });
      add('kek', g);
    }

    // Industrial estates — Kawasan Industri polygon footprints
    if (overlays.industrial) {
      const g = L.layerGroup();
      PINS.industrial.forEach((p, i) => {
        // size varies — Cikarang/Morowali are huge; smaller estates are tighter
        const size = p.size || 8;
        const poly = blobPoly(p.ll, size, 10, 11 + i * 13, p.aspect || 1.0);
        L.polygon(poly, {
          color: '#b07900', weight: 1,
          fillColor: '#f7b500', fillOpacity: 0.55,
        }).bindTooltip(`${p.n} · ${p.t}`, { direction: 'top', sticky: true, className: 'lf-tip' }).addTo(g);
      });
      add('industrial', g);
    }

    // Mineral deposits — labeled chips
    if (overlays.minerals) {
      const g = L.layerGroup();
      PINS.minerals.forEach(p => {
        const html = `<span style="background:#fff;border:1px solid ${p.c};color:${p.c};
          font:600 10px/1 'IBM Plex Mono',monospace;letter-spacing:0.04em;
          padding:3px 5px;border-radius:3px;white-space:nowrap;">${p.k}</span>`;
        L.marker(p.ll, {
          icon: L.divIcon({ html, className: 'lf-mineral', iconSize: null, iconAnchor: [16, 8] }),
        }).addTo(g);
      });
      add('minerals', g);
    }

    // Ports — diamond markers
    if (overlays.ports) {
      const g = L.layerGroup();
      PINS.ports.forEach(p => {
        const html = `<div style="width:10px;height:10px;background:#1a1a2e;
          transform:rotate(45deg);box-shadow:0 0 0 2px #fff;"></div>`;
        L.marker(p.ll, {
          icon: L.divIcon({ html, className: 'lf-port', iconSize: [12,12], iconAnchor: [6,6] }),
        }).bindTooltip(p.n, { direction: 'top', offset: [0, -4], className: 'lf-tip' }).addTo(g);
      });
      add('ports', g);
    }

    // Featured opportunity pulses
    if (overlays.featured !== false) {
      const g = L.layerGroup();
      PINS.featured.forEach(p => {
        const html = `
          <div class="lf-pulse-wrap">
            <span class="lf-pulse-ring" style="border-color:${p.c}"></span>
            <span class="lf-pulse-dot"  style="background:${p.c}"></span>
          </div>`;
        const m = L.marker(p.ll, {
          icon: L.divIcon({ html, className: 'lf-pulse', iconSize: [28,28], iconAnchor: [14,14] }),
          zIndexOffset: 1000,
        }).addTo(g);
        if (onPinClick) m.on('click', () => onPinClick(p.k));
      });
      add('featured', g);
    }
  }, [JSON.stringify(overlays)]); // eslint-disable-line

  // re-fit when bounds prop changes
  useEffectMap(() => {
    const map = mapRef.current;
    if (!map) return;
    if (bounds) map.fitBounds(bounds, { padding: [10,10] });
    else if (zoom != null) map.setView(center, zoom);
  }, [JSON.stringify(bounds), zoom, JSON.stringify(center)]); // eslint-disable-line

  return <div ref={ref} style={{ width: '100%', height: '100%', background: '#eee7d4' }} />;
}

Object.assign(window, { LeafletMap });
