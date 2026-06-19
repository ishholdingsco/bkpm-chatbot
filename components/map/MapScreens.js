"use client";
// Map page (hero) + Landing, ported from content/map-screens.jsx.
// The chat sidebar ("Ask Nusantara") is wired to DeepSeek via useChat.

import { useState } from "react";
import Link from "next/link";
import MapboxMap from "@/components/map/MapboxMap";
import { useChat } from "@/components/chat/useChat";
import { ChatTextarea, SendButton } from "@/components/chat/ChatComposer";
import { DATA, Avatar, AvatarStack, BKPM, Logo, TopBar } from "@/components/ui";

const LAYERS = [
  { id: "industrial", name: "Kawasan Industri", desc: "Industrial estates · 142 sites", color: "#f7b500", count: 142 },
  { id: "kek", name: "Kawasan Ekonomi Khusus", desc: "Special Economic Zones · 22", color: "#7e4dd9", count: 22 },
  { id: "wiup", name: "WIUP — Mining Concessions", desc: "Active concessions · 4,210", color: "#29b0a4", count: 4210 },
  { id: "minerals", name: "Mineral & Resource Deposits", desc: "Ni · Cu · Au · Bauxite · Coal · Tin", color: "#e8533f" },
  { id: "gdp", name: "GDP per capita", desc: "Choropleth · 2025", color: "#4264fb" },
  { id: "infra", name: "Power grid & corridors", desc: "PLN backbone + planned", color: "#f74565" },
  { id: "ports", name: "Sea ports", desc: "36 strategic ports", color: "#1a1a2e" },
];

function Wordmark({ name, tag = "BKPM", hifi = false, size = 17 }) {
  return <Logo size={size} showTag={!!tag} />;
}

