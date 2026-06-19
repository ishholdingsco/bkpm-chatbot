"use client";
// Workspace active-thread screen, ported from content/midfi-thread.jsx.
// The composer + message list are wired to DeepSeek via useChat.

import { useState } from "react";
import Link from "next/link";
import { useChat } from "@/components/chat/useChat";
import { ChatTurn } from "@/components/chat/ChatTurn";
import { ChatTextarea, SendButton } from "@/components/chat/ChatComposer";
import { DATA, Avatar, AvatarStack, ArtifactCard, BKPM, Logo, TopBar } from "@/components/ui";

// Seed the thread from the canned demo turns. Each carries both the API
// fields (role/content) and the richer render fields used by ChatTurn.
const SEED_MESSAGES = DATA.turns.map((t) => ({
  role: t.who === "user" ? "user" : "assistant",
  content: t.text,
  who: t.who,
  name: t.name,
  time: t.time,
  cite: t.cite,
  pin: t.pin,
  kind: t.kind,
}));

// ─── Sidebar (collapsible) ───
function Sidebar({ collapsed, onToggle }) {
  if (collapsed) {
    return (
      <div className="col" style={{ width: 56, borderRight: "1px solid var(--line)", background: "var(--surface-2)", padding: "12px 6px", gap: 12, alignItems: "center" }}>
        <Logo size={14} showTag={false} />
        <div style={{ height: 1, width: "100%", background: "var(--line)", margin: "4px 0" }} />
        {DATA.projects.map((p) => (
          <div key={p.id} title={p.name} style={{ width: 36, height: 36, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: p.active ? "var(--terracotta-soft)" : "var(--surface)", border: "1px solid " + (p.active ? "var(--terracotta)" : "var(--line)"), fontFamily: "IBM Plex Mono, monospace", fontSize: 10, fontWeight: 600, color: p.active ? "var(--terracotta)" : "var(--ink-2)", cursor: "pointer" }}>{p.short.slice(0, 2)}</div>
        ))}
        <div className="grow" />
        <button className="btn btn-ghost" onClick={onToggle} style={{ padding: 6 }} title="Expand sidebar">
          <span className="mono" style={{ fontSize: 12 }}>›</span>
        </button>
      </div>
    );
  }
  return (
    <div className="col" style={{ width: 240, borderRight: "1px solid var(--line)", background: "var(--surface-2)" }}>
      <div style={{ padding: "14px 14px 10px", display: "flex", alignItems: "center", gap: 8 }}>
        <Logo size={16} />
        <div className="grow" />
        <button className="btn btn-ghost" onClick={onToggle} style={{ padding: 4 }} title="Collapse">
          <span className="mono" style={{ fontSize: 12 }}>‹</span>
        </button>
      </div>

      <div style={{ padding: "0 10px 10px" }}>
        <button className="btn" style={{ width: "100%", justifyContent: "flex-start", padding: "6px 8px" }}>
          <Avatar name={DATA.org.short} color={DATA.org.color} size="sm" />
          <span style={{ fontSize: 12, fontWeight: 500 }}>{DATA.org.name}</span>
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)", marginLeft: "auto" }}>⌄</span>
        </button>
      </div>

      <div className="div-h" />

      <div className="scroll col grow" style={{ padding: "12px 10px", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "center", padding: "0 6px 6px" }}>
          <span className="label">Projects · 4</span>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto", padding: 2 }}>＋</button>
        </div>

        {DATA.projects.map((p) => (
          <div key={p.id} style={{ padding: "7px 10px", borderRadius: 6, background: p.active ? "var(--terracotta-soft)" : "transparent", cursor: "pointer", position: "relative" }}>
            {p.active && <div style={{ position: "absolute", left: 0, top: 6, bottom: 6, width: 2, borderRadius: 2, background: "var(--terracotta)" }} />}
            <div className="mono" style={{ fontSize: 9, color: p.active ? "var(--terracotta)" : "var(--ink-4)", letterSpacing: "0.06em" }}>{p.short}</div>
            <div style={{ fontSize: 12, fontWeight: p.active ? 600 : 400, color: "var(--ink)", lineHeight: 1.3, marginTop: 1 }}>{p.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span className="mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>{p.stage}</span>
              <span className="mono" style={{ fontSize: 9, color: "var(--ink-4)" }}>· {p.threads}</span>
            </div>

            {p.active && (
              <div style={{ marginTop: 8, marginLeft: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                {DATA.threads.map((t) => (
                  <div key={t.id} style={{ padding: "4px 8px", borderRadius: 4, background: t.active ? "var(--surface)" : "transparent", border: t.active ? "1px solid var(--line)" : "1px solid transparent", display: "flex", alignItems: "center", gap: 6 }}>
                    {t.unread && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--terracotta)" }} />}
                    <span style={{ fontSize: 11, fontWeight: t.active ? 600 : 400, color: t.active ? "var(--ink)" : "var(--ink-2)", lineHeight: 1.3, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</span>
                    <span className="mono" style={{ fontSize: 9, color: "var(--ink-4)" }}>{t.updated}</span>
                  </div>
                ))}
                <div style={{ padding: "4px 8px", fontSize: 11, color: "var(--ink-3)", cursor: "pointer" }}>+ new thread</div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="div-h" />

      <div style={{ padding: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <Avatar name={DATA.user.short} color={DATA.user.color} size="sm" />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 500 }}>{DATA.user.name}</div>
          <div className="mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>{DATA.user.role}</div>
        </div>
        <span className="mono" style={{ fontSize: 12, color: "var(--ink-3)", marginLeft: "auto" }}>⌄</span>
      </div>
    </div>
  );
}

// ─── Analyst presence ribbon (top of chat) ───
function PresenceRibbon({ onBookCall, onPullIn, show }) {
  if (!show) return null;
  const lead = DATA.analysts[0];
  return (
    <div style={{ background: "linear-gradient(to right, var(--jade-soft), var(--surface-2))", borderBottom: "1px solid var(--line)", padding: "8px 20px", display: "flex", alignItems: "center", gap: 12 }}>
      <Avatar name={lead.short} color={lead.color} size="sm" status="online" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12 }}>
          <span style={{ fontWeight: 600 }}>{lead.name}</span>
          <span style={{ color: "var(--ink-3)" }}> watching this thread · </span>
          <span style={{ color: "var(--jade)" }}>● online now</span>
          <span style={{ color: "var(--ink-3)" }}> · usually replies in ~2h · {lead.interactions} prior interactions with you</span>
        </div>
      </div>
      <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>+2 more on call</span>
      <AvatarStack items={DATA.analysts} max={3} />
      <button className="btn btn-sm" onClick={onBookCall}>Book 30m</button>
      <button className="btn btn-sm btn-primary" onClick={onPullIn}>Pull in →</button>
    </div>
  );
}

function FloatingChip({ onClick, show }) {
  if (!show) return null;
  return (
    <div style={{ position: "absolute", top: 70, right: 24, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 999, padding: "5px 10px 5px 6px", boxShadow: "var(--shadow-2)", display: "flex", alignItems: "center", gap: 8, zIndex: 4, cursor: "pointer" }} onClick={onClick}>
      <Avatar name="RP" color="#b94a1f" size="sm" status="online" />
      <span style={{ fontSize: 11, fontWeight: 500 }}>Rina is here</span>
      <span className="mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>↗</span>
    </div>
  );
}

// ─── Composer (live) ───
function Composer({ input, setInput, onSend, loading, onReferHuman }) {
  return (
    <div style={{ borderTop: "1px solid var(--line)", padding: "12px 20px 14px", background: "var(--surface-2)" }}>
      <div className="card" style={{ padding: "10px 12px" }}>
        <ChatTextarea
          value={input}
          onChange={setInput}
          onSend={onSend}
          submitOn="mod-enter"
          rows={2}
          placeholder="Ask about regulations, structure, comps — or @mention an analyst…"
          style={{ width: "100%", border: "none", outline: "none", resize: "none", fontSize: 13, lineHeight: 1.5, fontFamily: "Inter, sans-serif", background: "transparent", color: "var(--ink)", minHeight: 38 }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <button className="btn btn-sm btn-ghost">＋ Attach</button>
          <button className="btn btn-sm btn-ghost">@ Mention</button>
          <button className="btn btn-sm btn-ghost">/ Slash</button>
          <button className="btn btn-sm" onClick={onReferHuman} style={{ color: "var(--terracotta)", borderColor: "var(--terracotta-tint)" }}>↗ Refer to human</button>
          <div className="grow" />
          <span className="mono" style={{ fontSize: 9, color: "var(--ink-4)" }}>
            <span className="kbd">⌘</span> <span className="kbd">↵</span> send
          </span>
          <SendButton className="btn btn-sm btn-jade" loading={loading} input={input} onSend={onSend} />
        </div>
      </div>
    </div>
  );
}

// ─── Canvas rail (artifacts) ───
function CanvasRail({ mode, onToggle, onPopout, onArtifactClick }) {
  if (mode === "hidden") return null;
  const isPopout = mode === "popout";
  const width = isPopout ? 600 : 300;

  return (
    <div className="col" style={{ width, borderLeft: "1px solid var(--line)", background: "var(--surface-2)", transition: "width 0.2s" }}>
      <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--line)" }}>
        <span className="label">Shared canvas</span>
        <span className="chip" style={{ marginLeft: 4 }}>{DATA.artifacts.length} artifacts</span>
        <div className="grow" />
        <button className="btn btn-ghost btn-sm" onClick={onPopout} title={isPopout ? "Shrink" : "Pop out"}>
          <span className="mono" style={{ fontSize: 11 }}>{isPopout ? "⤢" : "⤡"}</span>
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onToggle} title="Collapse">
          <span className="mono" style={{ fontSize: 11 }}>×</span>
        </button>
      </div>

      <div className="scroll col grow" style={{ padding: 12, gap: 10 }}>
        <div style={{ fontSize: 11, color: "var(--ink-3)", lineHeight: 1.4 }}>Pinned by AI + analyst as the thread evolves. Edits sync to project memory.</div>

        {isPopout ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {DATA.artifacts.map((a) => <ArtifactCard key={a.title} {...a} onClick={onArtifactClick} />)}
          </div>
        ) : (
          DATA.artifacts.map((a) => <ArtifactCard key={a.title} {...a} onClick={onArtifactClick} />)
        )}

        <div style={{ padding: 10, border: "1px dashed var(--line-strong)", borderRadius: 6, textAlign: "center", fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>+ Pin from chat or upload</div>

        <div className="card" style={{ padding: 12, marginTop: 8 }}>
          <div className="label" style={{ marginBottom: 8 }}>On call · <BKPM /></div>
          {DATA.analysts.map((a) => (
            <div key={a.short} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
              <Avatar name={a.short} color={a.color} size="sm" status={a.status} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 11.5, fontWeight: 500 }}>{a.name}</div>
                <div className="mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>{a.focus}</div>
              </div>
              <button className="btn btn-sm btn-ghost" style={{ padding: 4 }}>↗</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN — Active thread screen ───
export function ActiveThread() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [canvasMode, setCanvasMode] = useState("rail");
  const [showPresence, setShowPresence] = useState(true);

  const context = `User is in the Wilaya workspace, project "${DATA.projects[0].name}" (${DATA.projects[0].short}), thread "${DATA.threads[0].name}". They are a foreign institutional investor (Khazanah Nasional) doing diligence on nickel midstream co-investment with state-owned MIND ID.`;
  const { messages, input, setInput, send, loading } = useChat({ initialMessages: SEED_MESSAGES, context });

  return (
    <div className="frame col">
      <TopBar
        showLogo={false}
        showOrg={false}
        left={
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              <Link href="/map" className="mono" style={{ color: "var(--ink-3)", textDecoration: "none" }}>{DATA.org.name}</Link>
              <span style={{ color: "var(--ink-4)" }}>/</span>
              <span style={{ fontWeight: 500 }}>{DATA.projects[0].name}</span>
              <span style={{ color: "var(--ink-4)" }}>/</span>
              <span style={{ fontWeight: 600, color: "var(--terracotta)" }}>{DATA.threads[0].name}</span>
            </div>
            <span className="chip chip-jade chip-dot" style={{ marginLeft: 4 }}>Diligence</span>
          </>
        }
        right={
          <>
            <button className="btn btn-sm btn-ghost"><span className="mono">⌘K</span> Search</button>
            <button className="btn btn-sm btn-ghost">🔔</button>
            {canvasMode === "hidden" && (
              <button className="btn btn-sm" onClick={() => setCanvasMode("rail")}>Show canvas →</button>
            )}
          </>
        }
      />

      <div className="row grow" style={{ minHeight: 0 }}>
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

        <div className="col grow" style={{ minWidth: 0, position: "relative", background: "var(--surface)" }}>
          <PresenceRibbon show={showPresence} onBookCall={() => setShowPresence(true)} onPullIn={() => setShowPresence(true)} />
          <FloatingChip show={showPresence} onClick={() => {}} />

          <div style={{ padding: "20px 28px 12px", borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <h1 className="serif" style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>{DATA.threads[0].name}</h1>
              <div className="grow" />
              <button className="btn btn-sm btn-ghost">⋯</button>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>Started 26 Apr · live thread · 2 artifacts pinned</span>
              <span className="chip">Regulatory</span>
              <span className="chip">Structuring</span>
            </div>
          </div>

          <div className="scroll col grow" style={{ padding: "20px 28px", gap: 18 }}>
            {messages.map((m, i) => (
              <ChatTurn key={i} turn={m} loading={loading && i === messages.length - 1} />
            ))}
          </div>

          <Composer input={input} setInput={setInput} onSend={() => send()} loading={loading} onReferHuman={() => setShowPresence(true)} />
        </div>

        <CanvasRail
          mode={canvasMode}
          onToggle={() => setCanvasMode("hidden")}
          onPopout={() => setCanvasMode(canvasMode === "popout" ? "rail" : "popout")}
          onArtifactClick={() => {}}
        />
      </div>
    </div>
  );
}
