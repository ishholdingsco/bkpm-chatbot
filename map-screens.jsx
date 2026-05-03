/* global React, IndonesiaMap, LeafletMap, LAYERS, DATA, Avatar, AvatarStack, Cite */
// Map page (hero) + Landing + Comparison + Hi-fi vs Mid-fi versions

const { useState: useStateMap } = React;

// ─── Wordmark — uses the shared Logo (Wilaya in Georgia w/ colored dots) ───
function Wordmark({ name, tag = 'BKPM', hifi = false, size = 17 }) {
  return <Logo size={size} showTag={!!tag} />;
}

// ─── Layer panel ───
function LayerPanel({ active, onToggle, hifi }) {
  return (
    <div className={'card ' + (hifi ? 'hifi' : '')} style={{
      position: 'absolute', top: 16, left: 16, width: 260,
      padding: 12, zIndex: 3,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <span className="label">Layers</span>
        <span className="chip" style={{ marginLeft: 6, fontSize: 9 }}>{Object.values(active).filter(Boolean).length} on</span>
        <div className="grow" />
        <button className="btn btn-sm btn-ghost" style={{ padding: 2, fontSize: 11 }}>⌄</button>
      </div>
      {LAYERS.map(l => (
        <div key={l.id} className={'layer-pill ' + (active[l.id] ? 'active' : '')} onClick={() => onToggle(l.id)}>
          <div className="layer-swatch" style={{ background: l.color, opacity: active[l.id] ? 1 : 0.3 }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.2 }}>{l.name}</div>
            <div className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', marginTop: 2 }}>{l.desc}</div>
          </div>
          <div style={{
            width: 24, height: 14, borderRadius: 7,
            background: active[l.id] ? '#4264fb' : '#cfc6b0',
            position: 'relative', flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute', top: 1, left: active[l.id] ? 11 : 1,
              width: 12, height: 12, borderRadius: '50%', background: '#fff',
              transition: 'left 0.15s',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Map controls (zoom, locate) ───
function MapControls() {
  return (
    <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 3, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="map-control">
        <button>＋</button>
        <button>−</button>
      </div>
      <div className="map-control">
        <button title="Locate">⌖</button>
        <button title="Compass">⌥</button>
      </div>
    </div>
  );
}

// ─── Chat sidebar (collapsible, contextual to map) ───
function MapChat({ open, onToggle, hifi }) {
  if (!open) {
    return (
      <button className={'btn ' + (hifi ? 'hifi' : '')}
        onClick={onToggle}
        style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 4, background: '#1a1a2e', color: '#fff', borderColor: '#1a1a2e', padding: '10px 14px', borderRadius: 24, boxShadow: '0 6px 16px rgba(20,20,40,0.2)' }}>
        💬 Ask about this map
      </button>
    );
  }
  return (
    <div className={'col ' + (hifi ? 'hifi' : '')} style={{ width: 340, borderLeft: '1px solid var(--line)', background: 'var(--surface)' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar name="AI" color="#1a1a2e" size="sm" status="online" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>Ask Nusantara</div>
          <div className="mono" style={{ fontSize: 9, color: 'var(--ink-3)' }}>Reading: 3 layers active · viewing Sulawesi</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onToggle} style={{ padding: 4 }}>›</button>
      </div>
      <div className="scroll col grow" style={{ padding: '14px', gap: 14 }}>
        <div style={{ alignSelf: 'flex-end', background: 'var(--surface-3)', padding: '8px 12px', borderRadius: 10, fontSize: 13, maxWidth: '85%' }}>
          What's driving the cluster of nickel sites in Sulawesi?
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.55 }}>
          The eastern Sulawesi belt sits on the world's largest laterite nickel reserves (~21M tonnes Ni content). Three forces concentrated activity here:
          <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
            <li>2014/2020 raw-ore export ban → forced domestic smelting</li>
            <li>IMIP & IWIP industrial parks operationalized 2015–2020</li>
            <li>EV battery supply-chain pull from CN/KR partners</li>
          </ul>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            <Cite>UU Minerba 3/2020</Cite>
            <Cite>BKPM Realisasi 2024</Cite>
          </div>
        </div>
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 8, padding: 12 }}>
          <div className="label" style={{ marginBottom: 6 }}>Suggested follow-ups</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {['Show only KEK + WIUP overlap','Median EV/EBITDA for nickel deals 2023–25','Compare Sulawesi vs Halmahera infrastructure'].map(s => (
              <div key={s} style={{ fontSize: 12, padding: '6px 8px', background: '#fff', borderRadius: 6, border: '1px solid var(--line)', cursor: 'pointer' }}>↗ {s}</div>
            ))}
          </div>
        </div>
        <div style={{ alignSelf: 'flex-end', background: 'var(--surface-3)', padding: '8px 12px', borderRadius: 10, fontSize: 13, maxWidth: '85%' }}>
          Show me sites with foreign ownership ≥ 50% and tax holiday active
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>● Filtering map…</div>
      </div>
      <div style={{ borderTop: '1px solid var(--line)', padding: 12 }}>
        <div className="card" style={{ padding: '8px 10px' }}>
          <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>Ask, or try /filter, /compare, /save…</div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <span className="chip">+ save view</span>
          <span className="chip chip-terra">↗ start workspace</span>
        </div>
      </div>
    </div>
  );
}

// ─── Hover tooltip (always shown for demo) ───
function MapTooltip() {
  return (
    <div className="map-tooltip" style={{ top: 230, right: 280 }}>
      <div className="mono" style={{ fontSize: 9, color: 'var(--ink-3)' }}>SULAWESI · MOROWALI</div>
      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>IMIP Industrial Park</div>
      <div style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.4 }}>
        Nickel midstream cluster · 47 tenants
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
        <span className="chip chip-jade chip-dot" style={{ fontSize: 8 }}>KEK active</span>
        <span className="chip" style={{ fontSize: 8 }}>$12.4B FDI</span>
      </div>
    </div>
  );
}

// ─── MAP PAGE — hero ───
function MapPage({ hifi = false, chatOpen, setChatOpen }) {
  const [active, setActive] = useStateMap({
    industrial: true, kek: true, wiup: true, minerals: false,
    gdp: false, infra: false, ports: false,
  });
  return (
    <div className={'frame col ' + (hifi ? 'hifi' : '')}>
      <TopBar
        showOrg={false}
        left={
          <div style={{ display: 'flex', gap: 4 }}>
            {['Map','Sectors','Opportunities','Analysts'].map((t,i) => (
              <span key={t} style={{
                padding: '6px 10px', fontSize: 12.5,
                fontWeight: i === 0 ? 600 : 500,
                color: i === 0 ? 'var(--terracotta)' : 'var(--ink-2)',
                borderBottom: i === 0 ? '2px solid var(--terracotta)' : '2px solid transparent',
                cursor: 'pointer',
              }}>{t}</span>
            ))}
          </div>
        }
        right={
          <>
            <div className="card" style={{ display: 'flex', alignItems: 'center', padding: '4px 10px', gap: 8, background: 'var(--surface-2)', minWidth: 260 }}>
              <span style={{ fontSize: 13, color: 'var(--ink-4)' }}>🔍</span>
              <span style={{ fontSize: 12.5, color: 'var(--ink-4)' }}>Search regions, sectors, projects…</span>
              <div className="grow" />
              <span className="kbd">⌘K</span>
            </div>
            <button className="btn btn-sm btn-ghost">EN</button>
            <button className="btn btn-sm">Sign in</button>
            <button className="btn btn-sm btn-primary">Start a project →</button>
          </>
        }
      />

      <div className="row grow" style={{ minHeight: 0 }}>
        <div className="map-canvas grow" style={{ position: 'relative' }}>
          <MapboxMap center={[120.0, -2.0]} zoom={3.9} bearing={-12} interactive={true} />

          <LayerPanel active={active} onToggle={(id) => setActive({ ...active, [id]: !active[id] })} hifi={hifi} />
          <MapControls />
          <MapTooltip />

          {/* legend / scale bottom-left */}
          <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', gap: 8, alignItems: 'center', zIndex: 3 }}>
            <div className="card" style={{ padding: '6px 10px', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)' }}>0  500km</span>
              <div style={{ width: 60, height: 3, background: 'linear-gradient(to right, #1a1a2e 50%, #fff 50%)', border: '1px solid #1a1a2e' }} />
            </div>
            <div className="card" style={{ padding: '6px 10px' }}>
              <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)' }}>BPS · BKPM · ESDM · 2025</span>
            </div>
          </div>

          {/* opportunity counter top-center */}
          <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 3 }}>
            <div className="card" style={{ padding: '8px 14px', display: 'flex', gap: 14, alignItems: 'center' }}>
              <div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--ink-3)' }}>OPPORTUNITIES IN VIEW</div>
                <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'Source Serif 4' }}>237 <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 400, fontFamily: 'Inter' }}>· $48.2B tracked</span></div>
              </div>
              <div style={{ width: 1, height: 30, background: 'var(--line)' }} />
              <div className="col">
                <span className="chip chip-terra" style={{ fontSize: 9 }}>● 3 featured</span>
                <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', marginTop: 2 }}>matched to your thesis</span>
              </div>
            </div>
          </div>
        </div>

        <MapChat open={chatOpen} onToggle={() => setChatOpen(!chatOpen)} hifi={hifi} />
      </div>
    </div>
  );
}

