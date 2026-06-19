"use client";
// Workspace active-thread screen, ported from content/midfi-thread.jsx.
// The composer + message list are wired to DeepSeek via useChat.

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, ChevronDown, Plus, X, ArrowRight, ArrowUpRight,
  Paperclip, AtSign, Slash, Bell, Search, MoreHorizontal, Maximize2, Minimize2,
} from "lucide-react";
import { useChat } from "@/components/chat/useChat";
import { ChatTurn } from "@/components/chat/ChatTurn";
import { ChatTextarea, SendButton } from "@/components/chat/ChatComposer";
import { DropdownMenu, Dialog, Tooltip } from "@/components/ui/controls";
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
        <Tooltip content="Expand sidebar" side="right">
          <button className="btn btn-ghost ui-icon-btn" onClick={onToggle} aria-label="Expand sidebar">
            <ChevronRight size={16} strokeWidth={1.75} />
          </button>
        </Tooltip>
      </div>
    );
  }
  return (
    <div className="col" style={{ width: 240, borderRight: "1px solid var(--line)", background: "var(--surface-2)" }}>
      <div style={{ padding: "14px 14px 10px", display: "flex", alignItems: "center", gap: 8 }}>
        <Logo size={16} />
        <div className="grow" />
        <Tooltip content="Collapse sidebar">
          <button className="btn btn-ghost ui-icon-btn" onClick={onToggle} aria-label="Collapse sidebar">
            <ChevronLeft size={16} strokeWidth={1.75} />
          </button>
        </Tooltip>
      </div>

      <div style={{ padding: "0 10px 10px" }}>
        <DropdownMenu
          trigger={
            <button className="btn" style={{ width: "100%", justifyContent: "flex-start", padding: "6px 8px" }}>
              <Avatar name={DATA.org.short} color={DATA.org.color} size="sm" />
              <span style={{ fontSize: 12, fontWeight: 500 }}>{DATA.org.name}</span>
              <ChevronDown size={14} strokeWidth={1.75} style={{ marginLeft: "auto", color: "var(--ink-3)" }} />
            </button>
          }
          items={[
            { label: "Switch organization" },
            { label: "Organization settings" },
            { separator: true },
            { label: "Invite teammates", icon: <Plus size={14} strokeWidth={1.75} /> },
          ]}
        />
      </div>

      <div className="div-h" />

      <div className="scroll col grow" style={{ padding: "12px 10px", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "center", padding: "0 6px 6px" }}>
          <span className="label">Projects · 4</span>
          <Tooltip content="New project">
            <Link href="/workspace/new" className="btn btn-ghost btn-sm ui-icon-btn" style={{ marginLeft: "auto" }} aria-label="New project"><Plus size={15} strokeWidth={1.75} /></Link>
          </Tooltip>
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
                <Link href="/workspace/new" style={{ textDecoration: "none", color: "var(--ink-3)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}><Plus size={12} strokeWidth={1.75} /> new thread</div>
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="div-h" />

      <div style={{ padding: 10 }}>
        <DropdownMenu
          side="top"
          trigger={
            <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "flex-start", gap: 8, padding: 4 }}>
              <Avatar name={DATA.user.short} color={DATA.user.color} size="sm" />
              <div style={{ minWidth: 0, textAlign: "left" }}>
                <div style={{ fontSize: 11, fontWeight: 500 }}>{DATA.user.name}</div>
                <div className="mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>{DATA.user.role}</div>
              </div>
              <ChevronDown size={14} strokeWidth={1.75} style={{ marginLeft: "auto", color: "var(--ink-3)" }} />
            </button>
          }
          items={[
            { label: "Account settings" },
            { label: "Preferences" },
            { separator: true },
            { label: "Sign out" },
          ]}
        />
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
          <span style={{ color: "var(--jade)", display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />online now</span>
          <span style={{ color: "var(--ink-3)" }}> · usually replies in ~2h · {lead.interactions} prior interactions with you</span>
        </div>
      </div>
      <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>+2 more on call</span>
      <AvatarStack items={DATA.analysts} max={3} />
      <button className="btn btn-sm" onClick={onBookCall}>Book 30m</button>
      <button className="btn btn-sm btn-primary" onClick={onPullIn}>Pull in <ArrowRight size={14} strokeWidth={1.75} /></button>
    </div>
  );
}

function FloatingChip({ onClick, show }) {
  if (!show) return null;
  return (
    <div style={{ position: "absolute", top: 70, right: 24, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 999, padding: "5px 10px 5px 6px", boxShadow: "var(--shadow-2)", display: "flex", alignItems: "center", gap: 8, zIndex: 4, cursor: "pointer" }} onClick={onClick}>
      <Avatar name="RP" color="#b94a1f" size="sm" status="online" />
      <span style={{ fontSize: 11, fontWeight: 500 }}>Rina is here</span>
      <ArrowUpRight size={13} strokeWidth={1.75} style={{ color: "var(--ink-3)" }} />
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
          <button className="btn btn-sm btn-ghost"><Paperclip size={14} strokeWidth={1.75} /> Attach</button>
          <button className="btn btn-sm btn-ghost"><AtSign size={14} strokeWidth={1.75} /> Mention</button>
          <button className="btn btn-sm btn-ghost"><Slash size={14} strokeWidth={1.75} /> Slash</button>
          <button className="btn btn-sm" onClick={onReferHuman} style={{ color: "var(--terracotta)", borderColor: "var(--terracotta-tint)" }}><ArrowUpRight size={14} strokeWidth={1.75} /> Refer to human</button>
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
        <Tooltip content={isPopout ? "Shrink" : "Pop out"}>
          <button className="btn btn-ghost btn-sm ui-icon-btn" onClick={onPopout} aria-label={isPopout ? "Shrink canvas" : "Pop out canvas"}>
            {isPopout ? <Minimize2 size={15} strokeWidth={1.75} /> : <Maximize2 size={15} strokeWidth={1.75} />}
          </button>
        </Tooltip>
        <Tooltip content="Collapse">
          <button className="btn btn-ghost btn-sm ui-icon-btn" onClick={onToggle} aria-label="Collapse canvas">
            <X size={15} strokeWidth={1.75} />
          </button>
        </Tooltip>
      </div>

      <div className="scroll col grow" style={{ padding: 12, gap: 10 }}>
        <div style={{ fontSize: 11, color: "var(--ink-3)", lineHeight: 1.4 }}>Pinned by AI + analyst as the thread evolves. Edits sync to project memory.</div>

        {isPopout ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {DATA.artifacts.map((a) => <ArtifactCard key={a.title} {...a} onClick={() => onArtifactClick(a)} />)}
          </div>
        ) : (
          DATA.artifacts.map((a) => <ArtifactCard key={a.title} {...a} onClick={() => onArtifactClick(a)} />)
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: 10, border: "1px dashed var(--line-strong)", borderRadius: 6, fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}><Plus size={13} strokeWidth={1.75} /> Pin from chat or upload</div>

        <div className="card" style={{ padding: 12, marginTop: 8 }}>
          <div className="label" style={{ marginBottom: 8 }}>On call · <BKPM /></div>
          {DATA.analysts.map((a) => (
            <div key={a.short} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
              <Avatar name={a.short} color={a.color} size="sm" status={a.status} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 11.5, fontWeight: 500 }}>{a.name}</div>
                <div className="mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>{a.focus}</div>
              </div>
              <Tooltip content={"Message " + a.name.split(" ")[0]}>
                <button className="btn btn-sm btn-ghost ui-icon-btn" aria-label={"Message " + a.name}><ArrowUpRight size={15} strokeWidth={1.75} /></button>
              </Tooltip>
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
  const [focusArtifact, setFocusArtifact] = useState(null);

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
            <button className="btn btn-sm btn-ghost"><Search size={14} strokeWidth={1.75} /> Search <span className="kbd">⌘K</span></button>
            <Tooltip content="Notifications" side="bottom">
              <Link href="/notifications" className="btn btn-sm btn-ghost ui-icon-btn" aria-label="Notifications"><Bell size={15} strokeWidth={1.75} /></Link>
            </Tooltip>
            {canvasMode === "hidden" && (
              <button className="btn btn-sm" onClick={() => setCanvasMode("rail")}>Show canvas <ArrowRight size={14} strokeWidth={1.75} /></button>
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
              <DropdownMenu
                align="end"
                trigger={
                  <button className="btn btn-sm btn-ghost ui-icon-btn" aria-label="Thread options"><MoreHorizontal size={16} strokeWidth={1.75} /></button>
                }
                items={[
                  { label: "Rename thread" },
                  { label: "Share thread", icon: <ArrowUpRight size={14} strokeWidth={1.75} /> },
                  { label: "Add to canvas", icon: <Plus size={14} strokeWidth={1.75} /> },
                  { separator: true },
                  { label: "Archive thread" },
                ]}
              />
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
          onArtifactClick={setFocusArtifact}
        />
      </div>

      <Dialog
        open={!!focusArtifact}
        onOpenChange={(o) => !o && setFocusArtifact(null)}
        title={focusArtifact?.title || ""}
        width={560}
      >
        {focusArtifact && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span className="chip">{focusArtifact.kind}</span>
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>{focusArtifact.meta}</span>
            </div>
            <ArtifactCard {...focusArtifact} onClick={() => {}} />
            {focusArtifact.highlight && (
              <div style={{ marginTop: 14, fontSize: 13, lineHeight: 1.6, color: "var(--ink-2)", fontStyle: "italic", borderLeft: "3px solid var(--terracotta)", paddingLeft: 12 }}>
                &quot;{focusArtifact.highlight}&quot;
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button className="btn btn-sm btn-primary">Open in canvas</button>
              <button className="btn btn-sm"><ArrowUpRight size={14} strokeWidth={1.75} /> Share</button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}
