"use client";
// Map page (hero) + Landing, ported from content/map-screens.jsx.
// The chat sidebar ("Ask Nusantara") is wired to DeepSeek via useChat.

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDown, ChevronRight, Plus, Minus, Locate, Compass,
  Search, MessageCircle, ArrowUpRight, ArrowRight, Loader2,
} from "lucide-react";
import MapboxMap from "@/components/map/MapboxMap";
import { applyLayerChange, boundsOf, resolveFlyTo, selectOpportunities } from "@/components/map/mapActions";
import { useChat } from "@/components/chat/useChat";
import { useStickToBottom, JumpToLatest } from "@/components/chat/useStickToBottom";
import { ChatTextarea, SendButton } from "@/components/chat/ChatComposer";
import { Markdown } from "@/components/chat/Markdown";
import { Switch, Tooltip } from "@/components/ui/controls";
import { DATA, Avatar, AvatarStack, BKPM, Logo, TopBar, comingSoon, useI18n, LangToggle } from "@/components/ui";
import industrialData from "@/data/industrial-estates.json";
import kekData from "@/data/kek.json";
import mineralsData from "@/data/minerals.json";
import portsData from "@/data/ports.json";
import opportunitiesData from "@/data/opportunities.json";

// Counts come straight from the static JSON in data/ so the panel and the map
// can never drift apart. Only layers that carry real point/polygon data are
// listed — the old "coming soon" rows (WIUP/GDP/infra) were dropped so every
// toggle here actually does something. Display name/description live in
// messages/*.json under map.layerNames / map.layerDesc, keyed by `id`.
const LAYERS = [
  { id: "industrial", color: "#f7b500", count: industrialData.estates.length },
  { id: "kek", color: "#7e4dd9", count: kekData.estates.length },
  { id: "minerals", color: "#e8533f", count: mineralsData.deposits.length },
  { id: "ports", color: "#1a1a2e", count: portsData.ports.length },
];

function Wordmark({ name, tag = "BKPM", hifi = false, size = 17 }) {
  return <Logo size={size} showTag={!!tag} />;
}

