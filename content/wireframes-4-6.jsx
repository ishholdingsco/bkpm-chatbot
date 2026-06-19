/* global React */
// Wireframes 4–6: Deal pipeline (CRM), Data room, Analyst-pair

const MOCK2 = {
  org: 'Khazanah Nasional',
  project: 'Nickel Midstream — Sulawesi',
  thread: 'DNI rules & smelter co-investment',
  turns: [
    { who: 'user', text: 'What\'s the current Negative Investment List position on nickel midstream? Foreign cap?' },
    { who: 'ai', text: 'Smelting & refining of nickel ore is OPEN to 100% foreign ownership under the Positive Investment List, conditional on partnership with local SMEs.', cite: ['Perpres 10/2021', 'BKPM 4/2021'] },
    { who: 'user', text: 'Can you sketch the typical co-investment structure with state-owned MIND ID? We\'d be looking at minority via convertible.' },
    { who: 'ai', text: 'Most recent precedents used a 3-tier SPV with offshore HoldCo. Pinned a structure diagram + comp set →' },
  ],
};

// ─────────────────────────────────────────────────────────────
// 4. DEAL PIPELINE  (clean, CRM-ish)
//    Project sits at a stage; chat is contextual to the stage card
// ─────────────────────────────────────────────────────────────
function W4Pipeline() {
  const stages = [
    { name: 'Scoping', count: 3, current: false },
    { name: 'Diligence', count: 2, current: true },
    { name: 'Structuring', count: 1, current: false },
    { name: 'IC Approval', count: 1, current: false },
    { name: 'Execution', count: 0, current: false },
  ];
  return (
    <div className="artboard clean" style={{ background: '#f6f6f4' }}>
      {/* top */}
      <div style={{ height: 44, borderBottom: '1px solid #d4d4d4', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 14, background: '#fff' }}>
        <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>BKPM<span style={{ color: '#c8512a' }}>·</span>chat</span>
        <span className="label">org</span>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{MOCK2.org}</span>
        <span style={{ color: '#bbb' }}>/</span>
        <span style={{ fontSize: 13 }}>Pipeline · Indonesia 2026</span>
        <div className="grow" />
        <span className="pill">+ new project</span>
        <span className="pill pill-accent">↗ request analyst</span>
      </div>

      {/* pipeline strip */}
      <div style={{ background: '#fff', borderBottom: '1px solid #d4d4d4', padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {stages.map((s, i) => (
            <div key={s.name} style={{ flex: 1, position: 'relative' }}>
              <div style={{ height: 6, background: i <= 1 ? '#c8512a' : '#e4e2db', borderRadius: 3 }} />
              <div className="label" style={{ marginTop: 6, color: s.current ? '#c8512a' : '#888' }}>{s.name.toUpperCase()} · {s.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="row" style={{ height: 'calc(100% - 44px - 50px)' }}>
        {/* kanban-ish list */}
        <div className="col" style={{ width: 280, borderRight: '1px solid #d4d4d4', background: '#fff', padding: 10, gap: 8 }}>
          <div className="label">Diligence · 2</div>
          <div className="box" style={{ padding: 10, borderLeft: '3px solid #c8512a' }}>
            <div className="mono" style={{ fontSize: 10, color: '#888' }}>SULAWESI.NI</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Nickel Midstream — Sulawesi</div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>$2.4B · convertible · MIND ID JV</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
              <span className="pill">4 threads</span>
              <span className="pill pill-accent2">R. Pratiwi</span>
            </div>
          </div>
          <div className="box" style={{ padding: 10 }}>
            <div className="mono" style={{ fontSize: 10, color: '#888' }}>BATAM.DC</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Data Centers — Batam</div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>$900M · greenfield</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
              <span className="pill">7 threads</span>
            </div>
          </div>

          <div className="label" style={{ marginTop: 10 }}>Scoping · 3</div>
          {['Geothermal — N. Sumatra','EV Battery JV — W. Java','Toll road PPP — Java'].map(p => (
            <div key={p} className="box" style={{ padding: 8, opacity: 0.7 }}>
              <div style={{ fontSize: 13 }}>{p}</div>
            </div>
          ))}
        </div>

        {/* project workspace — chat is one tab */}
        <div className="col grow" style={{ minWidth: 0 }}>
          <div style={{ borderBottom: '1px solid #d4d4d4', padding: '10px 18px', background: '#fff' }}>
            <div className="mono" style={{ fontSize: 10, color: '#888' }}>SULAWESI.NI · DILIGENCE</div>
            <div style={{ fontSize: 18, fontWeight: 500, marginTop: 2 }}>{MOCK2.project}</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
              {['Overview','Threads','Documents','Comps','Memo','Team'].map((t,i) => (
                <span key={t} style={{ padding: '4px 10px', fontSize: 12, borderBottom: i === 1 ? '2px solid #c8512a' : '2px solid transparent', color: i === 1 ? '#c8512a' : '#666', fontWeight: i === 1 ? 600 : 400 }}>{t}</span>
              ))}
            </div>
          </div>

          <div className="row grow" style={{ minHeight: 0 }}>
            {/* threads list */}
            <div className="col" style={{ width: 220, borderRight: '1px solid #d4d4d4', background: '#fafaf7', padding: 10, gap: 6 }}>
              <div className="label">threads · 4</div>
              <div className="box" style={{ padding: '6px 8px', background: '#fff5ed' }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>DNI / smelter co-invest</div>
                <div className="mono" style={{ fontSize: 10, color: '#888', marginTop: 2 }}>4 turns · 2m</div>
              </div>
              {['Tax holiday eligibility','Power offtake — PLN','ESG / IRMA audit'].map(t => (
                <div key={t} style={{ padding: '6px 8px', fontSize: 12, color: '#444' }}>{t}</div>
              ))}
              <div className="box-dashed" style={{ padding: 6, textAlign: 'center', fontSize: 11, color: '#888', marginTop: 4 }}>+ new thread</div>
            </div>

            {/* chat */}
            <div className="col grow" style={{ minWidth: 0, background: '#fff' }}>
              <div className="col grow scroll" style={{ padding: '16px 24px', gap: 12 }}>
                {MOCK2.turns.map((t, i) => (
                  <div key={i} className="col" style={{ alignItems: t.who === 'user' ? 'flex-end' : 'flex-start', gap: 3 }}>
                    <div className="label">{t.who === 'user' ? 'YOU' : 'BKPM AI'}</div>
                    <div className={'bubble ' + (t.who === 'user' ? 'bubble-user' : '')} style={{ fontSize: 13, lineHeight: 1.5 }}>{t.text}</div>
                    {t.cite && <div style={{ display: 'flex', gap: 4 }}>{t.cite.map(c => <span key={c} className="pill">{c}</span>)}</div>}
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid #d4d4d4', padding: 14, background: '#fafaf7' }}>
                <div className="box" style={{ padding: '10px 12px', minHeight: 50 }}>
                  <span style={{ color: '#aaa', fontSize: 13 }}>Ask about regulations, structure, comps, or @mention an analyst…</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <span className="pill">+ attach</span>
                  <span className="pill pill-accent">↗ refer to human</span>
                  <div className="grow" />
                  <span className="pill pill-accent2">send</span>
                </div>
              </div>
            </div>

            {/* deal sidebar */}
            <div className="col" style={{ width: 220, borderLeft: '1px solid #d4d4d4', background: '#fafaf7', padding: 12, gap: 10 }}>
              <div className="label">deal facts</div>
              <div style={{ fontSize: 11 }}><span style={{ color: '#888' }}>Stage</span><div>Diligence</div></div>
              <div style={{ fontSize: 11 }}><span style={{ color: '#888' }}>Ticket</span><div>$400M (minority)</div></div>
              <div style={{ fontSize: 11 }}><span style={{ color: '#888' }}>Counterparty</span><div>MIND ID</div></div>
              <div style={{ fontSize: 11 }}><span style={{ color: '#888' }}>Lead</span><div>You</div></div>
              <div style={{ fontSize: 11 }}><span style={{ color: '#888' }}>BKPM contact</span><div>R. Pratiwi</div></div>
              <div className="label" style={{ marginTop: 6 }}>next</div>
              <div className="box" style={{ padding: 8, fontSize: 11 }}>
                <div>☐ Confirm SME partner shortlist</div>
                <div style={{ marginTop: 4 }}>☐ IC pre-read by 5/4</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. DATA ROOM  (sketchy)
//    Files & folders primary, chat is annotation + Q&A on docs
// ─────────────────────────────────────────────────────────────
function W5DataRoom() {
  return (
    <div className="artboard sketch" style={{ background: '#fafaf7' }}>
      <div style={{ height: 38, borderBottom: '1.5px solid #1a1a1a', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10, background: '#f3f2ec' }}>
        <span className="hand" style={{ fontSize: 20, fontWeight: 700 }}>data room</span>
        <span className="hand-mono" style={{ fontSize: 12, color: '#666' }}>{MOCK2.org} / {MOCK2.project}</span>
        <div className="grow" />
        <span className="pill">42 docs</span>
        <span className="pill">8 threads</span>
        <span className="pill pill-accent">↗ ask analyst</span>
      </div>

      <div className="row" style={{ height: 'calc(100% - 38px)' }}>
        {/* folders */}
        <div className="col" style={{ width: 220, borderRight: '1.5px solid #1a1a1a', background: '#f3f2ec', padding: 12, gap: 4 }}>
          <div className="hand-mono" style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>folders</div>
          {[
            ['📁 01 Regulatory', 12, true],
            ['📁 02 Comps & Models', 8, false],
            ['📁 03 Structuring', 6, false],
            ['📁 04 ESG', 5, false],
            ['📁 05 Counterparty', 4, false],
            ['📁 06 Memos', 7, false],
          ].map(([n, c, active]) => (
            <div key={n} className={active ? 'box' : ''} style={{ padding: '5px 8px', background: active ? '#fde68a' : 'transparent' }}>
              <span className="hand" style={{ fontSize: 14 }}>{n}</span>
              <span className="hand-mono" style={{ fontSize: 11, color: '#888', marginLeft: 6 }}>{c}</span>
            </div>
          ))}
          <div className="box-dashed" style={{ padding: 6, textAlign: 'center', marginTop: 8 }}><span className="hand" style={{ fontSize: 13 }}>+ folder</span></div>
        </div>

        {/* doc viewer */}
        <div className="col grow" style={{ minWidth: 0, padding: 16 }}>
          <div className="hand-mono" style={{ fontSize: 11, color: '#888' }}>01 Regulatory · perpres-10-2021.pdf</div>
          <div className="hand" style={{ fontSize: 22, marginTop: 2 }}>Perpres 10/2021 — Annex II §C(7)</div>

          <div className="box" style={{ padding: 18, marginTop: 12, flex: 1, position: 'relative' }}>
            <div className="hand" style={{ fontSize: 14, lineHeight: 1.6, color: '#333' }}>
              <div className="bar-text" style={{ width: '95%', marginBottom: 8 }} />
              <div className="bar-text" style={{ width: '88%', marginBottom: 8 }} />
              <div style={{ background: '#fde68a', padding: '4px 6px', display: 'inline-block', margin: '4px 0' }}>
                "Smelting & refining of nickel ore shall be open to foreign capital up to 100%, subject to partnership with national SMEs…"
              </div>
              <div className="bar-text" style={{ width: '92%', marginTop: 8 }} />
              <div className="bar-text" style={{ width: '70%', marginTop: 8 }} />
              <div className="bar-text" style={{ width: '85%', marginTop: 8 }} />
              <div className="bar-text" style={{ width: '60%', marginTop: 8 }} />
              <div className="bar-text" style={{ width: '90%', marginTop: 18 }} />
              <div className="bar-text" style={{ width: '78%', marginTop: 8 }} />
            </div>

            {/* annotation pin */}
            <div style={{ position: 'absolute', top: 80, right: 30, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#c8512a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Caveat', fontWeight: 700, fontSize: 13 }}>?</div>
              <div className="box" style={{ padding: 8, width: 200, background: '#fff' }}>
                <div className="hand-mono" style={{ fontSize: 10, color: '#888' }}>YOU · 2m ago</div>
                <div className="hand" style={{ fontSize: 13 }}>does "national SMEs" include majority-foreign Indonesian SPVs?</div>
                <div className="hand-mono" style={{ fontSize: 10, color: '#2d6a5a', marginTop: 4 }}>↳ AI replied · open thread</div>
              </div>
            </div>
          </div>
        </div>

        {/* chat panel — anchored to doc */}
        <div className="col" style={{ width: 320, borderLeft: '1.5px solid #1a1a1a', background: '#fafaf7' }}>
          <div style={{ padding: '8px 12px', borderBottom: '1.5px solid #1a1a1a', background: '#f3f2ec' }}>
            <div className="hand-mono" style={{ fontSize: 10, color: '#888' }}>thread on perpres-10-2021.pdf</div>
            <div className="hand" style={{ fontSize: 16, fontWeight: 700 }}>{MOCK2.thread}</div>
          </div>

          <div className="col grow scroll" style={{ padding: 12, gap: 10 }}>
            <div className="hand-mono" style={{ fontSize: 10, color: '#888', textAlign: 'center' }}>— pinned to highlight on p.14 —</div>
            {MOCK2.turns.map((t, i) => (
              <div key={i} className="col" style={{ alignItems: t.who === 'user' ? 'flex-end' : 'flex-start', gap: 3 }}>
                <div className={'bubble ' + (t.who === 'user' ? 'bubble-user' : '')} style={{ maxWidth: '90%' }}>
                  <span className="hand" style={{ fontSize: 14, lineHeight: 1.3 }}>{t.text}</span>
                </div>
                {t.cite && <div className="hand-mono" style={{ fontSize: 10, color: '#666' }}>↳ cites this doc + 1 more</div>}
              </div>
            ))}
            <div className="box-dashed" style={{ padding: 8, marginTop: 8 }}>
              <div className="hand-mono" style={{ fontSize: 10, color: '#666' }}>SUGGEST · ai</div>
              <div className="hand" style={{ fontSize: 13 }}>shall I escalate the SME-definition question to BKPM legal? (R. Pratiwi)</div>
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                <span className="pill pill-accent">yes, refer</span>
                <span className="pill">later</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1.5px solid #1a1a1a', padding: 10 }}>
            <div className="box" style={{ padding: 8, minHeight: 44 }}>
              <span className="hand" style={{ fontSize: 14, color: '#aaa' }}>ask about this doc…</span>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky" style={{ top: 70, left: 240 }}>chat = Q&A on docs<br/>highlights → threads</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. ANALYST-PAIR  (clean)
//    Chat-first; persistent analyst presence strip; handoff is hero
// ─────────────────────────────────────────────────────────────
function W6AnalystPair() {
  return (
    <div className="artboard clean" style={{ background: '#f6f6f4' }}>
      <div style={{ height: 44, borderBottom: '1px solid #d4d4d4', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, background: '#fff' }}>
        <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>BKPM<span style={{ color: '#c8512a' }}>·</span>chat</span>
        <span style={{ fontSize: 13 }}>{MOCK2.org} / {MOCK2.project}</span>
        <span className="pill" style={{ marginLeft: 4 }}>{MOCK2.thread}</span>
        <div className="grow" />
        <span className="label">analysts on call</span>
        <div style={{ display: 'flex', gap: -4 }}>
          {['RP','AW','SH'].map((a, i) => (
            <div key={a} style={{ width: 26, height: 26, borderRadius: '50%', background: ['#c8512a','#2d6a5a','#888'][i], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, marginLeft: i ? -8 : 0, border: '2px solid #fff' }}>{a}</div>
          ))}
        </div>
      </div>

      <div className="row" style={{ height: 'calc(100% - 44px)' }}>
        {/* left: org/project nav (compressed) */}
        <div className="col" style={{ width: 200, borderRight: '1px solid #d4d4d4', background: '#fafaf7', padding: 12, gap: 8 }}>
          <div className="label">workspace</div>
          <div style={{ fontSize: 12 }}>▾ {MOCK2.org}</div>
          <div style={{ paddingLeft: 10, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
            <span style={{ background: '#fff5ed', padding: '3px 6px', borderLeft: '2px solid #c8512a' }}>● Sulawesi Ni</span>
            <span style={{ color: '#666' }}>N. Sumatra Geo</span>
            <span style={{ color: '#666' }}>Batam DC</span>
            <span style={{ color: '#666' }}>W. Java EVB</span>
          </div>
          <div className="label" style={{ marginTop: 8 }}>threads</div>
          <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontWeight: 500 }}>► DNI / smelter</span>
            <span style={{ color: '#666' }}>Tax holiday</span>
            <span style={{ color: '#666' }}>PLN offtake</span>
            <span style={{ color: '#666' }}>IRMA audit</span>
          </div>
        </div>

        {/* center: chat */}
        <div className="col grow" style={{ minWidth: 0, background: '#fff' }}>
          {/* analyst presence ribbon */}
          <div style={{ background: '#f3efe8', borderBottom: '1px solid #d4d4d4', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#c8512a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>RP</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Rina Pratiwi · Sr. Analyst, BKPM SE Asia</div>
              <div style={{ fontSize: 11, color: '#666' }}>Watching this thread · usually replies in 2h · 9 prior interactions with you</div>
            </div>
            <span className="pill pill-accent">Pull her in →</span>
            <span className="pill">Book 30m</span>
          </div>

          <div className="col grow scroll" style={{ padding: '20px 28px', gap: 14 }}>
            <div style={{ textAlign: 'center', fontSize: 11, color: '#888' }} className="mono">— THREAD STARTED 14:00 WIB · 26 APR 2026 —</div>
            {MOCK2.turns.map((t, i) => (
              <div key={i} className="col" style={{ alignItems: t.who === 'user' ? 'flex-end' : 'flex-start', gap: 4, maxWidth: '100%' }}>
                <div className="label">{t.who === 'user' ? 'YOU · Khazanah' : 'BKPM AI'}</div>
                <div className={'bubble ' + (t.who === 'user' ? 'bubble-user' : '')} style={{ fontSize: 14, lineHeight: 1.5, maxWidth: 600 }}>
                  {t.text}
                </div>
                {t.cite && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                    {t.cite.map(c => <span key={c} className="pill">📄 {c}</span>)}
                  </div>
                )}
              </div>
            ))}

            {/* AI suggests handoff */}
            <div className="box" style={{ padding: 12, background: '#fff5ed', borderLeft: '3px solid #c8512a', maxWidth: 600 }}>
              <div className="label" style={{ color: '#c8512a' }}>AI · suggested handoff</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                Convertible structuring with MIND ID has IC-level nuance. <b>Rina Pratiwi</b> structured the Konawe deal — want me to loop her in?
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <span className="pill pill-accent">Yes, ask Rina</span>
                <span className="pill">Schedule call</span>
                <span className="pill">Not yet</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #d4d4d4', padding: 14, background: '#fafaf7' }}>
            <div className="box" style={{ padding: '10px 14px', minHeight: 56 }}>
              <span style={{ color: '#aaa', fontSize: 13 }}>Continue the thread, drop a doc, or @rina to bring her in…</span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
              <span className="pill">+ attach</span>
              <span className="pill">@rina</span>
              <span className="pill">/ comp</span>
              <span className="pill">/ memo</span>
              <div className="grow" />
              <span className="pill pill-accent2">send ⏎</span>
            </div>
          </div>
        </div>

        {/* right: shared canvas / artifacts */}
        <div className="col" style={{ width: 260, borderLeft: '1px solid #d4d4d4', background: '#fafaf7', padding: 12, gap: 8 }}>
          <div className="label">shared canvas</div>
          <div style={{ fontSize: 11, color: '#666' }}>artifacts the AI + analyst pin here</div>
          {[
            ['DOC','Perpres 10/2021 §C(7)'],
            ['MODEL','Comp set · 4 deals'],
            ['DIAGRAM','SPV — 3 tiers'],
            ['MAP','Smelter cluster'],
          ].map(([k, t]) => (
            <div key={t} className="box" style={{ padding: 8 }}>
              <div className="mono" style={{ fontSize: 9, color: '#888' }}>{k}</div>
              <div style={{ fontSize: 12 }}>{t}</div>
              <div className="placeholder-img" style={{ height: 36, marginTop: 6 }}></div>
            </div>
          ))}
          <div className="box-dashed" style={{ padding: 6, textAlign: 'center', fontSize: 11, color: '#888' }}>+ pin from chat</div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { W4Pipeline, W5DataRoom, W6AnalystPair });
