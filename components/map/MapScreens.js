"use client";
// Map page (hero) + Landing, ported from content/map-screens.jsx.
// The chat sidebar ("Ask Nusantara") is wired to DeepSeek via useChat.

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown, ChevronRight, Plus, Minus, Locate, Compass,
  Search, MessageCircle, ArrowUpRight, ArrowRight, Loader2,
} from "lucide-react";
import MapboxMap, { MB_LAYER_KEYS } from "@/components/map/MapboxMap";
import { useChat } from "@/components/chat/useChat";
import { ChatTextarea, SendButton } from "@/components/chat/ChatComposer";
import { Markdown } from "@/components/chat/Markdown";
import { Switch, Tooltip } from "@/components/ui/controls";
import { DATA, Avatar, AvatarStack, BKPM, Logo, TopBar, comingSoon, useI18n, LangToggle } from "@/components/ui";
import industrialData from "@/data/industrial-estates.json";
import kekData from "@/data/kek.json";
import mineralsData from "@/data/minerals.json";
import portsData from "@/data/ports.json";

// Counts come straight from the static JSON in data/ so the panel and the map
// can never drift apart. WIUP/GDP/infra are future layers without point data yet.
// Display name/description live in messages/*.json under map.layerNames /
// map.layerDesc, keyed by `id` (see useI18n).
const LAYERS = [
  { id: "industrial", color: "#f7b500", count: industrialData.estates.length },
  { id: "kek", color: "#7e4dd9", count: kekData.estates.length },
  { id: "wiup", color: "#29b0a4", count: 4210 },
  { id: "minerals", color: "#e8533f", count: mineralsData.deposits.length },
  { id: "gdp", color: "#4264fb" },
  { id: "infra", color: "#f74565" },
  { id: "ports", color: "#1a1a2e", count: portsData.ports.length },
];

function Wordmark({ name, tag = "BKPM", hifi = false, size = 17 }) {
  return <Logo size={size} showTag={!!tag} />;
}

