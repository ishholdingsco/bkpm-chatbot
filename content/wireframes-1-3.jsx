/* global React */
// Wireframes 1–3: Classic split, Canvas-forward, Terminal dense
// All depict the SAME scene: an active chat thread inside
// Org: "Khazanah Nasional" → Project: "Nickel Midstream — Sulawesi"

const { useState } = React;

// ─────────────────────────────────────────────────────────────
// Shared mock content (so every variation tells the same story)
// ─────────────────────────────────────────────────────────────
const MOCK = {
  org: 'Khazanah Nasional',
  orgShort: 'KN',
  project: 'Nickel Midstream — Sulawesi',
  projectShort: 'Project · Sulawesi Ni',
  thread: 'DNI rules & smelter co-investment',
  threadShort: 'DNI / smelter co-invest',
  analyst: 'Rina Pratiwi',
  analystRole: 'Senior Analyst, BKPM',
  // chat turns
  turns: [
    { who: 'user', name: 'You', text: 'What\'s the current Negative Investment List position on nickel-related midstream as of Perpres 49/2021? Foreign cap?' },
    { who: 'ai', name: 'BKPM Assistant', text: 'Smelting & refining of nickel ore is OPEN to 100% foreign ownership under the Positive Investment List, conditional on partnership with local SMEs for any non-core services. I\'ve pulled the relevant clauses into the canvas →', cite: ['Perpres 10/2021 Annex II', 'BKPM Reg. 4/2021 §17'] },
    { who: 'user', name: 'You', text: 'Got it. Can you sketch the typical co-investment structure with state-owned MIND ID? We\'d be looking at minority via convertible.' },
    { who: 'ai', name: 'BKPM Assistant', text: 'Most recent precedents (Vale Indonesia, PT Halmahera Persada Lygend) used a 3-tier SPV with offshore HoldCo. Here\'s a structure diagram + comp set. Ask me about any node.' },
  ],
  // canvas artifacts
  artifacts: [
    { kind: 'doc', title: 'Perpres 10/2021 — Annex II §C(7)' },
    { kind: 'model', title: 'Comp set: 4 deals, 2021–2025' },
    { kind: 'diagram', title: 'SPV structure — 3 tiers' },
    { kind: 'map', title: 'Sulawesi smelter cluster map' },
  ],
};

