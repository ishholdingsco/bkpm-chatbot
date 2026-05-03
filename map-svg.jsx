/* global React */
// Indonesia archipelago SVG + map primitives.
// Stylized silhouettes — recognizable but mockup-grade, not geographic.

// Approximate viewBox: 0..1000 wide x 0..420 tall, west→east
// Major landmasses placed roughly:
// Sumatra ~ x:60-260, y:80-300
// Java    ~ x:280-440, y:280-340
// Kalimantan x:330-540, y:90-260
// Sulawesi x:560-680, y:130-300
// Bali/NT x:430-620, y:340-380
// Papua    x:760-980, y:130-340

const ID_PATHS = {
  sumatra: 'M 80 100 Q 95 90 120 100 L 165 145 Q 180 165 200 195 L 235 245 Q 250 270 240 290 L 220 305 Q 195 295 180 270 L 145 220 Q 120 185 95 155 Q 75 130 80 100 Z',
  java:    'M 285 308 Q 305 300 335 305 L 380 308 Q 415 305 440 312 L 455 318 Q 445 332 415 335 L 365 332 Q 325 332 300 326 Q 280 320 285 308 Z',
  bali:    'M 460 326 Q 475 322 488 326 L 488 333 Q 472 336 460 333 Z',
  ntb:     'M 498 326 Q 520 320 545 325 L 547 334 Q 520 338 498 334 Z',
  ntt:     'M 558 332 Q 590 326 625 332 L 628 343 Q 595 348 558 342 Z',
  kalimantan: 'M 360 105 Q 385 95 420 105 L 460 118 Q 495 130 520 158 L 535 200 Q 530 235 510 255 L 480 265 Q 450 258 430 240 L 405 215 Q 380 195 365 170 L 355 140 Q 350 118 360 105 Z',
  sulawesi: 'M 590 145 Q 605 135 620 148 L 625 175 L 615 198 L 632 215 Q 648 218 660 200 L 670 175 L 685 175 L 685 200 Q 680 230 665 252 L 645 268 L 640 290 Q 632 300 620 295 L 615 268 L 600 250 L 595 220 L 605 195 L 595 175 Q 585 158 590 145 Z',
  maluku:  'M 700 195 Q 715 192 722 200 L 722 215 Q 712 220 700 215 Z M 705 240 Q 720 235 728 245 L 725 258 Q 712 262 705 252 Z',
  papua:   'M 770 175 Q 800 158 845 165 L 905 175 Q 950 185 975 210 L 980 250 Q 970 285 940 310 L 890 325 Q 855 322 825 308 L 790 285 Q 770 260 765 230 L 762 200 Q 765 182 770 175 Z',
};

