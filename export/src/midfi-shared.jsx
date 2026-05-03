/* global React */
// Shared mock data + small primitives for the mid-fi screens

const DATA = {
  org: { name: 'Khazanah Nasional', short: 'KN', color: '#2f6a4f' },
  user: { name: 'Aisha Tan', short: 'AT', color: '#b94a1f', role: 'Director, SE Asia' },
  projects: [
    { id: 'sni', name: 'Nickel Midstream — Sulawesi', short: 'SULAWESI.NI', stage: 'Diligence', threads: 4, active: true, ticket: '$400M', counter: 'MIND ID', sector: 'Critical minerals' },
    { id: 'nsg', name: 'Geothermal — N. Sumatra', short: 'NSUMATRA.GEO', stage: 'Scoping', threads: 2, active: false },
    { id: 'bdc', name: 'Data Centers — Batam', short: 'BATAM.DC', stage: 'Diligence', threads: 7, active: false },
    { id: 'wjb', name: 'EV Battery JV — W. Java', short: 'WJAVA.EVB', stage: 'Scoping', threads: 1, active: false },
  ],
  threads: [
    { id: 't1', name: 'DNI rules & smelter co-investment', updated: '2m', count: 4, active: true, lastActor: 'AI', unread: false },
    { id: 't2', name: 'Tax holiday eligibility (Pioneer industry)', updated: '1h', count: 9, active: false, lastActor: 'Rina P.', unread: true },
    { id: 't3', name: 'Power offtake — PLN terms', updated: '3h', count: 6, active: false, lastActor: 'AI', unread: false },
    { id: 't4', name: 'ESG / IRMA audit pathway', updated: 'yesterday', count: 12, active: false, lastActor: 'Adi W.', unread: false },
  ],
  analysts: [
    { name: 'Rina Pratiwi', short: 'RP', color: '#b94a1f', role: 'Sr. Analyst · SE Asia desk', status: 'online', focus: 'Mining & metals', interactions: 9 },
    { name: 'Adi Wibowo', short: 'AW', color: '#2f6a4f', role: 'Analyst · Energy', status: 'online', focus: 'Power & utilities', interactions: 3 },
    { name: 'Sari Hakim', short: 'SH', color: '#7a7466', role: 'Legal · BKPM', status: 'away', focus: 'Regulatory', interactions: 1 },
  ],
  turns: [
    { who: 'user', name: 'Aisha Tan', time: '14:00', text: "What's the current Negative Investment List position on nickel-related midstream as of Perpres 49/2021? Foreign cap?" },
    { who: 'ai', name: 'BKPM Assistant', time: '14:00', text: 'Smelting & refining of nickel ore is OPEN to 100% foreign ownership under the Positive Investment List, conditional on partnership with national SMEs for any non-core services.', cite: ['Perpres 10/2021 §C(7)', 'BKPM Reg. 4/2021 §17'], pin: 'Perpres clauses' },
    { who: 'user', name: 'Aisha Tan', time: '14:01', text: "Got it. Can you sketch the typical co-investment structure with state-owned MIND ID? We'd be looking at minority via convertible." },
    { who: 'ai', name: 'BKPM Assistant', time: '14:02', text: 'Most recent precedents (Vale Indonesia, PT Halmahera Persada Lygend, Konawe) used a 3-tier SPV with offshore HoldCo. Pinned the structure diagram + comp set →', cite: ['Comp set · 4 deals'], pin: 'SPV diagram' },
    { who: 'ai', name: 'BKPM Assistant', time: '14:02', kind: 'suggest', text: 'Convertible structuring with MIND ID has IC-level nuance — Rina Pratiwi structured the Konawe deal in 2024. Want me to loop her in?' },
  ],
  artifacts: [
    { kind: 'DOC', title: 'Perpres 10/2021 — Annex II §C(7)', meta: 'Regulation · 14 pages', highlight: '100% foreign permitted' },
    { kind: 'MODEL', title: 'Comp set — 4 nickel midstream deals', meta: 'Med EV/EBITDA 6.4× · 2021–2025' },
    { kind: 'DIAGRAM', title: 'SPV structure (3-tier offshore)', meta: 'Auto-generated · 14:02' },
    { kind: 'MAP', title: 'Sulawesi smelter cluster', meta: '12 active sites · IMIP, IWIP' },
  ],
};

// kind → accent
const KIND_COLOR = {
  DOC: 'chip-terra',
  MODEL: 'chip-jade',
  DIAGRAM: 'chip-gold',
  MAP: 'chip',
};

// ─────────────────────────────────────────────────────────────
// Avatars + presence
// ─────────────────────────────────────────────────────────────
function Avatar({ name, color, size, status }) {
  const cls = size === 'sm' ? 'avatar avatar-sm' : size === 'lg' ? 'avatar avatar-lg' : 'avatar';
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div className={cls} style={{ background: color || '#7a7466' }}>{name}</div>
      {status && (
        <div style={{
          position: 'absolute', bottom: -1, right: -1,
          width: size === 'lg' ? 12 : 8, height: size === 'lg' ? 12 : 8,
          borderRadius: '50%',
          background: status === 'online' ? '#2f6a4f' : status === 'away' ? '#c8a13a' : '#a39d8d',
          border: '2px solid #fff',
        }} />
      )}
    </div>
  );
}