// ─── PUBLIC LANDING — full-bleed Mapbox map, floating chrome on top ───
function Landing({ name = 'Wilaya', hifi = false, mapStyle }) {
  return (
    <div className={'frame col ' + (hifi ? 'hifi' : '')} style={{ background: 'var(--bg)', position: 'relative' }}>
      {/* full-bleed map underlay */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <MapboxMap center={[118.5, -1.5]} zoom={4.05} bearing={-12} interactive={true} style={mapStyle} />
      </div>

      {/* floating top nav — pill shape, sits over the map */}
      <div style={{
        position: 'absolute', top: 18, left: 18, right: 18, zIndex: 5,
        height: 56, background: '#fff',
        borderRadius: 14,
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 6px 24px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.6) inset',
        display: 'flex', alignItems: 'center', padding: '0 22px', gap: 18,
      }}>
        <Wordmark name={name} hifi={hifi} />
        <div className="grow" />
        <div style={{ display: 'flex', gap: 22, fontSize: 13 }}>
          {['Explore the map','Sectors','Why Indonesia','Analysts','Pricing'].map((t, i) => (
            <span key={t} style={{
              color: i === 0 ? '#1a1a2e' : 'var(--ink-2)',
              fontWeight: i === 0 ? 600 : 400,
              cursor: 'pointer',
            }}>{t}</span>
          ))}
        </div>
        <span style={{ width: 1, height: 22, background: 'var(--line)' }} />
        <button className="btn btn-sm btn-ghost">Sign in</button>
        <button className="btn btn-sm btn-primary">Start exploring →</button>
      </div>

      {/* copy card — bottom-left, floating over the map */}
      <div style={{
        position: 'absolute', left: 28, bottom: 28, zIndex: 5,
        width: 460, padding: '26px 28px',
        background: '#fff',
        borderRadius: 18,
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 18px 48px rgba(0,0,0,0.18), 0 2px 0 rgba(255,255,255,0.7) inset',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#51b749' }} />
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.14em' }}>
            INDONESIA INVESTMENT INTELLIGENCE · LIVE
          </span>
        </div>

        <h1 className="serif" style={{
          fontSize: hifi ? 38 : 34, fontWeight: 600, lineHeight: 1.08, letterSpacing: '-0.024em',
          margin: 0, color: '#1a1a2e', textWrap: 'balance',
        }}>
          The world's <span style={{ color: 'var(--terracotta)' }}>$1.5T</span> growth story, mapped down to the parcel.
        </h1>

        <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2)', margin: 0, textWrap: 'pretty' }}>
          17,508 islands. 142 industrial estates. 22 special economic zones. Every concession,
          corridor and incentive — overlaid on one live atlas.
        </p>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ padding: '10px 18px', fontSize: 13.5, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Explore the map →
          </button>
          <button className="btn" style={{ padding: '10px 16px', fontSize: 13.5 }}>Browse 38 sectors</button>
        </div>

        <div style={{
          display: 'flex', gap: 12, alignItems: 'center',
          paddingTop: 12, borderTop: '1px solid var(--line)',
        }}>
          <AvatarStack items={DATA.analysts} max={3} />
          <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>
            <BKPM />&nbsp;<b>23 analysts</b> online · avg reply 4 min
          </span>
        </div>
      </div>

      {/* legend chip — small, top-right under nav */}
      <div style={{
        position: 'absolute', top: 92, right: 18, zIndex: 5,
        background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(6px)',
        border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10,
        padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6,
        boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
      }}>
        <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.14em' }}>OVERLAYS</span>
        {[
          ['#f7b500', 'Industrial estates · 142'],
          ['#7e4dd9', 'Special economic zones · 22'],
          ['#c44a36', 'Featured opportunities'],
        ].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--ink-2)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: c, opacity: 0.7, border: `1px solid ${c}` }} />
            {l}
          </div>
        ))}
      </div>

      {/* compact stats strip — bottom-right, mirrors copy card */}
      <div style={{
        position: 'absolute', right: 28, bottom: 28, zIndex: 5,
        display: 'flex', flexDirection: 'column', gap: 8,
        background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(6px)',
        border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14,
        padding: '14px 18px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
      }}>
        <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.14em' }}>ATLAS · LIVE</span>
        {[
          ['$48.2B', 'tracked opportunities'],
          ['237',    'live projects'],
          ['38',     'sectors covered'],
        ].map(([n, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'baseline', gap: 8, justifyContent: 'space-between' }}>
            <span className="serif" style={{ fontSize: 18, fontWeight: 600, color: '#1a1a2e' }}>{n}</span>
            <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.10em' }}>{l.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PROJECT COMPARISON ───
function CompareView({ hifi = false }) {
  const projects = [
    { name: 'Nickel Midstream — Sulawesi', short: 'SULAWESI.NI', sector: 'Critical minerals', ticket: '$400M', irr: '18.2%', payback: '6.4 yr', risk: 'Med', stage: 'Diligence', star: true,
      facts: { ownership: '100% foreign OK', incentives: 'Tax holiday 15y', counterparty: 'MIND ID', timeline: '24 mo to FID' } },
    { name: 'Geothermal — N. Sumatra', short: 'NSUMATRA.GEO', sector: 'Renewable energy', ticket: '$180M', irr: '12.5%', payback: '8.1 yr', risk: 'Low', stage: 'Scoping', star: false,
      facts: { ownership: '95% foreign OK', incentives: 'Tax holiday 10y', counterparty: 'PLN', timeline: '36 mo to FID' } },
    { name: 'Data Centers — Batam', short: 'BATAM.DC', sector: 'Digital infra', ticket: '$220M', irr: '15.8%', payback: '5.2 yr', risk: 'Low', stage: 'Diligence', star: false,
      facts: { ownership: '100% foreign OK', incentives: 'KEK + FTZ', counterparty: 'BP Batam', timeline: '12 mo to FID' } },
  ];
  const rows = [
    ['Sector', p => p.sector],
    ['Ticket size', p => p.ticket],
    ['Target IRR', p => p.irr],
    ['Payback', p => p.payback],
    ['Risk profile', p => p.risk],
    ['Stage', p => p.stage],
    ['Foreign ownership', p => p.facts.ownership],
    ['Incentives', p => p.facts.incentives],
    ['Counterparty', p => p.facts.counterparty],
    ['Timeline', p => p.facts.timeline],
  ];
  return (
    <div className={'frame col ' + (hifi ? 'hifi' : '')} style={{ background: 'var(--surface)' }}>
      <TopBar
        showOrg={false}
        left={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <button className="btn btn-sm btn-ghost">← Workspace</button>
            <span style={{ color: 'var(--ink-4)' }}>/</span>
            <span style={{ fontWeight: 500 }}>{DATA.org.name}</span>
            <span style={{ color: 'var(--ink-4)' }}>/</span>
            <span style={{ fontWeight: 600 }}>Compare · 3 projects</span>
          </div>
        }
        right={
          <>
            <button className="btn btn-sm">+ Add project</button>
            <button className="btn btn-sm">Export to memo</button>
            <button className="btn btn-sm btn-primary">Share comparison</button>
          </>
        }
      />

      <div className="scroll col grow" style={{ padding: '24px 32px', gap: 20 }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>SHORTLIST</div>
          <h1 className="serif" style={{ fontSize: 26, fontWeight: 600, margin: '4px 0 0', letterSpacing: '-0.01em' }}>3 opportunities, head-to-head</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '4px 0 0' }}>Pulled from your active projects · Updated 14:08 WIB</p>
        </div>

        {/* project header cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '200px repeat(3, 1fr)', gap: 0 }}>
          <div />
          {projects.map(p => (
            <div key={p.short} className="card" style={{ padding: 16, marginRight: 8, position: 'relative', borderTop: p.star ? '3px solid var(--terracotta)' : '3px solid transparent' }}>
              {p.star && (
                <span className="chip chip-terra" style={{ position: 'absolute', top: 10, right: 10, fontSize: 9 }}>★ Best fit</span>
              )}
              <div className="mono" style={{ fontSize: 9, color: 'var(--ink-3)' }}>{p.short}</div>
              <div className="serif" style={{ fontSize: 16, fontWeight: 600, marginTop: 4, lineHeight: 1.25 }}>{p.name}</div>
              <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                <span className="chip chip-jade" style={{ fontSize: 9 }}>{p.stage}</span>
                <span className="chip" style={{ fontSize: 9 }}>{p.risk} risk</span>
              </div>
            </div>
          ))}
        </div>

        {/* comparison rows */}
        <div className="compare-grid">
          {rows.map(([label, getter]) => (
            <React.Fragment key={label}>
              <div className="row-head">{label}</div>
              {projects.map(p => {
                const v = getter(p);
                const isIRR = label === 'Target IRR';
                return (
                  <div key={p.short} style={{ fontWeight: isIRR && p.star ? 600 : 400, color: isIRR && p.star ? 'var(--terracotta)' : 'inherit' }}>
                    {v}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* AI synthesis */}
        <div className="card" style={{ padding: 16, borderLeft: '3px solid var(--terracotta)', background: 'var(--surface-2)' }}>
          <div className="label" style={{ color: 'var(--terracotta)', marginBottom: 6 }}>● <BKPM /> AI · synthesis</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
            Sulawesi Ni leads on IRR but carries the highest execution risk and longest path to FID. Batam DC offers the fastest deployment and structurally similar incentives at half the ticket. <b>If you're optimizing for J-curve, Batam first → Sulawesi second.</b> Want me to draft an IC pre-read on this sequencing?
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button className="btn btn-sm btn-primary">Draft IC pre-read</button>
            <button className="btn btn-sm">Ask Rina to weigh in</button>
            <button className="btn btn-sm btn-ghost">Save synthesis</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ONBOARDING REFRESH (now starts from "you tapped a pin") ───
function OnboardingFromMap() {
  return (
    <div className="frame col" style={{ background: 'var(--surface)' }}>
      <TopBar
        showOrg={false}
        right={<span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>Step 1 of 2</span>}
      />
      <div className="row grow" style={{ minHeight: 0 }}>
        {/* left: dimmed map showing the pin they tapped */}
        <div className="map-canvas" style={{ width: '50%', position: 'relative' }}>
          <MapboxMap center={[121.5, -2.5]} zoom={5.2} bearing={-10} interactive={false} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,247,230,0.18)', pointerEvents: 'none' }} />
          {/* highlight ring on Morowali */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', border: '2px solid var(--bkpm-blue)', background: 'rgba(0,85,166,0.06)' }} />
          </div>
        </div>
        <div className="col grow" style={{ padding: '40px 48px', justifyContent: 'center', maxWidth: 560 }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>YOU TAPPED · IMIP MOROWALI</div>
          <h1 className="serif" style={{ fontSize: 28, fontWeight: 500, margin: '4px 0 8px', letterSpacing: '-0.015em' }}>
            Continue exploring as a guest, or start a <span style={{ color: 'var(--terracotta)' }}>project</span>
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55, margin: '0 0 20px' }}>
            A project gives you persistent threads, a shared canvas with your team, and direct access to <BKPM /> analysts covering this sector.
          </p>
          <div className="card" style={{ padding: 18, marginBottom: 16 }}>
            <div className="label" style={{ marginBottom: 10 }}>Your investment thesis</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {[['Critical minerals',true],['Renewable energy',true],['Digital infra',false],['EV battery',true],['Manufacturing',false]].map(([s,sel]) => (
                <span key={s} className={'chip ' + (sel ? 'chip-terra' : '')} style={{ cursor: 'pointer', padding: '5px 10px' }}>{sel && '✓ '}{s}</span>
              ))}
            </div>
            <div className="label" style={{ marginBottom: 8 }}>Ticket size</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['<$50M','$50–250M','$250M–$1B','>$1B'].map((s,i) => (
                <span key={s} className={'chip ' + (i === 2 ? 'chip-terra' : '')} style={{ cursor: 'pointer', fontSize: 11 }}>{i === 2 && '✓ '}{s}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn">Keep exploring</button>
            <button className="btn btn-primary" style={{ flex: 1 }}>Start project from this pin →</button>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
            <AvatarStack items={DATA.analysts} max={3} />
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>3 analysts cover Sulawesi critical minerals · usually reply &lt; 2h</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BRAND CONTEXT — show the Wilaya wordmark across surfaces ───
function BrandVariations() {
  return (
    <div className="frame col" style={{ background: 'var(--surface-2)', padding: 36, gap: 22, overflow: 'auto' }}>
      <div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>BRAND</div>
        <h1 className="serif" style={{ fontSize: 26, fontWeight: 600, margin: '4px 0 0', letterSpacing: '-0.01em' }}>
          The Wilaya wordmark
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '4px 0 0', maxWidth: 580, lineHeight: 1.55 }}>
          "Wilaya" set in Georgia regular, with two trailing dots — left dot in <span style={{ color: '#0055a6', fontWeight: 600 }}>BKPM blue</span>, right dot in <span style={{ color: '#3a8a35', fontWeight: 600 }}>BKPM green</span> — co-locked with the official BKPM agency mark.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        {/* Hero scale */}
        <div className="card" style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <Logo size={48} />
        </div>
        {/* On dark */}
        <div style={{ background: '#0c1a2e', borderRadius: 8, padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, color: '#fff' }}>
            <span style={{
              fontFamily: 'Georgia, serif', fontSize: 36, fontWeight: 400, letterSpacing: '-0.01em', lineHeight: 1, color: '#fff',
            }}>
              Wilaya<span style={{ color: '#5b9ee0' }}>.</span><span style={{ color: '#7fd97a' }}>.</span>
            </span>
            <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.2)' }} />
            <img src="assets/bkpm-logo.png" alt="BKPM" style={{ height: 44, width: 'auto', display: 'block' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        {/* Without BKPM mark */}
        <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)' }}>STANDALONE</span>
          <Logo size={26} showTag={false} />
          <div style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.5 }}>In-product, where BKPM context is implied.</div>
        </div>
        {/* With BKPM mark */}
        <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)' }}>CO-LOCKED</span>
          <Logo size={20} showTag={true} />
          <div style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.5 }}>Public surfaces — landing, signed-out, marketing.</div>
        </div>
        {/* Inline mention */}
        <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)' }}>INLINE MENTION</span>
          <div style={{ fontSize: 14, lineHeight: 1.5 }}>
            "Pulled from <BKPM size={13} /> realisasi data."
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.5 }}>The agency mark, scaled to cap height, baseline-aligned.</div>
        </div>
      </div>

      {/* Color tokens */}
      <div className="card" style={{ padding: 20 }}>
        <div className="label" style={{ marginBottom: 12 }}>Brand color tokens</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            ['BKPM blue',   '#0055a6', 'Primary CTAs, focus, online status'],
            ['BKPM green',  '#51b749', 'Wordmark accent, success'],
            ['Slate accent','#3a6a96', 'Headlines, breadcrumbs, decorative'],
            ['Ink',         '#1c1a14', 'Body copy, headings'],
          ].map(([name, hex, use]) => (
            <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ width: '100%', height: 48, background: hex, borderRadius: 4 }} />
              <div style={{ fontSize: 12, fontWeight: 600 }}>{name}</div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--ink-3)' }}>{hex.toUpperCase()}</div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-2)', lineHeight: 1.4 }}>{use}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── FIDELITY COMPARISON: side-by-side same screen ───