function IndonesiaMap({ overlays = {}, dark = false, onPinClick }) {
  const landFill = dark ? '#2a3458' : '#f5efe1';
  const landStroke = dark ? '#3d4a72' : '#d4c8a8';
  const labelFill = dark ? '#9aa3c2' : '#7a7466';

  return (
    <svg viewBox="0 0 1000 420" style={{ width: '100%', height: '100%', display: 'block' }} preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id="haze" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.5" fill={landStroke} opacity="0.4" />
        </pattern>
      </defs>

      {/* Land masses */}
      <g style={{ filter: 'drop-shadow(0 1px 0 rgba(20,20,40,0.04))' }}>
        {Object.entries(ID_PATHS).map(([k, d]) => (
          <path key={k} d={d} fill={landFill} stroke={landStroke} strokeWidth="0.8" />
        ))}
      </g>

      {/* Province labels */}
      <g fontFamily="IBM Plex Mono, monospace" fontSize="9" fill={labelFill} style={{ letterSpacing: '0.06em' }}>
        <text x="155" y="195" textAnchor="middle">SUMATRA</text>
        <text x="365" y="324" textAnchor="middle">JAVA</text>
        <text x="445" y="180" textAnchor="middle">KALIMANTAN</text>
        <text x="640" y="220" textAnchor="middle">SULAWESI</text>
        <text x="870" y="245" textAnchor="middle">PAPUA</text>
        <text x="540" y="356" textAnchor="middle" fontSize="7">NUSA TENGGARA</text>
      </g>

      {/* Capital */}
      <g>
        <circle cx="365" cy="318" r="3.5" fill={dark ? '#fff' : '#1a1a2e'} />
        <circle cx="365" cy="318" r="6" fill="none" stroke={dark ? '#fff' : '#1a1a2e'} strokeWidth="0.6" opacity="0.5" />
        <text x="365" y="298" textAnchor="middle" fontFamily="Inter" fontSize="9" fontWeight="600" fill={dark ? '#fff' : '#1a1a2e'}>JAKARTA</text>
      </g>

      {/* OVERLAY: Industrial estates (Kawasan Industri) — orange dots */}
      {overlays.industrial && (
        <g>
          {[
            [325, 312, 'KIM Cikarang'],
            [398, 318, 'Kendal IE'],
            [305, 300, 'Cilegon'],
            [415, 325, 'Surabaya'],
            [185, 220, 'Sei Mangkei'],
            [220, 290, 'Tj. Api-api'],
          ].map(([x, y, n]) => (
            <g key={n}>
              <circle cx={x} cy={y} r="4" fill="#f7b500" stroke="#fff" strokeWidth="1" />
            </g>
          ))}
        </g>
      )}

      {/* OVERLAY: KEK / Special Economic Zones — purple polygons */}
      {overlays.kek && (
        <g opacity="0.85">
          <circle cx="105" cy="175" r="9" fill="#7e4dd9" fillOpacity="0.25" stroke="#7e4dd9" strokeWidth="1.2" />
          <text x="105" y="178" fontSize="6" textAnchor="middle" fill="#5a2eaa" fontFamily="IBM Plex Mono" fontWeight="600">KEK</text>
          <circle cx="630" cy="270" r="10" fill="#7e4dd9" fillOpacity="0.25" stroke="#7e4dd9" strokeWidth="1.2" />
          <text x="630" y="273" fontSize="6" textAnchor="middle" fill="#5a2eaa" fontFamily="IBM Plex Mono" fontWeight="600">KEK</text>
          <circle cx="475" cy="195" r="9" fill="#7e4dd9" fillOpacity="0.25" stroke="#7e4dd9" strokeWidth="1.2" />
          <circle cx="845" cy="240" r="9" fill="#7e4dd9" fillOpacity="0.25" stroke="#7e4dd9" strokeWidth="1.2" />
        </g>
      )}

      {/* OVERLAY: WIUP (mining concessions) — green-blue blobs */}
      {overlays.wiup && (
        <g opacity="0.55">
          <ellipse cx="615" cy="195" rx="22" ry="14" fill="#29b0a4" stroke="#1a8a7e" strokeWidth="0.8" />
          <ellipse cx="640" cy="245" rx="20" ry="12" fill="#29b0a4" stroke="#1a8a7e" strokeWidth="0.8" />
          <ellipse cx="455" cy="170" rx="35" ry="20" fill="#29b0a4" stroke="#1a8a7e" strokeWidth="0.8" />
          <ellipse cx="480" cy="220" rx="20" ry="14" fill="#29b0a4" stroke="#1a8a7e" strokeWidth="0.8" />
          <ellipse cx="200" cy="180" rx="18" ry="14" fill="#29b0a4" stroke="#1a8a7e" strokeWidth="0.8" />
        </g>
      )}

      {/* OVERLAY: Mineral deposits — labeled markers */}
      {overlays.minerals && (
        <g fontFamily="IBM Plex Mono" fontSize="7" fontWeight="600">
          {[
            [620, 200, 'Ni', '#e8533f'],
            [645, 250, 'Ni', '#e8533f'],
            [870, 220, 'Cu', '#c8a13a'],
            [460, 175, 'Au+Cu', '#c8a13a'],
            [125, 230, 'Bauxite', '#7e4dd9'],
            [490, 215, 'Coal', '#1a1a2e'],
            [475, 240, 'Coal', '#1a1a2e'],
            [205, 175, 'Tin', '#5a5a6e'],
          ].map(([x, y, lbl, c]) => (
            <g key={`${x}-${y}-${lbl}`}>
              <rect x={x - 12} y={y - 5} width={lbl.length * 5 + 6} height={10} rx="2" fill="#fff" stroke={c} strokeWidth="1" />
              <text x={x - 9 + (lbl.length * 5 + 6) / 2 - 3} y={y + 2} fill={c} textAnchor="middle">{lbl}</text>
            </g>
          ))}
        </g>
      )}

      {/* OVERLAY: GDP per capita choropleth — soft fills over land */}
      {overlays.gdp && (
        <g opacity="0.55">
          <path d={ID_PATHS.java} fill="#4264fb" />
          <path d={ID_PATHS.kalimantan} fill="#7892ff" />
          <path d={ID_PATHS.sumatra} fill="#a3b5ff" />
          <path d={ID_PATHS.sulawesi} fill="#c9d2ff" />
          <path d={ID_PATHS.papua} fill="#7892ff" />
          <path d={ID_PATHS.bali} fill="#4264fb" />
          <path d={ID_PATHS.ntb} fill="#dde2ff" />
          <path d={ID_PATHS.ntt} fill="#eef0ff" />
        </g>
      )}

      {/* OVERLAY: Power grid / infrastructure — lines + nodes */}
      {overlays.infra && (
        <g stroke="#f74565" strokeWidth="1.2" fill="none" opacity="0.8">
          <path d="M 105 175 L 200 195 L 280 250 L 365 318 L 410 322 L 460 325" strokeDasharray="3,2" />
          <path d="M 365 318 L 480 230 L 615 195" strokeDasharray="3,2" />
          <path d="M 615 195 L 700 210 L 845 240" strokeDasharray="3,2" />
          {[[105,175],[200,195],[280,250],[365,318],[480,230],[615,195],[845,240],[700,210]].map(([x,y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="2.5" fill="#f74565" stroke="#fff" strokeWidth="0.8" />
          ))}
        </g>
      )}

      {/* OVERLAY: Ports — anchor markers */}
      {overlays.ports && (
        <g>
          {[
            [305, 308, 'Tj. Priok'],
            [415, 332, 'Tj. Perak'],
            [200, 278, 'Belawan'],
            [630, 215, 'Bitung'],
            [490, 265, 'Balikpapan'],
            [870, 280, 'Sorong'],
          ].map(([x, y, n]) => (
            <g key={n}>
              <rect x={x - 4} y={y - 4} width="8" height="8" fill="#1a1a2e" transform={`rotate(45 ${x} ${y})`} />
              <text x={x} y={y - 10} fontSize="7" fontFamily="Inter" fontWeight="600" fill="#1a1a2e" textAnchor="middle">⚓</text>
            </g>
          ))}
        </g>
      )}

      {/* Always-on: featured opportunity pulses */}
      {overlays.featured !== false && (
        <g>
          <g style={{ cursor: 'pointer' }} onClick={() => onPinClick && onPinClick('sulawesi-ni')}>
            <circle cx="630" cy="245" r="14" fill="#b94a1f" fillOpacity="0.18">
              <animate attributeName="r" values="10;18;10" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="fillOpacity" values="0.3;0.05;0.3" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <circle cx="630" cy="245" r="5" fill="#b94a1f" stroke="#fff" strokeWidth="1.5" />
          </g>
          <g style={{ cursor: 'pointer' }}>
            <circle cx="200" cy="220" r="10" fill="#2f6a4f" fillOpacity="0.18">
              <animate attributeName="r" values="8;14;8" dur="2.4s" begin="0.4s" repeatCount="indefinite" />
            </circle>
            <circle cx="200" cy="220" r="4" fill="#2f6a4f" stroke="#fff" strokeWidth="1.5" />
          </g>
          <g style={{ cursor: 'pointer' }}>
            <circle cx="195" cy="290" r="10" fill="#4264fb" fillOpacity="0.18">
              <animate attributeName="r" values="8;14;8" dur="2.4s" begin="0.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="195" cy="290" r="4" fill="#4264fb" stroke="#fff" strokeWidth="1.5" />
          </g>
        </g>
      )}
    </svg>
  );
}

const LAYERS = [
  { id: 'industrial', name: 'Kawasan Industri', desc: 'Industrial estates · 142 sites', color: '#f7b500', count: 142 },
  { id: 'kek', name: 'Kawasan Ekonomi Khusus', desc: 'Special Economic Zones · 22', color: '#7e4dd9', count: 22 },
  { id: 'wiup', name: 'WIUP — Mining Concessions', desc: 'Active concessions · 4,210', color: '#29b0a4', count: 4210 },
  { id: 'minerals', name: 'Mineral & Resource Deposits', desc: 'Ni · Cu · Au · Bauxite · Coal · Tin', color: '#e8533f' },
  { id: 'gdp', name: 'GDP per capita', desc: 'Choropleth · 2025', color: '#4264fb' },
  { id: 'infra', name: 'Power grid & corridors', desc: 'PLN backbone + planned', color: '#f74565' },
  { id: 'ports', name: 'Sea ports', desc: '36 strategic ports', color: '#1a1a2e' },
];

Object.assign(window, { IndonesiaMap, LAYERS });