function AvatarStack({ items, max = 3 }) {
  const shown = items.slice(0, max);
  return (
    <div style={{ display: 'flex' }}>
      {shown.map((a, i) => (
        <div key={a.short} style={{ marginLeft: i ? -8 : 0, border: '2px solid #fff', borderRadius: '50%' }}>
          <Avatar name={a.short} color={a.color} size="sm" status={a.status} />
        </div>
      ))}
      {items.length > max && (
        <div className="avatar avatar-sm" style={{ background: '#e6e0d2', color: '#4a463a', marginLeft: -8, border: '2px solid #fff' }}>
          +{items.length - max}
        </div>
      )}
    </div>
  );
}

// Logo
function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="1" y="1" width="18" height="18" rx="4" fill="#1c1a14" />
        <path d="M5 13 L5 7 L8 7 L10 10 L12 7 L15 7 L15 13" stroke="#b94a1f" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
        <circle cx="10" cy="14.5" r="1" fill="#b94a1f" />
      </svg>
      <span className="serif" style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>Nusantara</span>
      <span className="mono" style={{ fontSize: 10, color: '#7a7466', letterSpacing: '0.08em' }}>· BKPM</span>
    </div>
  );
}

// Cite chip
function Cite({ children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontFamily: 'IBM Plex Mono, monospace', fontSize: 10,
      padding: '2px 7px', border: '1px solid #e6e0d2', borderRadius: 3,
      background: '#fbf8f1', color: '#4a463a', textDecoration: 'none',
    }}>
      <span style={{ color: '#b94a1f' }}>§</span>{children}
    </span>
  );
}

// Artifact card (canvas rail)
function ArtifactCard({ kind, title, meta, highlight, onClick }) {
  const colorMap = { DOC: '#b94a1f', MODEL: '#2f6a4f', DIAGRAM: '#c8a13a', MAP: '#7a7466' };
  return (
    <div className="card" onClick={onClick} style={{ padding: 10, cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span className={'chip ' + (KIND_COLOR[kind] || '')}>{kind}</span>
        <span className="mono" style={{ fontSize: 9, color: '#a39d8d', marginLeft: 'auto' }}>14:02</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.3, marginBottom: 6 }}>{title}</div>
      {kind === 'DOC' && (
        <div className="ph" style={{ height: 50, background: '#ede8d9' }}>
          <span>regulation excerpt</span>
        </div>
      )}
      {kind === 'MODEL' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, height: 50 }}>
          {Array(16).fill(0).map((_, i) => (
            <div key={i} style={{ background: i % 5 === 0 ? colorMap[kind] : '#e6e0d2', height: '100%', opacity: 0.4 + Math.random() * 0.6 }} />
          ))}
        </div>
      )}
      {kind === 'DIAGRAM' && (
        <svg viewBox="0 0 200 50" style={{ width: '100%', height: 50 }}>
          <rect x="60" y="2" width="80" height="14" rx="2" fill="#fbe8dc" stroke="#b94a1f" strokeWidth="1" />
          <text x="100" y="12" textAnchor="middle" fontSize="7" fill="#b94a1f" fontFamily="IBM Plex Mono">OFFSHORE HOLDCO</text>
          <line x1="100" y1="16" x2="100" y2="22" stroke="#7a7466" strokeWidth="1" />
          <rect x="60" y="22" width="80" height="12" rx="2" fill="#fff" stroke="#7a7466" strokeWidth="1" />
          <text x="100" y="31" textAnchor="middle" fontSize="7" fill="#4a463a" fontFamily="IBM Plex Mono">PT INDOCO</text>
          <line x1="100" y1="34" x2="100" y2="38" stroke="#7a7466" strokeWidth="1" />
          <rect x="60" y="38" width="80" height="10" rx="2" fill="#fff" stroke="#7a7466" strokeWidth="1" />
          <text x="100" y="45" textAnchor="middle" fontSize="7" fill="#4a463a" fontFamily="IBM Plex Mono">PT OPCO</text>
        </svg>
      )}
      {kind === 'MAP' && (
        <svg viewBox="0 0 200 50" style={{ width: '100%', height: 50 }}>
          <path d="M20 30 Q40 10 70 25 T120 28 Q150 18 180 32" fill="none" stroke="#cfc6b0" strokeWidth="1.5" />
          <circle cx="60" cy="22" r="3" fill="#b94a1f" />
          <circle cx="95" cy="27" r="3" fill="#b94a1f" />
          <circle cx="130" cy="25" r="3" fill="#2f6a4f" />
          <circle cx="155" cy="28" r="2" fill="#b94a1f" />
        </svg>
      )}
      {highlight && (
        <div style={{ marginTop: 6, fontSize: 10, color: '#b94a1f', fontStyle: 'italic' }}>"{highlight}"</div>
      )}
      <div className="mono" style={{ fontSize: 9, color: '#a39d8d', marginTop: 4 }}>{meta}</div>
    </div>
  );
}

Object.assign(window, { DATA, KIND_COLOR, Avatar, AvatarStack, Logo, Cite, ArtifactCard });
