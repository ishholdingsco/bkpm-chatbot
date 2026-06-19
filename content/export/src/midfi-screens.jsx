/* global React, DATA, Avatar, AvatarStack, Logo, Cite, ArtifactCard */
// Empty state, Handoff modal, Canvas focus, Notifications, Onboarding

const { useState: useStateAux } = React;

// ─────────────────────────────────────────────────────────────
// Empty state — new project, no threads
// ─────────────────────────────────────────────────────────────
function EmptyState() {
  const starters = [
    { icon: '§', label: 'What\'s the foreign-ownership cap on this sector?', tag: 'Regulatory' },
    { icon: '◇', label: 'Show me comparable deals in the last 24 months', tag: 'Comps' },
    { icon: '⌘', label: 'Sketch a typical SPV structure with a state-owned partner', tag: 'Structure' },
    { icon: '☉', label: 'What tax incentives apply (tax holiday, super-deduction)?', tag: 'Tax' },
    { icon: '⛰', label: 'Which provinces host the active sites for this sector?', tag: 'Geography' },
    { icon: '↗', label: 'Connect me with the right BKPM analyst', tag: 'Human' },
  ];
  return (
    <div className="frame col" style={{ background: 'var(--surface)' }}>
      <div style={{ height: 44, borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, background: 'var(--surface)' }}>
        <Logo />
        <div className="grow" />
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{DATA.org.name} · new project</span>
      </div>

      <div className="grow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, position: 'relative', overflow: 'auto' }}>
        <div style={{ maxWidth: 720, width: '100%' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>NEW PROJECT</div>
          <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, margin: '6px 0 8px', letterSpacing: '-0.015em' }}>
            What are you exploring in <span style={{ color: 'var(--terracotta)' }}>Indonesia</span>?
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '0 0 20px', lineHeight: 1.55 }}>
            Name this project, then start a thread. The shared canvas will collect every regulation, comp, and structure as we go — and a BKPM analyst is one ↗ away.
          </p>

          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <div className="label" style={{ marginBottom: 8 }}>Project name</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
              <span style={{ fontSize: 16, color: 'var(--ink-4)' }}>e.g.</span>
              <span style={{ fontSize: 16 }}>Geothermal — North Sumatra</span>
              <span style={{ width: 1, height: 16, background: 'var(--terracotta)', animation: 'blink 1s infinite' }} />
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
              <span className="label" style={{ alignSelf: 'center', marginRight: 4 }}>Sector</span>
              {['Critical minerals', 'Energy', 'Digital infra', 'Manufacturing', 'Agriculture'].map(s => (
                <span key={s} className="chip" style={{ cursor: 'pointer' }}>{s}</span>
              ))}
            </div>
          </div>

          <div className="label" style={{ marginBottom: 10 }}>Or start with a question</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {starters.map(s => (
              <div key={s.label} className="card" style={{ padding: 12, cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: 4, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--terracotta)', fontWeight: 600 }}>{s.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.4 }}>{s.label}</div>
                  <div className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', marginTop: 4, letterSpacing: '0.06em' }}>{s.tag.toUpperCase()}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 18, alignItems: 'center' }}>
            <button className="btn btn-primary">Create project & start thread</button>
            <button className="btn">Import deal memo (.pdf, .docx)</button>
            <div className="grow" />
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>3 BKPM analysts available now</span>
            <AvatarStack items={DATA.analysts} max={3} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Handoff modal — book a call with analyst
// ─────────────────────────────────────────────────────────────
function HandoffModal() {
  const lead = DATA.analysts[0];
  const slots = [
    ['Today', '15:00 WIB', false],
    ['Today', '16:30 WIB', true],
    ['Tomorrow', '09:00 WIB', false],
    ['Tomorrow', '10:30 WIB', false],
    ['Tomorrow', '14:00 WIB', false],
    ['Mon 28', '09:30 WIB', false],
  ];
  return (
    <div className="frame" style={{ background: 'var(--surface-2)' }}>
      {/* dimmed underlay sketch */}
      <div style={{ position: 'absolute', inset: 0, background: 'var(--surface-2)', opacity: 0.6 }}>
        <div style={{ height: 44, background: 'var(--surface)', borderBottom: '1px solid var(--line)' }} />
        <div style={{ display: 'flex', height: 'calc(100% - 44px)' }}>
          <div style={{ width: 240, background: 'var(--surface-2)', borderRight: '1px solid var(--line)' }} />
          <div className="grow" />
          <div style={{ width: 300, background: 'var(--surface-2)', borderLeft: '1px solid var(--line)' }} />
        </div>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(28,26,20,0.45)' }} />

      {/* modal */}
      <div className="card" style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 600, boxShadow: 'var(--shadow-3)', overflow: 'hidden',
      }}>
        {/* header band */}
        <div style={{ background: 'linear-gradient(135deg, var(--terracotta-soft), var(--jade-soft))', padding: '20px 24px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <Avatar name={lead.short} color={lead.color} size="lg" status="online" />
          <div style={{ flex: 1 }}>
            <div className="label" style={{ color: 'var(--terracotta)' }}>BOOK A CALL</div>
            <div className="serif" style={{ fontSize: 22, fontWeight: 600, marginTop: 2, letterSpacing: '-0.01em' }}>{lead.name}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>{lead.role} · {lead.focus}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <span className="chip chip-jade chip-dot">Online now</span>
              <span className="chip">9 prior interactions</span>
              <span className="chip">Konawe deal lead</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ padding: 4 }}>×</button>
        </div>

        <div style={{ padding: 20 }}>
          <div className="label" style={{ marginBottom: 6 }}>Thread context (auto-attached)</div>
          <div style={{ padding: 10, background: 'var(--surface-2)', borderRadius: 6, fontSize: 12, lineHeight: 1.45, border: '1px solid var(--line)' }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{DATA.projects[0].short} · {DATA.threads[0].name}</span>
            <div style={{ marginTop: 4 }}>4 turns · 2 artifacts (Perpres §C(7), SPV diagram). Aisha is exploring a minority convertible into MIND ID JV.</div>
          </div>

          <div className="label" style={{ marginTop: 16, marginBottom: 8 }}>Pick a slot · 30 minutes · Jakarta time</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {slots.map(([day, time, sel]) => (
              <div key={day + time} style={{
                padding: '10px 8px', textAlign: 'center', borderRadius: 6,
                border: '1px solid ' + (sel ? 'var(--terracotta)' : 'var(--line)'),
                background: sel ? 'var(--terracotta-soft)' : 'var(--surface)',
                cursor: 'pointer',
              }}>
                <div className="mono" style={{ fontSize: 9, color: sel ? 'var(--terracotta)' : 'var(--ink-3)' }}>{day.toUpperCase()}</div>
                <div style={{ fontSize: 13, fontWeight: sel ? 600 : 500, marginTop: 2, color: sel ? 'var(--terracotta)' : 'var(--ink)' }}>{time}</div>
              </div>
            ))}
          </div>

          <div className="label" style={{ marginTop: 16, marginBottom: 6 }}>Add a note (optional)</div>
          <div className="card" style={{ padding: 10, background: 'var(--surface-2)', minHeight: 50 }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>Want to walk through the convertible mechanics + timing for the IC pre-read.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>↗ Confirms via email + adds to your calendar</span>
            <div className="grow" />
            <button className="btn">Cancel</button>
            <button className="btn btn-primary">Confirm · Today 16:30</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Canvas focus mode — single artifact full-screen
// ─────────────────────────────────────────────────────────────
function CanvasFocus() {
  return (
    <div className="frame col" style={{ background: 'var(--surface)' }}>
      <div style={{ height: 44, borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, background: 'var(--surface)' }}>
        <button className="btn btn-sm btn-ghost">← Back to thread</button>
        <span style={{ color: 'var(--ink-4)' }}>/</span>
        <span className="chip chip-terra">DOC</span>
        <span style={{ fontSize: 13, fontWeight: 500 }}>Perpres 10/2021 — Annex II §C(7)</span>
        <div className="grow" />
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>Pinned by AI · 14:00</span>
        <button className="btn btn-sm">Download PDF</button>
        <button className="btn btn-sm btn-ghost">⋯</button>
      </div>

      <div className="row grow" style={{ minHeight: 0 }}>
        {/* doc area */}
        <div className="col grow scroll" style={{ background: '#f0ebe0', alignItems: 'center', padding: 32 }}>
          <div className="card" style={{ width: 720, padding: '48px 64px', minHeight: 540 }}>
            <div className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>PERPRES 10/2021</div>
            <h2 className="serif" style={{ fontSize: 20, fontWeight: 600, margin: '4px 0 16px' }}>Annex II — Open Sectors with Conditions</h2>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 8 }}>§ C(7) — Smelting & refining of nickel ore</div>

            <div style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--ink)' }}>
              <p style={{ margin: '0 0 12px' }}>
                <span className="bar" style={{ display: 'inline-block', width: '92%' }} />
              </p>
              <p style={{ margin: '0 0 12px' }}>
                Smelting and refining of nickel ore <span className="hl-yellow">shall be open to foreign capital up to 100%</span>, subject to partnership with national small and medium enterprises (SMEs) for non-core auxiliary services as set forth in BKPM Regulation 4/2021 §17.
              </p>
              <p style={{ margin: '0 0 12px', color: 'var(--ink-3)' }}>
                <span className="bar" style={{ display: 'inline-block', width: '88%' }} />
              </p>
              <p style={{ margin: '0 0 12px', color: 'var(--ink-3)' }}>
                <span className="bar" style={{ display: 'inline-block', width: '70%' }} />
              </p>
              <p style={{ margin: '0 0 12px' }}>
                Holders shall comply with <span className="hl-terra">domestic value-added requirements (DMO 30%)</span> and submit annual reports to BKPM on local hiring and SME engagement metrics.
              </p>
              <p style={{ margin: '0 0 12px' }}><span className="bar" style={{ display: 'inline-block', width: '95%' }} /></p>
              <p style={{ margin: '0 0 12px' }}><span className="bar" style={{ display: 'inline-block', width: '78%' }} /></p>
            </div>

            {/* annotation pin */}
            <div style={{ position: 'absolute' }}>
              <div style={{ marginTop: -120, marginLeft: 580, position: 'absolute', display: 'flex', gap: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--terracotta)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>1</div>
                <div className="card" style={{ padding: 10, width: 220, background: 'var(--surface)' }}>
                  <div className="mono" style={{ fontSize: 9, color: 'var(--ink-3)' }}>YOU · 2m ago</div>
                  <div style={{ fontSize: 12, marginTop: 2 }}>Does "national SMEs" include majority-foreign Indonesian SPVs?</div>
                  <div className="mono" style={{ fontSize: 9, color: 'var(--jade)', marginTop: 4 }}>↳ AI replied · 1 cite</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* right rail: outline + annotations */}
        <div className="col" style={{ width: 280, borderLeft: '1px solid var(--line)', background: 'var(--surface-2)', padding: 14, gap: 12 }}>
          <div className="label">Outline</div>
          <div style={{ fontSize: 12, lineHeight: 1.7 }}>
            <div style={{ color: 'var(--ink-3)' }}>§ C(1) Mining concessions</div>
            <div style={{ color: 'var(--ink-3)' }}>§ C(2)–(6) Other minerals</div>
            <div style={{ fontWeight: 600, color: 'var(--terracotta)' }}>§ C(7) Nickel midstream ●</div>
            <div style={{ color: 'var(--ink-3)' }}>§ C(8) Cobalt</div>
            <div style={{ color: 'var(--ink-3)' }}>§ C(9) Copper</div>
          </div>
          <div className="div-h" />
          <div className="label">Annotations · 3</div>
          {[
            ['1', 'YOU', 'SME definition?', '#b94a1f'],
            ['2', 'AI', 'Cross-ref BKPM 4/2021 §17', '#1c1a14'],
            ['3', 'RP', 'Konawe used 12% SME quota', '#2f6a4f'],
          ].map(([n, who, txt, c]) => (
            <div key={n} style={{ display: 'flex', gap: 8 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: c, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>{n}</div>
              <div style={{ minWidth: 0 }}>
                <div className="mono" style={{ fontSize: 9, color: 'var(--ink-3)' }}>{who}</div>
                <div style={{ fontSize: 11.5 }}>{txt}</div>
              </div>
            </div>
          ))}
          <div className="div-h" />
          <div className="label">Linked threads</div>
          <div style={{ fontSize: 11.5, color: 'var(--terracotta)' }}>● DNI / smelter co-investment</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>○ Tax holiday eligibility</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Notifications / digest
// ─────────────────────────────────────────────────────────────
function NotificationsDigest() {
  const items = [
    { kind: 'analyst', who: 'Rina P.', avatar: 'RP', color: '#b94a1f', text: 'replied in DNI / smelter co-invest', detail: '"Konawe used a 12% SME quota — happy to walk through it."', time: '4m', project: 'SULAWESI.NI', urgent: true },
    { kind: 'ai', who: 'BKPM AI', avatar: 'AI', color: '#1c1a14', text: 'flagged a regulation update', detail: 'Perpres 49/2021 amendment on critical minerals · effective 1 May 2026', time: '1h', project: 'SULAWESI.NI', urgent: false },
    { kind: 'analyst', who: 'Adi W.', avatar: 'AW', color: '#2f6a4f', text: 'shared a comp set in PLN offtake', detail: '4 IPP deals from 2024–2025, attached', time: '3h', project: 'SULAWESI.NI', urgent: false },
    { kind: 'opp', who: 'BKPM AI', avatar: 'AI', color: '#1c1a14', text: 'matched a new opportunity', detail: 'Bauxite refining, Bintan — fits your SE Asia critical minerals thesis', time: '5h', project: 'New', urgent: false },
    { kind: 'system', who: '', avatar: '✓', color: '#7a7466', text: 'Tax holiday memo exported to Khazanah workspace', detail: '12-page PDF · auto-generated from thread', time: 'yesterday', project: 'SULAWESI.NI', urgent: false },
  ];

  return (
    <div className="frame col" style={{ background: 'var(--surface)' }}>
      <div style={{ height: 44, borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, background: 'var(--surface)' }}>
        <Logo />
        <div className="grow" />
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{DATA.user.name}</span>
      </div>

      <div className="row grow" style={{ minHeight: 0 }}>
        <div style={{ width: 60, background: 'var(--surface-2)', borderRight: '1px solid var(--line)' }} />

        <div className="col grow scroll" style={{ padding: '32px 48px', background: 'var(--surface)' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>INBOX · 26 APR 2026</div>
          <h1 className="serif" style={{ fontSize: 28, fontWeight: 500, margin: '4px 0 4px', letterSpacing: '-0.01em' }}>Good morning, Aisha</h1>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '0 0 24px' }}>3 updates need your eyes · 1 analyst reply pending · 1 new match for your thesis</p>

          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            <span className="chip chip-terra chip-dot" style={{ fontWeight: 600 }}>All · 12</span>
            <span className="chip">Analysts · 4</span>
            <span className="chip">AI · 5</span>
            <span className="chip">Opportunities · 2</span>
            <span className="chip">System · 1</span>
          </div>

          <div className="col" style={{ gap: 1, background: 'var(--line)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
            {items.map((n, i) => (
              <div key={i} style={{
                background: n.urgent ? 'var(--terracotta-soft)' : 'var(--surface)',
                padding: '14px 18px',
                display: 'flex', gap: 14, alignItems: 'flex-start',
                cursor: 'pointer',
              }}>
                {n.urgent && <div style={{ width: 4, height: 40, background: 'var(--terracotta)', borderRadius: 2, marginTop: 4 }} />}
                <Avatar name={n.avatar} color={n.color} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>{n.who}</span>
                    <span style={{ color: 'var(--ink-2)' }}> {n.text}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.45, fontStyle: n.kind === 'analyst' ? 'italic' : 'normal' }}>{n.detail}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
                    <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)' }}>{n.project}</span>
                    <span style={{ color: 'var(--ink-4)' }}>·</span>
                    <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)' }}>{n.time} ago</span>
                  </div>
                </div>
                {n.urgent && <button className="btn btn-sm btn-primary">Open thread</button>}
                {!n.urgent && n.kind === 'opp' && <button className="btn btn-sm">Review</button>}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, padding: 16, background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--line)' }}>
            <div className="label" style={{ marginBottom: 6 }}>Weekly digest · auto</div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-2)' }}>
              4 active threads · 12 artifacts pinned · 2 analyst calls scheduled · 1 IC pre-read drafted. Estimated $2.7B in tracked opportunities across 4 projects.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Onboarding — first-time investor
// ─────────────────────────────────────────────────────────────
function Onboarding() {
  return (
    <div className="frame col" style={{ background: 'var(--surface)' }}>
      <div style={{ height: 44, borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>
        <Logo />
        <div className="grow" />
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>Step 2 of 3 · Skip ›</span>
      </div>

      <div className="row grow" style={{ minHeight: 0 }}>
        {/* left: form */}
        <div className="col" style={{ width: 480, padding: '40px 48px', background: 'var(--surface)', overflow: 'auto' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>WELCOME</div>
          <h1 className="serif" style={{ fontSize: 30, fontWeight: 500, margin: '4px 0 6px', letterSpacing: '-0.015em' }}>
            Tell us your <span style={{ color: 'var(--terracotta)' }}>investment thesis</span>
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: '0 0 24px', lineHeight: 1.55 }}>
            We'll route your threads to the right BKPM analysts and surface matched opportunities. You can refine this anytime.
          </p>

          <div className="label" style={{ marginBottom: 6 }}>Sectors of interest</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
            {[
              ['Critical minerals', true],
              ['Renewable energy', true],
              ['Digital infra', false],
              ['EV battery', true],
              ['Manufacturing', false],
              ['Agriculture', false],
              ['Tourism', false],
              ['Healthcare', false],
            ].map(([s, sel]) => (
              <span key={s} className={'chip ' + (sel ? 'chip-terra' : '')} style={{ cursor: 'pointer', padding: '5px 10px' }}>
                {sel && '✓ '}{s}
              </span>
            ))}
          </div>

          <div className="label" style={{ marginBottom: 6 }}>Ticket size</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
            {['<$50M', '$50M–$250M', '$250M–$1B', '>$1B'].map((s, i) => (
              <span key={s} className={'chip ' + (i === 2 ? 'chip-terra' : '')} style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 11 }}>
                {i === 2 && '✓ '}{s}
              </span>
            ))}
          </div>

          <div className="label" style={{ marginBottom: 6 }}>Stage of engagement</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
            {['Exploring', 'Active diligence', 'Already invested'].map((s, i) => (
              <span key={s} className={'chip ' + (i === 1 ? 'chip-terra' : '')} style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 11 }}>
                {i === 1 && '✓ '}{s}
              </span>
            ))}
          </div>

          <div className="label" style={{ marginBottom: 6 }}>Anything specific?</div>
          <div className="card" style={{ padding: 12, marginBottom: 24 }}>
            <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>e.g. "Indonesian downstream EV value chain, looking for JV with state-owned partner"</span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn">← Back</button>
            <button className="btn btn-primary" style={{ flex: 1 }}>Continue · Match analysts</button>
          </div>
        </div>

        {/* right: preview of who you'll be matched with */}
        <div className="col grow" style={{ background: 'linear-gradient(135deg, var(--surface-2), var(--terracotta-soft) 80%)', padding: 40, justifyContent: 'center', alignItems: 'flex-start' }}>
          <div style={{ maxWidth: 380 }}>
            <div className="label" style={{ marginBottom: 10 }}>Based on your thesis · live preview</div>
            <div className="serif" style={{ fontSize: 18, fontWeight: 500, marginBottom: 16, letterSpacing: '-0.01em' }}>
              You'll be matched with <span style={{ color: 'var(--terracotta)' }}>3 BKPM analysts</span> covering critical minerals, energy, and EV.
            </div>

            {DATA.analysts.map((a, i) => (
              <div key={a.short} className="card" style={{ padding: 14, marginBottom: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
                <Avatar name={a.short} color={a.color} size="lg" status={a.status} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{a.role}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-2)', marginTop: 4 }}>Covers: {a.focus}</div>
                </div>
                <span className="chip chip-jade chip-dot" style={{ fontSize: 9 }}>Match</span>
              </div>
            ))}

            <div style={{ marginTop: 18, padding: 14, borderRadius: 8, background: 'rgba(255,255,255,0.6)', border: '1px solid var(--line)' }}>
              <div className="label" style={{ marginBottom: 4 }}>You can also</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>· Bring your team — invite up to 12 analysts to your org</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 2 }}>· Connect your data room (Carta, iDeals, SharePoint)</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 2 }}>· Set up weekly digest of matched opportunities</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { EmptyState, HandoffModal, CanvasFocus, NotificationsDigest, Onboarding });