function FidelityCompare() {
  return (
    <div className="frame" style={{ background: 'var(--surface-2)', padding: 24, overflow: 'auto' }}>
      <div style={{ marginBottom: 14 }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>FIDELITY · SIDE BY SIDE</div>
        <h1 className="serif" style={{ fontSize: 22, fontWeight: 600, margin: '2px 0 4px', letterSpacing: '-0.01em' }}>Mid-fi vs Hi-fi · same screen</h1>
        <p style={{ fontSize: 12.5, color: 'var(--ink-2)', margin: 0 }}>
          Mid-fi: real type + spacing, basic visual hierarchy, neutral grays. Hi-fi: same content + softer corners, real shadows, refined typography weight, signal/accent color promoted, polished cards. Same skeleton, different finish.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* Mid-fi card sample */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <span className="mono" style={{ fontSize: 11, fontWeight: 600 }}>MID-FI</span>
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>functional · neutral</span>
          </div>
          <div style={{ background: '#f6f3ec', border: '1px solid #e6e0d2', borderRadius: 4, padding: 18 }}>
            <div className="card" style={{ padding: 14, borderRadius: 4 }}>
              <div className="mono" style={{ fontSize: 9, color: '#7a7466' }}>SULAWESI.NI</div>
              <div style={{ fontSize: 15, fontWeight: 500, marginTop: 4 }}>Nickel Midstream — Sulawesi</div>
              <div style={{ fontSize: 11, color: '#5a5a6e', marginTop: 4 }}>$2.4B · convertible · MIND ID JV</div>
              <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 999, background: '#dfeae0', color: '#2f6a4f' }}>Diligence</span>
                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 999, background: '#fbf8f1', color: '#5a5a6e' }}>Med risk</span>
              </div>
              <button style={{ marginTop: 12, padding: '6px 12px', fontSize: 12, background: '#0055a6', color: '#fff', border: 'none', borderRadius: 4 }}>Open project</button>
            </div>
          </div>
        </div>

        {/* Hi-fi card sample */}
        <div className="hifi">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--terracotta)' }}>HI-FI</span>
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>polished · branded</span>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #f6f3ec, #fbe8dc 200%)', borderRadius: 12, padding: 22 }}>
            <div className="card" style={{ padding: 18, borderRadius: 10, boxShadow: '0 8px 24px rgba(20,20,40,0.08), 0 2px 4px rgba(20,20,40,0.04)', borderColor: '#e8e3d4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0055a6' }} />
                <span className="mono" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: '#7a7466' }}>SULAWESI.NI</span>
              </div>
              <div className="serif" style={{ fontSize: 18, fontWeight: 600, marginTop: 4, letterSpacing: '-0.015em', color: '#1a1a2e' }}>Nickel Midstream — Sulawesi</div>
              <div style={{ fontSize: 12, color: '#4a463a', marginTop: 6, lineHeight: 1.45 }}>$2.4B · convertible · MIND ID JV</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 6, background: '#dfeae0', color: '#2f6a4f', fontWeight: 500 }}>● Diligence</span>
                <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.04)', color: '#5a5a6e', fontWeight: 500 }}>Med risk</span>
              </div>
              <button style={{ marginTop: 14, padding: '8px 14px', fontSize: 12.5, fontWeight: 500, background: '#0055a6', color: '#fff', border: 'none', borderRadius: 6, boxShadow: '0 2px 6px rgba(0,85,166,0.3)' }}>Open project →</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, padding: 16, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13, lineHeight: 1.55 }}>
        <div className="label" style={{ marginBottom: 8 }}>What changed</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--ink-2)' }}>
          <li><b>Corner radius</b>: 4px → 10px (softer, more product-feeling)</li>
          <li><b>Headline</b>: Inter 500 → Source Serif 600 (gives weight & editorial feel)</li>
          <li><b>Background</b>: flat → subtle gradient (depth without noise)</li>
          <li><b>Status chip</b>: rounded pill → 6px tag with status dot (more iOS-like, less generic)</li>
          <li><b>Button</b>: flat → soft drop shadow + arrow affordance</li>
          <li><b>Code label</b>: gets a colored dot anchor — more brand-voiced, less utilitarian</li>
        </ul>
      </div>
    </div>
  );
}

Object.assign(window, { Wordmark, MapPage, Landing, CompareView, OnboardingFromMap, BrandVariations, FidelityCompare });