// ─────────────────────────────────────────────────────────────
// 1. CLASSIC SPLIT  (sketchy)
//    Sidebar (orgs/projects/threads) · chat · right rail canvas
// ─────────────────────────────────────────────────────────────
function W1ClassicSplit() {
  return (
    <div className="artboard sketch" style={{ background: '#fafaf7' }}>
      {/* top bar */}
      <div style={{ height: 38, borderBottom: '1.5px solid #1a1a1a', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10, background: '#f3f2ec' }}>
        <div style={{ fontFamily: 'Caveat, cursive', fontSize: 22, fontWeight: 700 }}>BKPM<span style={{ color: '#c8512a' }}>·</span>chat</div>
        <span className="hand-mono" style={{ color: '#666', fontSize: 13 }}>/ {MOCK.org} / {MOCK.project} / <b>{MOCK.thread}</b></span>
        <div className="grow" />
        <span className="pill pill-accent2">● live</span>
        <span className="hand-mono" style={{ fontSize: 13 }}>analysts on call: 3</span>
      </div>

      <div className="row" style={{ height: 'calc(100% - 38px)' }}>
        {/* SIDEBAR */}
        <div className="col" style={{ width: 220, borderRight: '1.5px solid #1a1a1a', background: '#f3f2ec', padding: 12, gap: 10 }}>
          <div className="hand-mono" style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>org</div>
          <div className="box" style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, border: '1.5px solid #1a1a1a', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Caveat', fontWeight: 700, fontSize: 14, background: '#fff' }}>KN</div>
            <span className="hand" style={{ fontSize: 17 }}>{MOCK.org}</span>
            <span style={{ marginLeft: 'auto', fontFamily: 'Caveat' }}>▾</span>
          </div>

          <div className="hand-mono" style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>projects</div>
          {[
            { name: 'Nickel Midstream — Sulawesi', active: true, threads: 4 },
            { name: 'Geothermal — N. Sumatra', active: false, threads: 2 },
            { name: 'Data Centers — Batam', active: false, threads: 7 },
            { name: 'EV Battery JV — W. Java', active: false, threads: 1 },
          ].map((p) => (
            <div key={p.name} className={p.active ? 'box' : ''} style={{ padding: '5px 8px', background: p.active ? '#fde68a' : 'transparent', borderRadius: 4 }}>
              <div className="hand" style={{ fontSize: 15, lineHeight: 1.1 }}>{p.name}</div>
              {p.active && (
                <div style={{ marginTop: 6, marginLeft: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div className="hand-mono" style={{ fontSize: 12 }}>· DNI / smelter co-invest <span style={{ color: '#c8512a' }}>●</span></div>
                  <div className="hand-mono" style={{ fontSize: 12, color: '#666' }}>· Tax holiday eligibility</div>
                  <div className="hand-mono" style={{ fontSize: 12, color: '#666' }}>· Power offtake — PLN</div>
                  <div className="hand-mono" style={{ fontSize: 12, color: '#666' }}>· ESG / IRMA audit</div>
                </div>
              )}
            </div>
          ))}

          <div className="grow" />
          <div className="box-dashed" style={{ padding: '6px 8px', textAlign: 'center' }}>
            <span className="hand" style={{ fontSize: 15 }}>+ new project</span>
          </div>
        </div>

        {/* CHAT */}
        <div className="col grow" style={{ minWidth: 0 }}>
          <div className="col grow scroll" style={{ padding: '20px 28px', gap: 14 }}>
            {MOCK.turns.map((t, i) => (
              <div key={i} className="col" style={{ alignItems: t.who === 'user' ? 'flex-end' : 'flex-start', gap: 4 }}>
                <div className="hand-mono" style={{ fontSize: 11, color: '#888' }}>{t.name}</div>
                <div className={'bubble ' + (t.who === 'user' ? 'bubble-user' : '')}>
                  <span className="hand" style={{ fontSize: 16, lineHeight: 1.35 }}>{t.text}</span>
                </div>
                {t.cite && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginLeft: 4 }}>
                    {t.cite.map((c) => <span key={c} className="pill">{c}</span>)}
                  </div>
                )}
              </div>
            ))}

            {/* ai is typing */}
            <div className="hand" style={{ fontSize: 14, color: '#888', alignSelf: 'flex-start' }}>
              <span style={{ borderBottom: '1.5px dashed #999' }}>BKPM Assistant is drafting</span> · · ·
            </div>
          </div>

          {/* composer */}
          <div style={{ borderTop: '1.5px solid #1a1a1a', padding: '12px 24px', background: '#f3f2ec' }}>
            <div className="box" style={{ padding: '10px 14px', minHeight: 56, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="hand" style={{ fontSize: 16, color: '#aaa' }}>Ask, attach a doc, or @mention an analyst…</span>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <span className="pill">＋ attach</span>
                <span className="pill">@ Rina</span>
                <span className="pill pill-accent">↗ refer to human</span>
                <div className="grow" />
                <span className="pill pill-accent2">send ↵</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT RAIL CANVAS */}
        <div className="col" style={{ width: 280, borderLeft: '1.5px solid #1a1a1a', background: '#f3f2ec', padding: 12, gap: 10 }}>
          <div className="hand-mono" style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>shared canvas</div>
          <div className="hand" style={{ fontSize: 13, color: '#666', marginTop: -4 }}>artifacts pinned by the thread</div>

          <div className="box" style={{ padding: 10 }}>
            <div className="hand-mono" style={{ fontSize: 11, color: '#888' }}>· DOC</div>
            <div className="hand" style={{ fontSize: 15 }}>Perpres 10/2021 — Annex II</div>
            <div className="placeholder-img" style={{ height: 60, marginTop: 6 }}>regulation excerpt</div>
          </div>

          <div className="box" style={{ padding: 10 }}>
            <div className="hand-mono" style={{ fontSize: 11, color: '#888' }}>· MODEL</div>
            <div className="hand" style={{ fontSize: 15 }}>Comp set — 4 deals</div>
            <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
              {[1,2,3,4,5,6].map(i => <div key={i} className="bar-text" />)}
            </div>
          </div>

          <div className="box" style={{ padding: 10 }}>
            <div className="hand-mono" style={{ fontSize: 11, color: '#888' }}>· DIAGRAM</div>
            <div className="hand" style={{ fontSize: 15 }}>SPV structure (3-tier)</div>
            <div className="placeholder-img" style={{ height: 70, marginTop: 6 }}>org chart</div>
          </div>

          <div className="box-dashed" style={{ padding: 8, textAlign: 'center' }}>
            <span className="hand" style={{ fontSize: 14 }}>+ pin from chat</span>
          </div>
        </div>
      </div>

      {/* annotation */}
      <div className="sticky" style={{ top: 60, right: 300, transform: 'rotate(2deg)' }}>
        sidebar = org · proj · thread<br/>(3 levels, collapsible)
      </div>
      <div className="sticky alt" style={{ bottom: 100, right: 16 }}>
        canvas auto-collects<br/>citations + artifacts
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. CANVAS-FORWARD  (sketchy)
//    Big canvas of artifacts, chat is a thin strip that summons
// ─────────────────────────────────────────────────────────────
function W2CanvasForward() {
  return (
    <div className="artboard sketch" style={{ background: '#fafaf7' }}>
      {/* top */}
      <div style={{ height: 38, borderBottom: '1.5px solid #1a1a1a', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10, background: '#f3f2ec' }}>
        <span className="hand-mono" style={{ fontSize: 13 }}>◀ {MOCK.org}</span>
        <span style={{ color: '#999' }}>·</span>
        <span className="hand" style={{ fontSize: 18 }}>{MOCK.project}</span>
        <span className="pill pill-accent" style={{ marginLeft: 8 }}>thread: {MOCK.threadShort}</span>
        <div className="grow" />
        <span className="pill">Rina P.</span>
        <span className="pill">+2 analysts</span>
        <span className="pill pill-accent">↗ ask human</span>
      </div>

      <div className="row" style={{ height: 'calc(100% - 38px)' }}>
        {/* CANVAS — dominant */}
        <div className="col grow" style={{ background: '#f7f5ee', padding: 24, gap: 16, minWidth: 0, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span className="hand" style={{ fontSize: 26, fontWeight: 700 }}>Sulawesi Ni · canvas</span>
            <span className="hand-mono" style={{ fontSize: 12, color: '#888' }}>14 artifacts · last edit 2m ago by AI</span>
            <div className="grow" />
            <span className="pill">grid</span>
            <span className="pill">timeline</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, flex: 1, gridTemplateRows: 'auto auto' }}>
            <div className="box" style={{ padding: 12, gridRow: 'span 2' }}>
              <div className="hand-mono" style={{ fontSize: 11, color: '#888' }}>DOC · pinned</div>
              <div className="hand" style={{ fontSize: 17 }}>Perpres 10/2021 Annex II</div>
              <div className="placeholder-img" style={{ height: 80, marginTop: 8 }}>regulation</div>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div className="bar-text" style={{ width: '90%' }} />
                <div className="bar-text" style={{ width: '70%' }} />
                <div className="bar-text" style={{ width: '85%' }} />
              </div>
              <div className="hand" style={{ fontSize: 13, color: '#c8512a', marginTop: 8 }}>"100% foreign OK with SME partnering"</div>
            </div>

            <div className="box" style={{ padding: 12 }}>
              <div className="hand-mono" style={{ fontSize: 11, color: '#888' }}>MAP</div>
              <div className="hand" style={{ fontSize: 16 }}>Smelter cluster — Sulawesi</div>
              <div className="placeholder-img" style={{ height: 90, marginTop: 6, position: 'relative' }}>
                <span style={{ position: 'absolute', top: 30, left: 60, color: '#c8512a' }}>●</span>
                <span style={{ position: 'absolute', top: 50, left: 90, color: '#c8512a' }}>●</span>
                <span style={{ position: 'absolute', top: 40, left: 110, color: '#2d6a5a' }}>●</span>
              </div>
            </div>

            <div className="box" style={{ padding: 12 }}>
              <div className="hand-mono" style={{ fontSize: 11, color: '#888' }}>MODEL</div>
              <div className="hand" style={{ fontSize: 16 }}>Comp set · 4 deals</div>
              <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 3 }}>
                {Array(16).fill(0).map((_, i) => <div key={i} className="bar-text" style={{ height: 6 }} />)}
              </div>
              <div className="hand-mono" style={{ fontSize: 11, color: '#666', marginTop: 6 }}>median EV/EBITDA: 6.4×</div>
            </div>

            <div className="box" style={{ padding: 12, gridColumn: 'span 2' }}>
              <div className="hand-mono" style={{ fontSize: 11, color: '#888' }}>DIAGRAM</div>
              <div className="hand" style={{ fontSize: 16 }}>SPV structure — 3 tiers</div>
              <div className="placeholder-img" style={{ height: 80, marginTop: 6 }}>OffshoreHold → IndoCo → OpCo</div>
            </div>
          </div>

          <div className="sticky alt2" style={{ top: 80, right: 30 }}>
            canvas IS the project.<br/>chat narrates edits to it.
          </div>
        </div>

        {/* CHAT — narrow strip */}
        <div className="col" style={{ width: 320, borderLeft: '1.5px solid #1a1a1a', background: '#fafaf7' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1.5px solid #1a1a1a', background: '#f3f2ec', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="hand" style={{ fontSize: 17, fontWeight: 700 }}>thread</span>
            <span className="hand-mono" style={{ fontSize: 11, color: '#888' }}>· DNI / smelter</span>
            <div className="grow" />
            <span className="hand-mono" style={{ fontSize: 11 }}>⌄ all threads (4)</span>
          </div>

          <div className="col grow scroll" style={{ padding: 12, gap: 10 }}>
            {MOCK.turns.map((t, i) => (
              <div key={i} className="col" style={{ alignItems: t.who === 'user' ? 'flex-end' : 'flex-start', gap: 3 }}>
                <div className="hand-mono" style={{ fontSize: 10, color: '#999' }}>{t.name}</div>
                <div className={'bubble ' + (t.who === 'user' ? 'bubble-user' : '')} style={{ fontSize: 13 }}>
                  <span className="hand" style={{ fontSize: 14, lineHeight: 1.3 }}>{t.text}</span>
                </div>
                {t.cite && <div style={{ fontSize: 10 }} className="hand-mono">→ pinned to canvas</div>}
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1.5px solid #1a1a1a', padding: 10 }}>
            <div className="box" style={{ padding: 8, minHeight: 52 }}>
              <span className="hand" style={{ fontSize: 14, color: '#aaa' }}>ask or refine the canvas…</span>
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
              <span className="pill">+ pin</span>
              <span className="pill pill-accent">↗ human</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. TERMINAL DENSE  (clean, Bloomberg-ish)
//    Multi-pane data terminal; chat is one panel of many
// ─────────────────────────────────────────────────────────────
function W3Terminal() {
  return (
    <div className="artboard clean" style={{ background: '#181818', color: '#e8e6df' }}>
      {/* command bar */}
      <div style={{ height: 30, background: '#000', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 14, borderBottom: '1px solid #2a2a2a', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>
        <span style={{ color: '#c8512a', fontWeight: 600 }}>BKPM/T</span>
        <span style={{ color: '#888' }}>{MOCK.org.toUpperCase()}.KN</span>
        <span style={{ color: '#888' }}>›</span>
        <span style={{ color: '#e8e6df' }}>{MOCK.project.toUpperCase()}</span>
        <span style={{ color: '#888' }}>›</span>
        <span style={{ color: '#fde68a' }}>{MOCK.thread.toUpperCase()}</span>
        <div className="grow" />
        <span style={{ color: '#2d8a6a' }}>● AI READY</span>
        <span style={{ color: '#888' }}>FX IDR/USD 15,842 ▴0.4%</span>
        <span style={{ color: '#888' }}>26 APR 2026 14:02 WIB</span>
      </div>

      {/* function strip */}
      <div style={{ height: 22, background: '#0e0e0e', display: 'flex', alignItems: 'center', padding: '0 8px', gap: 10, borderBottom: '1px solid #2a2a2a', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#aaa' }}>
        {['F1 OVERVIEW', 'F2 CHAT', 'F3 DOCS', 'F4 COMPS', 'F5 STRUCT', 'F6 RISK', 'F7 ESG', 'F8 PEOPLE', 'F9 MEMO'].map((f, i) => (
          <span key={f} style={{ color: i === 1 ? '#fde68a' : '#aaa', borderBottom: i === 1 ? '2px solid #fde68a' : 'none', paddingBottom: 1 }}>{f}</span>
        ))}
      </div>

      {/* grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr 240px', gridTemplateRows: '1fr 1fr', gap: 0, height: 'calc(100% - 52px)' }}>
        {/* nav */}
        <div style={{ gridRow: 'span 2', borderRight: '1px solid #2a2a2a', padding: 10, background: '#141414', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10 }}>
          <div style={{ color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>orgs</div>
          <div style={{ color: '#fff', marginBottom: 4 }}>▾ KHAZANAH NSL</div>
          <div style={{ paddingLeft: 8, color: '#aaa', display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 10 }}>
            <span style={{ background: '#fde68a', color: '#000', padding: '1px 4px' }}>SULAWESI.NI ●</span>
            <span>NSUMATRA.GEO</span>
            <span>BATAM.DC</span>
            <span>WJAVA.EVB</span>
          </div>
          <div style={{ color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>threads</div>
          <div style={{ color: '#aaa', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ color: '#fde68a' }}>► DNI/SMELT</span>
            <span>· TAX HOL</span>
            <span>· PLN OFFTAKE</span>
            <span>· IRMA AUDIT</span>
          </div>

          <div style={{ marginTop: 16, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>analysts</div>
          <div style={{ color: '#aaa', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span><span style={{ color: '#2d8a6a' }}>●</span> R.PRATIWI</span>
            <span><span style={{ color: '#2d8a6a' }}>●</span> A.WIBOWO</span>
            <span><span style={{ color: '#888' }}>○</span> S.HAKIM</span>
          </div>
        </div>

        {/* CHAT pane */}
        <div style={{ borderRight: '1px solid #2a2a2a', borderBottom: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ height: 22, background: '#0e0e0e', display: 'flex', alignItems: 'center', padding: '0 10px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#fde68a', borderBottom: '1px solid #2a2a2a' }}>
            <span>[F2] CHAT · DNI/SMELT</span>
            <div className="grow" />
            <span style={{ color: '#888' }}>4 turns · 2m</span>
          </div>
          <div className="grow scroll" style={{ padding: 10, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {MOCK.turns.map((t, i) => (
              <div key={i}>
                <span style={{ color: t.who === 'user' ? '#fde68a' : '#2d8a6a' }}>{t.who === 'user' ? '> YOU' : '> AI '}</span>
                <span style={{ color: '#888' }}> {String(14 - i).padStart(2,'0')}:{String(58 - i*2).padStart(2,'0')}</span>
                <div style={{ color: '#e8e6df', marginTop: 2 }}>{t.text}</div>
                {t.cite && (
                  <div style={{ marginTop: 4, color: '#aaa', fontSize: 10 }}>
                    {t.cite.map(c => <span key={c} style={{ marginRight: 8 }}>[{c}]</span>)}
                  </div>
                )}
              </div>
            ))}
            <div style={{ color: '#888' }}>&gt; <span style={{ background: '#fde68a', color: '#000', padding: '0 3px' }}>_</span></div>
          </div>
          <div style={{ borderTop: '1px solid #2a2a2a', padding: '6px 10px', display: 'flex', gap: 8, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#888' }}>
            <span>↵ SEND</span>
            <span>^P PIN</span>
            <span>^H HANDOFF</span>
            <span>^M MEMO</span>
          </div>
        </div>

        {/* COMPS pane */}
        <div style={{ borderRight: '1px solid #2a2a2a', borderBottom: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ height: 22, background: '#0e0e0e', display: 'flex', alignItems: 'center', padding: '0 10px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#aaa', borderBottom: '1px solid #2a2a2a' }}>[F4] COMPS · NI MIDSTREAM</div>
          <div className="grow scroll" style={{ padding: 10, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 50px 50px 50px', gap: 4, color: '#888', borderBottom: '1px solid #2a2a2a', paddingBottom: 4 }}>
              <span>DEAL</span><span>YR</span><span>EV$M</span><span>EBITDA×</span><span>FOR%</span>
            </div>
            {[
              ['Vale Indonesia HPAL', '23', '2,400', '6.8', '60'],
              ['Halmahera HPL', '22', '1,100', '5.9', '57'],
              ['Konawe Smelter', '24', '780', '6.4', '100'],
              ['Morowali Phase IV', '25', '3,200', '6.2', '85'],
            ].map((r, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 50px 50px 50px 50px', gap: 4, padding: '4px 0', borderBottom: '1px solid #1f1f1f', color: '#e8e6df' }}>
                <span>{r[0]}</span>
                <span style={{ color: '#888' }}>{r[1]}</span>
                <span>{r[2]}</span>
                <span style={{ color: '#fde68a' }}>{r[3]}</span>
                <span>{r[4]}</span>
              </div>
            ))}
            <div style={{ marginTop: 8, color: '#888' }}>MED EV/EBITDA: <span style={{ color: '#fde68a' }}>6.30×</span></div>
          </div>
        </div>

        {/* HANDOFF rail */}
        <div style={{ gridRow: 'span 2', borderBottom: '1px solid #2a2a2a', background: '#141414', padding: 10, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>handoff</div>
          <div style={{ border: '1px solid #2a2a2a', padding: 10, background: '#0e0e0e' }}>
            <div style={{ color: '#fde68a', fontSize: 11 }}>R. PRATIWI</div>
            <div style={{ color: '#888' }}>SR ANALYST · SE Asia desk</div>
            <div style={{ marginTop: 6, color: '#e8e6df' }}>"available now — book a 30m call?"</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
              <span style={{ background: '#c8512a', color: '#000', padding: '2px 6px' }}>BOOK</span>
              <span style={{ border: '1px solid #2a2a2a', padding: '2px 6px' }}>DM</span>
            </div>
          </div>
          <div style={{ color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginTop: 6 }}>memo (auto)</div>
          <div style={{ border: '1px solid #2a2a2a', padding: 8, background: '#0e0e0e', color: '#aaa' }}>
            <div className="bar-text" style={{ background: '#2a2a2a', height: 4, marginBottom: 4 }} />
            <div className="bar-text" style={{ background: '#2a2a2a', height: 4, marginBottom: 4, width: '80%' }} />
            <div className="bar-text" style={{ background: '#2a2a2a', height: 4, marginBottom: 4, width: '90%' }} />
            <div style={{ marginTop: 6, color: '#fde68a' }}>► EXPORT PDF</div>
          </div>

          <div style={{ color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginTop: 6 }}>activity</div>
          <div style={{ color: '#aaa', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span>14:02 AI pinned doc</span>
            <span>13:58 you opened comp</span>
            <span>13:40 R.P. joined</span>
          </div>
        </div>

        {/* STRUCT pane */}
        <div style={{ borderRight: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ height: 22, background: '#0e0e0e', display: 'flex', alignItems: 'center', padding: '0 10px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#aaa', borderBottom: '1px solid #2a2a2a' }}>[F5] STRUCTURE</div>
          <div className="grow" style={{ padding: 10, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#aaa' }}>
            <div style={{ textAlign: 'center', padding: 4, border: '1px solid #555', display: 'inline-block', color: '#fde68a' }}>OFFSHORE HOLDCO (SG)</div>
            <div style={{ marginLeft: 30, marginTop: 8, color: '#666' }}>│</div>
            <div style={{ marginLeft: 8, padding: 4, border: '1px solid #555', display: 'inline-block', marginTop: 4 }}>PT INDOCO (ID)</div>
            <div style={{ marginLeft: 38, marginTop: 6, color: '#666' }}>│ ├─ MIND ID 35%</div>
            <div style={{ marginLeft: 38, color: '#666' }}>│ └─ KN OFFSHORE 65%</div>
            <div style={{ marginLeft: 8, padding: 4, border: '1px solid #555', display: 'inline-block', marginTop: 6 }}>PT OPCO (Sulawesi)</div>
          </div>
        </div>

        {/* DOC pane */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ height: 22, background: '#0e0e0e', display: 'flex', alignItems: 'center', padding: '0 10px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#aaa', borderBottom: '1px solid #2a2a2a' }}>[F3] DOC · PERPRES 10/2021</div>
          <div className="grow scroll" style={{ padding: 10, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#aaa', lineHeight: 1.5 }}>
            <div style={{ color: '#888' }}>// Annex II §C(7)</div>
            <div style={{ color: '#e8e6df' }}>"Smelting & refining of nickel ore</div>
            <div style={{ color: '#e8e6df' }}>shall be open to foreign capital</div>
            <div style={{ color: '#fde68a', background: '#3a2a05', display: 'inline-block', padding: '0 2px' }}>up to 100% subject to partnership</div>
            <div style={{ color: '#fde68a', background: '#3a2a05', display: 'inline-block', padding: '0 2px' }}>with national SMEs..."</div>
            <div style={{ color: '#888', marginTop: 8 }}>// see also</div>
            <div>· BKPM Reg. 4/2021</div>
            <div>· UU 11/2020 (Ciptaker)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { W1ClassicSplit, W2CanvasForward, W3Terminal });