// ─── Layer panel ───
function LayerPanel({ active, onToggle, hifi }) {
  const { t } = useI18n();
  return (
    <div className={"card " + (hifi ? "hifi" : "")} style={{ position: "absolute", top: 16, left: 16, width: 260, padding: 12, zIndex: 3 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
        <span className="label">{t("map.layers")}</span>
        <span className="chip" style={{ marginLeft: 6, fontSize: 9 }}>{t("map.layersOn", { n: Object.values(active).filter(Boolean).length })}</span>
        <div className="grow" />
        <button className="btn btn-sm btn-ghost ui-icon-btn" aria-label={t("map.collapseLayers")}><ChevronDown size={15} strokeWidth={1.75} /></button>
      </div>
      {LAYERS.map((l) => {
        // Layers without point data yet (WIUP, GDP, infra) can't be drawn, so
        // their toggle would do nothing — flag them "soon" and disable it.
        const hasData = MB_LAYER_KEYS.includes(l.id);
        const on = hasData && !!active[l.id];
        const name = t("map.layerNames." + l.id);
        const desc = t("map.layerDesc." + l.id, { n: l.count });
        return (
          <div
            key={l.id}
            className={"layer-pill " + (on ? "active" : "")}
            onClick={() => hasData && onToggle(l.id)}
            style={{ cursor: hasData ? "pointer" : "default", opacity: hasData ? 1 : 0.6 }}
          >
            <div className="layer-swatch" style={{ background: l.color, opacity: on ? 1 : 0.3 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.2 }}>{name}</div>
              <div className="mono" style={{ fontSize: 9, color: "var(--ink-3)", marginTop: 2 }}>{desc}</div>
            </div>
            {hasData ? (
              <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexShrink: 0 }}>
                <Switch checked={on} onCheckedChange={() => onToggle(l.id)} color={l.color} aria-label={name} />
              </div>
            ) : (
              <span className="chip" style={{ flexShrink: 0, fontSize: 8 }}>{t("common.soon")}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Map controls (zoom, locate) ───
function MapControls() {
  const { t } = useI18n();
  return (
    <div style={{ position: "absolute", top: 16, right: 16, zIndex: 3, display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="map-control">
        <Tooltip content={t("map.zoomIn")}><button aria-label={t("map.zoomIn")} onClick={() => comingSoon("Zoom controls")}><Plus size={16} strokeWidth={1.75} /></button></Tooltip>
        <Tooltip content={t("map.zoomOut")}><button aria-label={t("map.zoomOut")} onClick={() => comingSoon("Zoom controls")}><Minus size={16} strokeWidth={1.75} /></button></Tooltip>
      </div>
      <div className="map-control">
        <Tooltip content={t("map.locate")}><button aria-label={t("map.locate")} onClick={() => comingSoon("Locate me")}><Locate size={16} strokeWidth={1.75} /></button></Tooltip>
        <Tooltip content={t("map.resetBearing")}><button aria-label={t("map.compass")} onClick={() => comingSoon("Reset bearing")}><Compass size={16} strokeWidth={1.75} /></button></Tooltip>
      </div>
    </div>
  );
}

// ─── Chat sidebar (collapsible, contextual to map) — LIVE via DeepSeek ───
function MapChat({ open, onToggle, hifi, activeLayers }) {
  const { t, lang } = useI18n();
  const layerNames = LAYERS.filter((l) => activeLayers[l.id]).map((l) => t("map.layerNames." + l.id)).join(", ");
  const context = `User is on the Wilaya map view. Active map layers: ${layerNames || "none"}. They are looking at Indonesia (default focus: Sulawesi nickel belt). Answer in the context of what's visible on the map.`;
  const { messages, input, setInput, send, loading } = useChat({ context, lang });
  const suggestions = t("map.suggestions");

  if (!open) {
    return (
      <button
        className={"btn " + (hifi ? "hifi" : "")}
        onClick={onToggle}
        style={{ position: "absolute", bottom: 20, right: 20, zIndex: 4, background: "#1a1a2e", color: "#fff", borderColor: "#1a1a2e", padding: "10px 14px", borderRadius: 24, boxShadow: "0 6px 16px rgba(20,20,40,0.2)" }}
      >
        <MessageCircle size={15} strokeWidth={1.75} /> {t("map.askAboutMap")}
      </button>
    );
  }

  return (
    <div className={"col " + (hifi ? "hifi" : "")} style={{ width: 340, borderLeft: "1px solid var(--line)", background: "var(--surface)" }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 8 }}>
        <Avatar name="AI" color="#1a1a2e" size="sm" status="online" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{t("map.askNusantara")}</div>
          <div className="mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>
            {t("map.reading", { n: Object.values(activeLayers).filter(Boolean).length })}
          </div>
        </div>
        <Tooltip content={t("common.collapse")} side="bottom">
          <button className="btn btn-ghost btn-sm ui-icon-btn" onClick={onToggle} aria-label={t("map.collapseChat")}><ChevronRight size={16} strokeWidth={1.75} /></button>
        </Tooltip>
      </div>

      <div className="scroll col grow" style={{ padding: "14px", gap: 14 }}>
        {messages.length === 0 && (
          <>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)" }}>
              {t("map.intro")}
            </div>
            <div style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 8, padding: 12 }}>
              <div className="label" style={{ marginBottom: 6 }}>{t("map.tryAsking")}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {suggestions.map((s) => (
                  <div
                    key={s}
                    onClick={() => !loading && send(s)}
                    style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12, padding: "6px 8px", background: "#fff", borderRadius: 6, border: "1px solid var(--line)", cursor: loading ? "default" : "pointer" }}
                  >
                    <ArrowUpRight size={14} strokeWidth={1.75} style={{ flexShrink: 0, marginTop: 2, color: "var(--ink-3)" }} /> {s}
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
            <div key={i} style={{ fontSize: 13, lineHeight: 1.55 }}>
              {m.content ? (
                <Markdown>{m.content}</Markdown>
              ) : loading ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--ink-3)" }}>
                  <Loader2 size={14} strokeWidth={2} className="spin" /> {t("common.thinking")}
                </span>
              ) : (
                ""
              )}
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
            maxHeight={120}
            placeholder={t("map.chatPlaceholder")}
            style={{ flex: 1, border: "none", outline: "none", resize: "none", fontSize: 12.5, fontFamily: "Inter, sans-serif", background: "transparent", color: "var(--ink)" }}
          />
          <SendButton className="btn btn-sm btn-primary" loading={loading} input={input} onSend={() => send()} />
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <span className="chip" style={{ cursor: "pointer" }} onClick={() => comingSoon("Save view")}><Plus size={11} strokeWidth={2} /> {t("map.saveView")}</span>
          <Link href="/workspace" style={{ textDecoration: "none" }}>
            <span className="chip chip-terra" style={{ cursor: "pointer" }}><ArrowUpRight size={11} strokeWidth={2} /> {t("map.startWorkspace")}</span>
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
  const { t } = useI18n();
  const [chatOpen, setChatOpen] = useState(true);
  const [active, setActive] = useState({
    industrial: true, kek: true, wiup: false, minerals: true, gdp: false, infra: false, ports: true,
  });
  const navItems = [t("nav.map"), t("nav.sectors"), t("nav.opportunities"), t("nav.analysts")];
  return (
    <div className={"frame col " + (hifi ? "hifi" : "")}>
      <TopBar
        showOrg={false}
        left={
          <div style={{ display: "flex", gap: 4 }}>
            {navItems.map((label, i) => (
              <span
                key={label}
                onClick={() => i !== 0 && comingSoon(label)}
                style={{ padding: "6px 10px", fontSize: 12.5, fontWeight: i === 0 ? 600 : 500, color: i === 0 ? "var(--terracotta)" : "var(--ink-2)", borderBottom: i === 0 ? "2px solid var(--terracotta)" : "2px solid transparent", cursor: "pointer" }}
              >{label}</span>
            ))}
          </div>
        }
        right={
          <>
            <div
              className="card"
              onClick={() => comingSoon("Search")}
              style={{ display: "flex", alignItems: "center", padding: "4px 10px", gap: 8, background: "var(--surface-2)", minWidth: 260, cursor: "pointer" }}
            >
              <Search size={14} strokeWidth={1.75} style={{ color: "var(--ink-4)" }} />
              <span style={{ fontSize: 12.5, color: "var(--ink-4)" }}>{t("common.searchPlaceholder")}</span>
              <div className="grow" />
              <span className="kbd">⌘K</span>
            </div>
            <LangToggle />
            <Link href="/workspace" style={{ textDecoration: "none" }}>
              <button className="btn btn-sm btn-primary">{t("map.startProject")} <ArrowRight size={14} strokeWidth={1.75} /></button>
            </Link>
          </>
        }
      />

      <div className="row grow" style={{ minHeight: 0 }}>
        <div className="map-canvas grow" style={{ position: "relative" }}>
          <MapboxMap center={[120.0, -2.0]} zoom={3.9} bearing={-12} interactive={true} layers={active} />

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
                <div className="mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>{t("map.oppsInView")}</div>
                <div style={{ fontSize: 18, fontWeight: 600, fontFamily: "Source Serif 4" }}>237 <span style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 400, fontFamily: "Inter" }}>{t("map.oppsTracked", { value: "$48.2B" })}</span></div>
              </div>
              <div style={{ width: 1, height: 30, background: "var(--line)" }} />
              <div className="col">
                <span className="chip chip-terra chip-dot" style={{ fontSize: 9 }}>{t("map.featured", { n: 3 })}</span>
                <span className="mono" style={{ fontSize: 9, color: "var(--ink-3)", marginTop: 2 }}>{t("map.matchedThesis")}</span>
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
  const { t } = useI18n();
  const navItems = [t("nav.exploreMap"), t("nav.sectors"), t("nav.whyIndonesia"), t("nav.analysts"), t("nav.pricing")];
  return (
    <div className={"frame col " + (hifi ? "hifi" : "")} style={{ background: "var(--bg)", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <MapboxMap center={[118.5, -1.5]} zoom={4.05} bearing={-12} interactive={true} style={mapStyle} />
      </div>

      <div style={{ position: "absolute", top: 18, left: 18, right: 18, zIndex: 5, height: 56, background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 6px 24px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.6) inset", display: "flex", alignItems: "center", padding: "0 22px", gap: 18 }}>
        <Wordmark name={name} hifi={hifi} />
        <div className="grow" />
        <div style={{ display: "flex", gap: 22, fontSize: 13 }}>
          {navItems.map((label, i) =>
            i === 0 ? (
              <Link key={label} href="/map" style={{ color: "#1a1a2e", fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>{label}</Link>
            ) : (
              <span key={label} onClick={() => comingSoon(label)} style={{ color: "var(--ink-2)", fontWeight: 400, cursor: "pointer" }}>{label}</span>
            )
          )}
        </div>
        <span style={{ width: 1, height: 22, background: "var(--line)" }} />
        <button className="btn btn-sm btn-ghost" onClick={() => comingSoon("Accounts")}>{t("common.signIn")}</button>
        <Link href="/map" style={{ textDecoration: "none" }}>
          <button className="btn btn-sm btn-primary">{t("common.startExploring")} <ArrowRight size={14} strokeWidth={1.75} /></button>
        </Link>
      </div>

      <div style={{ position: "absolute", left: 28, bottom: 28, zIndex: 5, width: 460, padding: "26px 28px", background: "#fff", borderRadius: 18, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 18px 48px rgba(0,0,0,0.18), 0 2px 0 rgba(255,255,255,0.7) inset", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#51b749" }} />
          <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.14em" }}>{t("landing.eyebrow")}</span>
        </div>

        <h1 className="serif" style={{ fontSize: hifi ? 38 : 34, fontWeight: 600, lineHeight: 1.08, letterSpacing: "-0.024em", margin: 0, color: "#1a1a2e", textWrap: "balance" }}>
          {t("landing.headlinePre")} <span style={{ color: "var(--terracotta)" }}>{t("landing.headlineFigure")}</span> {t("landing.headlinePost")}
        </h1>

        <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)", margin: 0, textWrap: "pretty" }}>
          {t("landing.subcopy", { kek: kekData.estates.length })}
        </p>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/map" style={{ textDecoration: "none" }}>
            <button className="btn btn-primary" style={{ padding: "10px 18px", fontSize: 13.5, display: "inline-flex", alignItems: "center", gap: 8 }}>{t("common.exploreMap")} <ArrowRight size={15} strokeWidth={1.75} /></button>
          </Link>
          <button className="btn" style={{ padding: "10px 16px", fontSize: 13.5 }} onClick={() => comingSoon("Sector explorer")}>{t("landing.browseSectors")}</button>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", paddingTop: 12, borderTop: "1px solid var(--line)" }}>
          <AvatarStack items={DATA.analysts} max={3} />
          <span style={{ fontSize: 12, color: "var(--ink-2)" }}>
            <BKPM />&nbsp;<b>{t("landing.analystsCount")}</b> {t("landing.analystsSuffix")}
          </span>
        </div>
      </div>

      <div style={{ position: "absolute", top: 92, right: 18, zIndex: 5, background: "rgba(255,255,255,0.94)", backdropFilter: "blur(6px)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6, boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
        <span className="mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.14em" }}>{t("landing.overlays")}</span>
        {[["#f7b500", t("landing.overlayIndustrial")], ["#7e4dd9", t("landing.overlayKek", { kek: kekData.estates.length })], ["#c44a36", t("landing.overlayFeatured")]].map(([c, l]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--ink-2)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: c, opacity: 0.7, border: `1px solid ${c}` }} />
            {l}
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", right: 28, bottom: 28, zIndex: 5, display: "flex", flexDirection: "column", gap: 8, background: "rgba(255,255,255,0.94)", backdropFilter: "blur(6px)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: "14px 18px", boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}>
        <span className="mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.14em" }}>{t("landing.atlasLive")}</span>
        {[["$48.2B", t("landing.statTracked")], ["237", t("landing.statProjects")], ["38", t("landing.statSectors")]].map(([n, l]) => (
          <div key={l} style={{ display: "flex", alignItems: "baseline", gap: 8, justifyContent: "space-between" }}>
            <span className="serif" style={{ fontSize: 18, fontWeight: 600, color: "#1a1a2e" }}>{n}</span>
            <span className="mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.10em" }}>{l.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