// ─── Layer panel ───
function LayerPanel({ active, onToggle, hifi }) {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className={"card " + (hifi ? "hifi" : "")} style={{ position: "absolute", top: 16, left: 16, width: 260, padding: 12, zIndex: 3 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: collapsed ? 0 : 8 }}>
        <span className="label">{t("map.layers")}</span>
        <span className="chip" style={{ marginLeft: 6, fontSize: 9 }}>{t("map.layersOn", { n: Object.values(active).filter(Boolean).length })}</span>
        <div className="grow" />
        <button
          className="btn btn-sm btn-ghost ui-icon-btn"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={t("map.collapseLayers")}
          aria-expanded={!collapsed}
        >
          <ChevronDown size={15} strokeWidth={1.75} style={{ transition: "transform 0.15s", transform: collapsed ? "rotate(-90deg)" : "none" }} />
        </button>
      </div>
      {!collapsed && LAYERS.map((l) => {
        const on = !!active[l.id];
        const name = t("map.layerNames." + l.id);
        const desc = t("map.layerDesc." + l.id, { n: l.count });
        return (
          <div
            key={l.id}
            className={"layer-pill " + (on ? "active" : "")}
            onClick={() => onToggle(l.id)}
            style={{ cursor: "pointer" }}
          >
            <div className="layer-swatch" style={{ background: l.color, opacity: on ? 1 : 0.3 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.2 }}>{name}</div>
              <div className="mono" style={{ fontSize: 9, color: "var(--ink-3)", marginTop: 2 }}>{desc}</div>
            </div>
            <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexShrink: 0 }}>
              <Switch checked={on} onCheckedChange={() => onToggle(l.id)} color={l.color} aria-label={name} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Map controls (zoom, locate, compass) — drive the real Mapbox instance ───
function MapControls({ mapRef }) {
  const { t } = useI18n();
  const map = () => mapRef.current;
  return (
    <div style={{ position: "absolute", top: 16, right: 16, zIndex: 3, display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="map-control">
        <Tooltip content={t("map.zoomIn")}><button aria-label={t("map.zoomIn")} onClick={() => map()?.zoomIn()}><Plus size={16} strokeWidth={1.75} /></button></Tooltip>
        <Tooltip content={t("map.zoomOut")}><button aria-label={t("map.zoomOut")} onClick={() => map()?.zoomOut()}><Minus size={16} strokeWidth={1.75} /></button></Tooltip>
      </div>
      <div className="map-control">
        <Tooltip content={t("map.locate")}><button aria-label={t("map.locate")} onClick={() => map()?.locate()}><Locate size={16} strokeWidth={1.75} /></button></Tooltip>
        <Tooltip content={t("map.resetBearing")}><button aria-label={t("map.compass")} onClick={() => map()?.resetNorth()}><Compass size={16} strokeWidth={1.75} /></button></Tooltip>
      </div>
    </div>
  );
}

// ─── Chat sidebar (collapsible, contextual to map) — LIVE via DeepSeek ───
// Presentational: the chat state + map-action wiring live in MapPage so the
// assistant's tool calls can drive the same `active` / map the panel reflects.
function MapChat({ open, onToggle, hifi, activeLayers, viewLabel, chat }) {
  const { t } = useI18n();
  const { messages, input, setInput, send, loading, retrying } = chat;
  const { containerRef, onScroll, scrollToBottom, isFollowing } = useStickToBottom(messages);
  const composerRef = useRef(null);
  // Sending (composer or a suggestion) snaps to the bottom and re-engages following.
  const handleSend = (text) => { scrollToBottom(); send(text); };
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
    <div className={"col " + (hifi ? "hifi" : "")} style={{ width: 340, borderLeft: "1px solid var(--line)", background: "var(--surface)", position: "relative" }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 8 }}>
        <Avatar name="AI" color="#1a1a2e" size="sm" status="online" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{t("map.askNusantara")}</div>
          <div className="mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>
            {t("map.reading", {
              n: Object.values(activeLayers).filter(Boolean).length,
              view: viewLabel,
            })}
          </div>
        </div>
        <Tooltip content={t("common.collapse")} side="bottom">
          <button className="btn btn-ghost btn-sm ui-icon-btn" onClick={onToggle} aria-label={t("map.collapseChat")}><ChevronRight size={16} strokeWidth={1.75} /></button>
        </Tooltip>
      </div>

      <div ref={containerRef} onScroll={onScroll} className="scroll col grow" style={{ padding: "14px", gap: 14 }}>
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
                    onClick={() => !loading && handleSend(s)}
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
                  <Loader2 size={14} strokeWidth={2} className="spin" /> {t(retrying ? "chat.reconnecting" : "common.thinking")}
                </span>
              ) : (
                ""
              )}
            </div>
          )
        )}
      </div>

      <JumpToLatest show={!isFollowing && messages.length > 0} onClick={() => scrollToBottom("smooth")} label={t("chat.toLatest")} anchorRef={composerRef} />

      <div ref={composerRef} style={{ borderTop: "1px solid var(--line)", padding: 12 }}>
        <div className="card" style={{ padding: "8px 10px", display: "flex", alignItems: "flex-end", gap: 8 }}>
          <ChatTextarea
            value={input}
            onChange={setInput}
            onSend={() => handleSend()}
            submitOn="enter"
            rows={1}
            maxHeight={120}
            placeholder={t("map.chatPlaceholder")}
            style={{ flex: 1, border: "none", outline: "none", resize: "none", fontSize: 12.5, fontFamily: "Inter, sans-serif", background: "transparent", color: "var(--ink)" }}
          />
          <SendButton className="btn btn-sm btn-primary" loading={loading} input={input} onSend={() => handleSend()} />
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <span className="chip" style={{ cursor: "pointer" }} onClick={() => comingSoon("Save view")}><Plus size={11} strokeWidth={2} /> {t("map.saveView")}</span>
          <Link href="/workspace/new" style={{ textDecoration: "none" }}>
            <span className="chip chip-terra" style={{ cursor: "pointer" }}><ArrowUpRight size={11} strokeWidth={2} /> {t("map.startWorkspace")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Is a point inside a bounding box, allowing a degree margin (~111 km/deg)?
function inBounds([lng, lat], [[minLng, minLat], [maxLng, maxLat]], margin = 1.0) {
  return lng >= minLng - margin && lng <= maxLng + margin && lat >= minLat - margin && lat <= maxLat + margin;
}

// ─── MAP PAGE — hero ───
export function MapPage({ hifi = false }) {
  const { t, lang } = useI18n();
  const [chatOpen, setChatOpen] = useState(true);
  const [active, setActive] = useState({
    industrial: true, kek: true, minerals: true, ports: true,
  });
  const [pinFilter, setPinFilter] = useState(null);
  // A single opportunity the human clicked on the map. Drives the top card the
  // same way a chat filter does, so the card appears on a click — not only when
  // the assistant filters. Most-recent action wins (see `cardInfo`).
  const [selected, setSelected] = useState(null);
  const [viewLabel, setViewLabel] = useState(t("map.viewDefault"));
  // The map's own skeleton covers the canvas until tiles + layers settle; we
  // also hold back the floating chrome (layer panel, controls, scale) until then
  // so nothing appears half-baked over a still-loading map (issue #39).
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);

  // Chat context the assistant sees — kept in sync with what's on screen so its
  // answers (and tool calls) match the visible map.
  const activeLayerNames = LAYERS.filter((l) => active[l.id]).map((l) => t("map.layerNames." + l.id)).join(", ");
  const context = useMemo(
    () =>
      `User is on the Wilaya map view. Active map layers: ${activeLayerNames || "none"}. Current view: ${viewLabel}.` +
      (pinFilter ? ` Opportunity pins filtered to: ${pinFilter.label} (${pinFilter.ids?.length ?? 0} shown).` : "") +
      ` You can change all of this with the map tools.`,
    [activeLayerNames, viewLabel, pinFilter]
  );

  // Frame the camera tightly on a set of points: a lone point flies in close, a
  // group fits with little padding so the move actually "zooms in".
  const frameCoords = (coords) => {
    if (coords.length === 1) mapRef.current?.flyTo({ center: coords[0], zoom: 8.5 });
    else mapRef.current?.fitBounds(boundsOf(coords), { padding: 64, maxZoom: 9 });
  };

  // Dispatch a batch of assistant tool calls onto the real map. Handling the
  // whole batch at once keeps the camera coherent: when a fly_to and a filter
  // arrive together (e.g. "zoom to the Sulawesi nickel cluster") we frame the
  // filtered pins that fall inside the region — so the camera dives onto the
  // actual cluster instead of fitting the whole island from far away.
  const onAction = useCallback((actions) => {
    const batch = Array.isArray(actions) ? actions : [actions];

    // Layers: fold every set_layers call onto the live state.
    const layerCalls = batch.filter((a) => a?.name === "set_layers");
    if (layerCalls.length) {
      setActive((prev) => layerCalls.reduce((acc, a) => applyLayerChange(acc, a.args || {}), prev));
    }

    const fly = batch.find((a) => a?.name === "fly_to");
    const filt = batch.find((a) => a?.name === "filter_opportunities");

    const region = fly ? resolveFlyTo(fly.args || {}) : null;
    if (region?.label) setViewLabel(region.label);

    let selCoords = null;
    if (filt) {
      setSelected(null); // an assistant filter supersedes a single clicked pin
      const sel = selectOpportunities(filt.args || {});
      // No matches (or an explicit clear) → drop the filter so every pin stays
      // visible, rather than emphasizing an empty set.
      if (!sel.ids || sel.ids.length === 0) setPinFilter(null);
      else {
        setPinFilter(sel);
        selCoords = sel.coords;
      }
    }

    // Pick the tightest correct thing to frame.
    if (selCoords?.length) {
      const rb = region?.bounds || (region?.center ? boundsOf([region.center]) : null);
      const within = rb ? selCoords.filter((c) => inBounds(c, rb)) : selCoords;
      frameCoords(within.length ? within : selCoords);
    } else if (region) {
      if (region.bounds) mapRef.current?.fitBounds(region.bounds, { padding: 56, maxZoom: 9 });
      else mapRef.current?.flyTo({ center: region.center, zoom: region.zoom });
    }
  }, []);

  const chat = useChat({ context, lang, mapTools: true, onAction });

  // Clicking a featured pin both surfaces the top card (via `selected`) and
  // pulls its context into the chat: open the panel and prefill a question about
  // that opportunity. The card then stays put and just switches as you click
  // around — there's no dismiss; another click/filter replaces it.
  const onPinClick = useCallback(
    (id) => {
      const opp = opportunitiesData.opportunities.find((o) => o.id === id);
      if (!opp) return;
      setSelected(id);
      setChatOpen(true);
      chat.setInput(t("map.pinPrompt", { label: opp.label }));
    },
    [chat, t]
  );

  // The detail card shows ONE opportunity's real data (IMIP-style): a clicked
  // pin takes precedence, otherwise the first pin of a chat filter. `more` is how
  // many other opportunities the filter also matched. null hides the card. The
  // click path is deterministic, so the card always appears on a click even if
  // the assistant chose not to call a map tool.
  const card = useMemo(() => {
    const find = (id) => opportunitiesData.opportunities.find((o) => o.id === id) || null;
    if (selected) {
      const o = find(selected);
      if (o) return { opp: o, more: 0 };
    }
    if (pinFilter?.ids?.length) {
      const o = find(pinFilter.ids[0]);
      if (o) return { opp: o, more: (pinFilter.count || pinFilter.ids.length) - 1 };
    }
    return null;
  }, [selected, pinFilter]);

  // Map is the active tab here; "Value Chain" links to the Hilirisasi page.
  // Keep the order in sync with HilirisasiPage's nav (Map · Value Chain · …).
  const navItems = [t("nav.map"), t("nav.valueChain"), t("nav.sectors"), t("nav.opportunities"), t("nav.analysts")];
  return (
    <div className={"frame col " + (hifi ? "hifi" : "")}>
      <TopBar
        showOrg={false}
        left={
          <div style={{ display: "flex", gap: 4 }}>
            {navItems.map((label, i) => {
              const active = i === 0;
              const style = { padding: "6px 10px", fontSize: 12.5, fontWeight: active ? 600 : 500, color: active ? "var(--terracotta)" : "var(--ink-2)", borderBottom: active ? "2px solid var(--terracotta)" : "2px solid transparent", cursor: "pointer" };
              if (i === 0) return <span key={label} style={style}>{label}</span>;
              if (i === 1) return <Link key={label} href="/hilirisasi" style={{ ...style, textDecoration: "none" }}>{label}</Link>;
              return <span key={label} onClick={() => comingSoon(label)} style={style}>{label}</span>;
            })}
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
          <MapboxMap
            ref={mapRef}
            center={[120.0, -2.0]}
            zoom={3.9}
            bearing={-12}
            interactive={true}
            layers={active}
            pinFilter={pinFilter}
            onPinClick={onPinClick}
            onReady={() => setMapReady(true)}
          />

          {/* Floating chrome — only once the map is ready, fading in together so
              it doesn't pop over a still-loading basemap (issue #39). */}
          {mapReady && (
            <div style={{ animation: "ui-fade 0.4s ease-out" }}>
              <LayerPanel active={active} onToggle={(id) => setActive({ ...active, [id]: !active[id] })} hifi={hifi} />
              <MapControls mapRef={mapRef} />

              <div style={{ position: "absolute", bottom: 16, left: 16, display: "flex", gap: 8, alignItems: "center", zIndex: 3 }}>
                <div className="card" style={{ padding: "6px 10px", display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>0  500km</span>
                  <div style={{ width: 60, height: 3, background: "linear-gradient(to right, #1a1a2e 50%, #fff 50%)", border: "1px solid #1a1a2e" }} />
                </div>
              </div>
            </div>
          )}

          {/* Opportunity detail card (IMIP-style) — hidden until a pin is clicked
              (human) or the chat filters/highlights a set (AI). Every value is the
              real data of that opportunity, never hardcoded. */}
          {card && (
            <div className="map-tooltip" style={{ top: 16, left: "50%", transform: "translateX(-50%)", width: 264 }}>
              <div className="mono" style={{ fontSize: 9, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{card.opp.province}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2, lineHeight: 1.25 }}>{card.opp.label}</div>
              <div style={{ fontSize: 11, color: "var(--ink-2)", marginTop: 4, lineHeight: 1.4 }}>
                {card.opp.sector}{card.opp.irr ? ` · IRR ${card.opp.irr}` : ""}
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 7, flexWrap: "wrap" }}>
                {card.opp.status && <span className="chip chip-jade chip-dot" style={{ fontSize: 8 }}>{card.opp.status}</span>}
                {card.opp.ticket && <span className="chip" style={{ fontSize: 8 }}>{card.opp.ticket}</span>}
                {card.opp.foreignCap && <span className="chip" style={{ fontSize: 8 }}>{t("map.foreignChip", { cap: card.opp.foreignCap })}</span>}
              </div>
              {card.more > 0 && (
                <div className="mono" style={{ fontSize: 9, color: "var(--ink-3)", marginTop: 7 }}>{t("map.moreOpps", { n: card.more })}</div>
              )}
            </div>
          )}
        </div>

        <MapChat
          open={chatOpen}
          onToggle={() => setChatOpen(!chatOpen)}
          hifi={hifi}
          activeLayers={active}
          viewLabel={viewLabel}
          chat={chat}
        />
      </div>
    </div>
  );
}

// ─── PUBLIC LANDING — full-bleed Mapbox map, floating chrome on top ───
export function Landing({ name = "Wilaya", hifi = false, mapStyle }) {
  const { t } = useI18n();
  const navItems = [t("nav.exploreMap"), t("nav.valueChain"), t("nav.sectors"), t("nav.whyIndonesia"), t("nav.analysts"), t("nav.pricing")];
  return (
    <div className={"frame col " + (hifi ? "hifi" : "")} style={{ background: "var(--bg)", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <MapboxMap center={[118.5, -1.5]} zoom={4.05} bearing={-12} interactive={true} style={mapStyle} />
      </div>

      <div style={{ position: "absolute", top: 18, left: 18, right: 18, zIndex: 5, height: 56, background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 6px 24px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.6) inset", display: "flex", alignItems: "center", padding: "0 22px", gap: 18 }}>
        <Wordmark name={name} hifi={hifi} />
        <div className="grow" />
        <div style={{ display: "flex", gap: 22, fontSize: 13 }}>
          {navItems.map((label, i) => {
            if (i === 0) return <Link key={label} href="/map" style={{ color: "#1a1a2e", fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>{label}</Link>;
            if (i === 1) return <Link key={label} href="/hilirisasi" style={{ color: "var(--ink-2)", fontWeight: 400, cursor: "pointer", textDecoration: "none" }}>{label}</Link>;
            return <span key={label} onClick={() => comingSoon(label)} style={{ color: "var(--ink-2)", fontWeight: 400, cursor: "pointer" }}>{label}</span>;
          })}
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
        {[["#f7b500", t("landing.overlayIndustrial")], ["#7e4dd9", t("landing.overlayKek", { kek: kekData.estates.length })], ["#0055a6", t("landing.overlayFeatured")]].map(([c, l]) => (
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
