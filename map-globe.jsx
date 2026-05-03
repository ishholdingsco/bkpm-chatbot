/* global React, maplibregl */
// MapLibre globe — used for the landing hero. Renders a real spherical Earth
// rotating slowly toward Indonesia, with the same overlay pins/blobs the
// flat Leaflet map uses. Drop-in: <GlobeMap autoRotate spinTo="indonesia" />

const { useEffect: useEffectGlobe, useRef: useRefGlobe, useState: useStateGlobe } = React;

// Same anchors as map-leaflet, kept independent so this file is portable.
const G_PINS = {
  industrial: [
    { ll: [107.150, -6.260], n: 'KIM Cikarang' },
    { ll: [110.220, -6.929], n: 'Kendal IE' },
    { ll: [106.040, -6.020], n: 'Cilegon' },
    { ll: [112.750, -7.250], n: 'Surabaya IE' },
    { ll: [ 99.450,  3.380], n: 'Sei Mangkei' },
    { ll: [104.770, -3.720], n: 'Tj. Api-api' },
    { ll: [121.060, -2.531], n: 'IMIP Morowali' },
    { ll: [104.030,  1.050], n: 'Batam IE' },
  ],
  kek: [
    { ll: [ 98.700,  3.580] },
    { ll: [121.060, -2.531] },
    { ll: [116.830, -1.250] },
    { ll: [131.250, -0.880] },
    { ll: [114.420, -8.190] },
    { ll: [104.080,  1.150] },
  ],
  featured: [
    { ll: [121.060, -2.531], k: 'sulawesi-ni', label: 'Sulawesi.Ni' },
    { ll: [ 99.450,  3.380], k: 'sei-mangkei', label: 'Sei Mangkei' },
    { ll: [104.770, -3.720], k: 'tj-api-api',  label: 'Tj. Api-api' },
  ],
};

// Tiny irregular ring around a point (lng/lat order for GeoJSON)
function gBlob([lng, lat], radiusKm, sides = 11, seed = 1, aspect = 1.0) {
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
  let s = (seed * 9301 + 49297) % 233280;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const ring = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    const w = 0.55 + rnd() * 0.55;
    ring.push([
      lng + Math.cos(a) * dLng * w * aspect,
      lat + Math.sin(a) * dLat * w,
    ]);
  }
  ring.push(ring[0]);
  return ring;
}

function GlobeMap({
  autoRotate = true,
  initialCenter = [118.0, -2.5],
  initialZoom = 1.6,
  // when true, render the heavy overlay pins on top of the globe
  showOverlays = true,
}) {
  const ref = useRefGlobe(null);
  const mapRef = useRefGlobe(null);
  const [ready, setReady] = useStateGlobe(false);

  useEffectGlobe(() => {
    if (!ref.current || mapRef.current) return;
    if (typeof maplibregl === 'undefined') return;

    const map = new maplibregl.Map({
      container: ref.current,
      // Carto Voyager vector style — clean, restrained cartography
      style: 'https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json',
      center: initialCenter,
      zoom: initialZoom,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      interactive: false,        // hero globe is decorative
      renderWorldCopies: false,
      preserveDrawingBuffer: true, // so html-to-image / screenshots can capture the canvas
    });
    mapRef.current = map;
    if (typeof window !== 'undefined') window.__globeMap = map;

    map.on('style.load', () => {
      // v5+ supports globe projection in the style itself
      try { map.setProjection({ type: 'globe' }); } catch (e) { /* older versions */ }
      // Atmosphere — sky around the sphere
      try {
        map.setSky?.({
          'sky-color': '#0c0c14',
          'horizon-color': '#1f2840',
          'fog-color': 'rgba(180,160,120,0.35)',
          'fog-ground-blend': 0.5,
          'horizon-fog-blend': 0.5,
          'sky-horizon-blend': 0.6,
          'atmosphere-blend': 0.8,
        });
      } catch (e) {}

      if (showOverlays) addOverlays(map);
      setReady(true);
    });

    // gentle auto-spin until user interaction OR until we settle on Indonesia
    let raf;
    let spinning = autoRotate;
    const spinSpeed = 0.04; // deg per frame
    const tick = () => {
      if (!mapRef.current) return;
      if (spinning) {
        const c = map.getCenter();
        map.jumpTo({ center: [c.lng + spinSpeed, c.lat] });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // After ~7s, ease into Indonesia and stop spinning
    const settle = setTimeout(() => {
      spinning = false;
      map.easeTo({
        center: [128.0, -2.5],
        zoom: 2.4,
        duration: 2400,
      });
    }, 6500);

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(ref.current);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0c0c14' }}>
      <div ref={ref} style={{ width: '100%', height: '100%' }} />
      {!ready && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#7a8aa6', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, letterSpacing: '0.12em',
        }}>
          INITIALIZING ATLAS…
        </div>
      )}
    </div>
  );
}

function addOverlays(map) {
  // Industrial estate polygons
  const industrialFeatures = G_PINS.industrial.map((p, i) => ({
    type: 'Feature',
    properties: { name: p.n },
    geometry: {
      type: 'Polygon',
      coordinates: [gBlob(p.ll, 24, 10, 11 + i * 13, 1.2)],
    },
  }));
  map.addSource('g-industrial', { type: 'geojson', data: { type: 'FeatureCollection', features: industrialFeatures } });
  map.addLayer({
    id: 'g-industrial-fill', type: 'fill', source: 'g-industrial',
    paint: { 'fill-color': '#f7b500', 'fill-opacity': 0.55 },
  });
  map.addLayer({
    id: 'g-industrial-line', type: 'line', source: 'g-industrial',
    paint: { 'line-color': '#b07900', 'line-width': 1 },
  });

  // KEK polygons
  const kekFeatures = G_PINS.kek.map((p, i) => ({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [gBlob(p.ll, 30, 9, 31 + i * 7, 1.1)],
    },
  }));
  map.addSource('g-kek', { type: 'geojson', data: { type: 'FeatureCollection', features: kekFeatures } });
  map.addLayer({
    id: 'g-kek-fill', type: 'fill', source: 'g-kek',
    paint: { 'fill-color': '#7e4dd9', 'fill-opacity': 0.32 },
  });
  map.addLayer({
    id: 'g-kek-line', type: 'line', source: 'g-kek',
    paint: { 'line-color': '#5a2eaa', 'line-width': 1.2, 'line-dasharray': [3, 2] },
  });

  // Featured opportunity pulse pins
  const featFeatures = G_PINS.featured.map(p => ({
    type: 'Feature',
    properties: { label: p.label },
    geometry: { type: 'Point', coordinates: p.ll },
  }));
  map.addSource('g-featured', { type: 'geojson', data: { type: 'FeatureCollection', features: featFeatures } });
  map.addLayer({
    id: 'g-featured-halo', type: 'circle', source: 'g-featured',
    paint: {
      'circle-radius': 18,
      'circle-color': '#e8533f',
      'circle-opacity': 0.18,
    },
  });
  map.addLayer({
    id: 'g-featured-dot', type: 'circle', source: 'g-featured',
    paint: {
      'circle-radius': 5,
      'circle-color': '#e8533f',
      'circle-stroke-color': '#fff',
      'circle-stroke-width': 2,
    },
  });
}

Object.assign(window, { GlobeMap });