// ─── Layer panel ───
function LayerPanel({ active, onToggle, hifi }) {
  return (
    <div className={"card " + (hifi ? "hifi" : "")} style={{ position: "absolute", top: 16, left: 16, width: 260, padding: 12, zIndex: 3 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
        <span className="label">Layers</span>
        <span className="chip" style={{ marginLeft: 6, fontSize: 9 }}>{Object.values(active).filter(Boolean).length} on</span>
        <div className="grow" />
        <button className="btn btn-sm btn-ghost" style={{ padding: 2, fontSize: 11 }}>⌄</button>
      </div>
      {LAYERS.map((l) => (
        <div key={l.id} className={"layer-pill " + (active[l.id] ? "active" : "")} onClick={() => onToggle(l.id)}>
          <div className="layer-swatch" style={{ background: l.color, opacity: active[l.id] ? 1 : 0.3 }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.2 }}>{l.name}</div>
            <div className="mono" style={{ fontSize: 9, color: "var(--ink-3)", marginTop: 2 }}>{l.desc}</div>
          </div>
          <div style={{ width: 24, height: 14, borderRadius: 7, background: active[l.id] ? "#4264fb" : "#cfc6b0", position: "relative", flexShrink: 0 }}>
            <div style={{ position: "absolute", top: 1, left: active[l.id] ? 11 : 1, width: 12, height: 12, borderRadius: "50%", background: "#fff", transition: "left 0.15s" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Map controls (zoom, locate) ───
function MapControls() {
  return (
    <div style={{ position: "absolute", top: 16, right: 16, zIndex: 3, display: "flex", flexDirection: "column", gap: 8 }}>
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

// ─── Chat sidebar (collapsible, contextual to map) — LIVE via DeepSeek ───
const MAP_SUGGESTIONS = [
  "What's driving the cluster of nickel sites in Sulawesi?",
  "Which sectors allow 100% foreign ownership right now?",
  "Compare Sulawesi vs Halmahera nickel infrastructure",
];

function MapChat({ open, onToggle, hifi, activeLayers }) {
  const layerNames = LAYERS.filter((l) => activeLayers[l.id]).map((l) => l.name).join(", ");
  const context = `User is on the Wilaya map view. Active map layers: ${layerNames || "none"}. They are looking at Indonesia (default focus: Sulawesi nickel belt). Answer in the context of what's visible on the map.`;
  const { messages, input, setInput, send, loading } = useChat({ context });

  if (!open) {
    return (
      <button
        className={"btn " + (hifi ? "hifi" : "")}
        onClick={onToggle}
        style={{ position: "absolute", bottom: 20, right: 20, zIndex: 4, background: "#1a1a2e", color: "#fff", borderColor: "#1a1a2e", padding: "10px 14px", borderRadius: 24, boxShadow: "0 6px 16px rgba(20,20,40,0.2)" }}
      >
        💬 Ask about this map
      </button>
    );
  }

  return (
    <div className={"col " + (hifi ? "hifi" : "")} style={{ width: 340, borderLeft: "1px solid var(--line)", background: "var(--surface)" }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 8 }}>
        <Avatar name="AI" color="#1a1a2e" size="sm" status="online" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>Ask Nusantara</div>
          <div className="mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>
            Reading: {Object.values(activeLayers).filter(Boolean).length} layers active · viewing Sulawesi
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onToggle} style={{ padding: 4 }}>›</button>
      </div>

      <div className="scroll col grow" style={{ padding: "14px", gap: 14 }}>
        {messages.length === 0 && (
          <>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)" }}>
              Ask me anything about what&apos;s on the map — sectors, special economic zones, ownership rules, or a specific opportunity.
            </div>
            <div style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 8, padding: 12 }}>
              <div className="label" style={{ marginBottom: 6 }}>Try asking</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {MAP_SUGGESTIONS.map((s) => (
                  <div
                    key={s}
                    onClick={() => !loading && send(s)}
                    style={{ fontSize: 12, padding: "6px 8px", background: "#fff", borderRadius: 6, border: "1px solid var(--line)", cursor: loading ? "default" : "pointer" }}
                  >
                    ↗ {s}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} style={{ alignSelf: "flex-end", background: "var(--surface-3)", padding: "8px 12px", borderRadius: 10, fontSize: 13, maxWidth: "85%", whiteSpace: "pre-wrap" }}>
              {m.content}
            </div>
          ) : (
            <div key={i} style={{ fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
              {m.content || (loading ? "● thinking…" : "")}
            </div>
          )
        )}
      </div>

      <div style={{ borderTop: "1px solid var(--line)", padding: 12 }}>
        <div className="card" style={{ padding: "8px 10px", display: "flex", alignItems: "flex-end", gap: 8 }}>
          <ChatTextarea
            value={input}
            onChange={setInput}
            onSend={() => send()}
            submitOn="enter"
            rows={1}
            placeholder="Ask, or try /filter, /compare…"
            style={{ flex: 1, border: "none", outline: "none", resize: "none", fontSize: 12.5, fontFamily: "Inter, sans-serif", background: "transparent", color: "var(--ink)", maxHeight: 90 }}
          />
          <SendButton className="btn btn-sm btn-primary" loading={loading} input={input} onSend={() => send()} />
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <span className="chip">+ save view</span>
          <Link href="/workspace" style={{ textDecoration: "none" }}>
            <span className="chip chip-terra" style={{ cursor: "pointer" }}>↗ start workspace</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Hover tooltip (static demo accent) ───
function MapTooltip() {
  return (
    <div className="map-tooltip" style={{ top: 230, right: 280 }}>
      <div className="mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>SULAWESI · MOROWALI</div>
      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>IMIP Industrial Park</div>
      <div style={{ fontSize: 11, color: "var(--ink-2)", marginTop: 4, lineHeight: 1.4 }}>Nickel midstream cluster · 47 tenants</div>
      <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
        <span className="chip chip-jade chip-dot" style={{ fontSize: 8 }}>KEK active</span>
        <span className="chip" style={{ fontSize: 8 }}>$12.4B FDI</span>
      </div>
    </div>
  );
}

// ─── MAP PAGE — hero ───
export function MapPage({ hifi = false }) {
  const [chatOpen, setChatOpen] = useState(true);
  const [active, setActive] = useState({
    industrial: true, kek: true, wiup: true, minerals: false, gdp: false, infra: false, ports: false,
  });
  return (
    <div className={"frame col " + (hifi ? "hifi" : "")}>
      <TopBar
        showOrg={false}
        left={
          <div style={{ display: "flex", gap: 4 }}>
            {["Map", "Sectors", "Opportunities", "Analysts"].map((t, i) => (
              <span key={t} style={{ padding: "6px 10px", fontSize: 12.5, fontWeight: i === 0 ? 600 : 500, color: i === 0 ? "var(--terracotta)" : "var(--ink-2)", borderBottom: i === 0 ? "2px solid var(--terracotta)" : "2px solid transparent", cursor: "pointer" }}>{t}</span>
            ))}
          </div>
        }
        right={
          <>
            <div className="card" style={{ display: "flex", alignItems: "center", padding: "4px 10px", gap: 8, background: "var(--surface-2)", minWidth: 260 }}>
              <span style={{ fontSize: 13, color: "var(--ink-4)" }}>🔍</span>
              <span style={{ fontSize: 12.5, color: "var(--ink-4)" }}>Search regions, sectors, projects…</span>
              <div className="grow" />
              <span className="kbd">⌘K</span>
            </div>
            <button className="btn btn-sm btn-ghost">EN</button>
            <Link href="/workspace" style={{ textDecoration: "none" }}>
              <button className="btn btn-sm btn-primary">Start a project →</button>
            </Link>
          </>
        }
      />

      <div className="row grow" style={{ minHeight: 0 }}>
        <div className="map-canvas grow" style={{ position: "relative" }}>
          <MapboxMap center={[120.0, -2.0]} zoom={3.9} bearing={-12} interactive={true} />

          <LayerPanel active={active} onToggle={(id) => setActive({ ...active, [id]: !active[id] })} hifi={hifi} />
          <MapControls />
          <MapTooltip />

          <div style={{ position: "absolute", bottom: 16, left: 16, display: "flex", gap: 8, alignItems: "center", zIndex: 3 }}>
            <div className="card" style={{ padding: "6px 10px", display: "flex", gap: 8, alignItems: "center" }}>
              <span className="mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>0  500km</span>
              <div style={{ width: 60, height: 3, background: "linear-gradient(to right, #1a1a2e 50%, #fff 50%)", border: "1px solid #1a1a2e" }} />
            </div>
            <div className="card" style={{ padding: "6px 10px" }}>
              <span className="mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>BPS · BKPM · ESDM · 2025</span>
            </div>
          </div>

          <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 3 }}>
            <div className="card" style={{ padding: "8px 14px", display: "flex", gap: 14, alignItems: "center" }}>
              <div>
                <div className="mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>OPPORTUNITIES IN VIEW</div>
                <div style={{ fontSize: 18, fontWeight: 600, fontFamily: "Source Serif 4" }}>237 <span style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 400, fontFamily: "Inter" }}>· $48.2B tracked</span></div>
              </div>
              <div style={{ width: 1, height: 30, background: "var(--line)" }} />
              <div className="col">
                <span className="chip chip-terra" style={{ fontSize: 9 }}>● 3 featured</span>
                <span className="mono" style={{ fontSize: 9, color: "var(--ink-3)", marginTop: 2 }}>matched to your thesis</span>
              </div>
            </div>
          </div>
        </div>

        <MapChat open={chatOpen} onToggle={() => setChatOpen(!chatOpen)} hifi={hifi} activeLayers={active} />
      </div>
    </div>
  );
}

// ─── PUBLIC LANDING — full-bleed Mapbox map, floating chrome on top ───
export function Landing({ name = "Wilaya", hifi = false, mapStyle }) {
  return (
    <div className={"frame col " + (hifi ? "hifi" : "")} style={{ background: "var(--bg)", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <MapboxMap center={[118.5, -1.5]} zoom={4.05} bearing={-12} interactive={true} style={mapStyle} />
      </div>

      <div style={{ position: "absolute", top: 18, left: 18, right: 18, zIndex: 5, height: 56, background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 6px 24px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.6) inset", display: "flex", alignItems: "center", padding: "0 22px", gap: 18 }}>
        <Wordmark name={name} hifi={hifi} />
        <div className="grow" />
        <div style={{ display: "flex", gap: 22, fontSize: 13 }}>
          {["Explore the map", "Sectors", "Why Indonesia", "Analysts", "Pricing"].map((t, i) => (
            <span key={t} style={{ color: i === 0 ? "#1a1a2e" : "var(--ink-2)", fontWeight: i === 0 ? 600 : 400, cursor: "pointer" }}>{t}</span>
          ))}
        </div>
        <span style={{ width: 1, height: 22, background: "var(--line)" }} />
        <button className="btn btn-sm btn-ghost">Sign in</button>
        <Link href="/map" style={{ textDecoration: "none" }}>
          <button className="btn btn-sm btn-primary">Start exploring →</button>
        </Link>
      </div>

      <div style={{ position: "absolute", left: 28, bottom: 28, zIndex: 5, width: 460, padding: "26px 28px", background: "#fff", borderRadius: 18, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 18px 48px rgba(0,0,0,0.18), 0 2px 0 rgba(255,255,255,0.7) inset", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#51b749" }} />
          <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.14em" }}>INDONESIA INVESTMENT INTELLIGENCE · LIVE</span>
        </div>

        <h1 className="serif" style={{ fontSize: hifi ? 38 : 34, fontWeight: 600, lineHeight: 1.08, letterSpacing: "-0.024em", margin: 0, color: "#1a1a2e", textWrap: "balance" }}>
          The world&apos;s <span style={{ color: "var(--terracotta)" }}>$1.5T</span> growth story, mapped down to the parcel.
        </h1>

        <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)", margin: 0, textWrap: "pretty" }}>
          17,508 islands. 142 industrial estates. 22 special economic zones. Every concession, corridor and incentive — overlaid on one live atlas.
        </p>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/map" style={{ textDecoration: "none" }}>
            <button className="btn btn-primary" style={{ padding: "10px 18px", fontSize: 13.5, display: "inline-flex", alignItems: "center", gap: 8 }}>Explore the map →</button>
          </Link>
          <button className="btn" style={{ padding: "10px 16px", fontSize: 13.5 }}>Browse 38 sectors</button>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", paddingTop: 12, borderTop: "1px solid var(--line)" }}>
          <AvatarStack items={DATA.analysts} max={3} />
          <span style={{ fontSize: 12, color: "var(--ink-2)" }}>
            <BKPM />&nbsp;<b>23 analysts</b> online · avg reply 4 min
          </span>
        </div>
      </div>

      <div style={{ position: "absolute", top: 92, right: 18, zIndex: 5, background: "rgba(255,255,255,0.94)", backdropFilter: "blur(6px)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6, boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
        <span className="mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.14em" }}>OVERLAYS</span>
        {[["#f7b500", "Industrial estates · 142"], ["#7e4dd9", "Special economic zones · 22"], ["#c44a36", "Featured opportunities"]].map(([c, l]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--ink-2)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: c, opacity: 0.7, border: `1px solid ${c}` }} />
            {l}
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", right: 28, bottom: 28, zIndex: 5, display: "flex", flexDirection: "column", gap: 8, background: "rgba(255,255,255,0.94)", backdropFilter: "blur(6px)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: "14px 18px", boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}>
        <span className="mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.14em" }}>ATLAS · LIVE</span>
        {[["$48.2B", "tracked opportunities"], ["237", "live projects"], ["38", "sectors covered"]].map(([n, l]) => (
          <div key={l} style={{ display: "flex", alignItems: "baseline", gap: 8, justifyContent: "space-between" }}>
            <span className="serif" style={{ fontSize: 18, fontWeight: 600, color: "#1a1a2e" }}>{n}</span>
            <span className="mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.10em" }}>{l.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
