"use client";
// Workspace active-thread screen, ported from content/midfi-thread.jsx.
// The composer + message list are wired to DeepSeek via useChat. Projects and
// their threads come from the persisted store (issue #26): a project contains up
// to MAX_THREADS threads, each with its own conversation; the single default
// demo project (seeded chat + canvas) stays as the backdrop so the screen is
// never empty. State persists to localStorage and survives a refresh.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, ChevronDown, Plus, X, ArrowRight, ArrowUpRight,
  Paperclip, AtSign, Slash, Bell, Search, MoreHorizontal, Maximize2, Minimize2, Sparkles, Pencil,
} from "lucide-react";
import { useChat } from "@/components/chat/useChat";
import { useStickToBottom, JumpToLatest } from "@/components/chat/useStickToBottom";
import { ChatTurn } from "@/components/chat/ChatTurn";
import { ChatTextarea, SendButton } from "@/components/chat/ChatComposer";
import { DropdownMenu, Tooltip, Dialog } from "@/components/ui/controls";
import { DATA, Avatar, AvatarStack, ArtifactCard, BKPM, Logo, TopBar, comingSoon, useI18n, LangToggle } from "@/components/ui";
import { useProjects, MAX_THREADS } from "@/components/workspace/useProjects";
import { buildArtifact } from "@/components/workspace/canvasActions";
import { HandoffModal } from "@/components/workspace/HandoffModal";
import { CanvasFocus } from "@/components/workspace/CanvasFocus";

// The single default project + its canned threads, shown until the user creates
// their own. The first demo thread carries the seeded conversation.
const DEMO_PROJECT = DATA.projects[0];
const DEMO_PROJECT_ID = DEMO_PROJECT.id;
const DEMO_THREADS = DATA.threads;
const SEED_THREAD_ID = DEMO_THREADS[0].id;

// Seed the demo thread from the canned turns. Each carries both the API fields
// (role/content) and the richer render fields used by ChatTurn.
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
function Sidebar({ collapsed, onToggle, projects, activeId, onSelectProject, threads, activeThreadId, onSelectThread, onNewThread, canAddThread, onRenameThread }) {
  const { t } = useI18n();
  if (collapsed) {
    return (
      <div className="col" style={{ width: 56, borderRight: "1px solid var(--line)", background: "var(--surface-2)", padding: "12px 6px", gap: 12, alignItems: "center" }}>
        <Logo size={14} showTag={false} />
        <div style={{ height: 1, width: "100%", background: "var(--line)", margin: "4px 0" }} />
        {projects.map((p) => {
          const active = p.id === activeId;
          return (
            <div key={p.id} onClick={() => onSelectProject(p.id)} title={p.name} style={{ width: 36, height: 36, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: active ? "var(--terracotta-soft)" : "var(--surface)", border: "1px solid " + (active ? "var(--terracotta)" : "var(--line)"), fontFamily: "IBM Plex Mono, monospace", fontSize: 10, fontWeight: 600, color: active ? "var(--terracotta)" : "var(--ink-2)", cursor: "pointer" }}>{p.short.slice(0, 2)}</div>
          );
        })}
        <div className="grow" />
        <Tooltip content={t("workspace.expandSidebar")} side="right">
          <button className="btn btn-ghost ui-icon-btn" onClick={onToggle} aria-label={t("workspace.expandSidebar")}>
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
        <Tooltip content={t("workspace.collapseSidebar")}>
          <button className="btn btn-ghost ui-icon-btn" onClick={onToggle} aria-label={t("workspace.collapseSidebar")}>
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
            { label: t("workspace.switchOrg"), onSelect: () => comingSoon(t("workspace.switchOrg")) },
            { label: t("workspace.orgSettings"), onSelect: () => comingSoon(t("workspace.orgSettings")) },
            { separator: true },
            { label: t("workspace.inviteTeammates"), icon: <Plus size={14} strokeWidth={1.75} />, onSelect: () => comingSoon(t("workspace.inviteTeammates")) },
          ]}
        />
      </div>

      <div className="div-h" />

      <div className="scroll col grow" style={{ padding: "12px 10px", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "center", padding: "0 6px 6px" }}>
          <span className="label">{t("workspace.projects")}</span>
          <Tooltip content={t("workspace.newProject")}>
            <Link href="/workspace/new" className="btn btn-ghost btn-sm ui-icon-btn" style={{ marginLeft: "auto" }} aria-label={t("workspace.newProject")}><Plus size={15} strokeWidth={1.75} /></Link>
          </Tooltip>
        </div>

        {projects.map((p) => {
          const active = p.id === activeId;
          return (
            <div key={p.id} style={{ padding: "7px 10px", borderRadius: 6, background: active ? "var(--terracotta-soft)" : "transparent", position: "relative" }}>
              {active && <div style={{ position: "absolute", left: 0, top: 6, bottom: 6, width: 2, borderRadius: 2, background: "var(--terracotta)" }} />}
              <div onClick={() => onSelectProject(p.id)} style={{ cursor: "pointer" }}>
                <div className="mono" style={{ fontSize: 9, color: active ? "var(--terracotta)" : "var(--ink-4)", letterSpacing: "0.06em" }}>{p.short}</div>
                <div style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: "var(--ink)", lineHeight: 1.3, marginTop: 1 }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <span className="mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>{p.stage}</span>
                </div>
              </div>

              {active && (
                <div style={{ marginTop: 8, marginLeft: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                  {threads.map((th) => {
                    const on = th.id === activeThreadId;
                    return (
                      <div key={th.id} onClick={() => onSelectThread(th.id)} className="ws-thread-row" style={{ padding: "4px 8px", borderRadius: 4, background: on ? "var(--surface)" : "transparent", border: on ? "1px solid var(--line)" : "1px solid transparent", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                        {th.unread && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--terracotta)" }} />}
                        <span style={{ fontSize: 11, fontWeight: on ? 600 : 400, color: on ? "var(--ink)" : "var(--ink-2)", lineHeight: 1.3, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{th.name}</span>
                        <Tooltip content={t("workspace.renameThread")}>
                          <button className="btn btn-ghost btn-sm ui-icon-btn ws-thread-rename" aria-label={t("workspace.renameThread")} onClick={(e) => { e.stopPropagation(); onRenameThread(th); }}><Pencil size={12} strokeWidth={1.75} /></button>
                        </Tooltip>
                      </div>
                    );
                  })}
                  {canAddThread && (
                    <div onClick={onNewThread} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 8px", fontSize: 11, cursor: "pointer", color: "var(--ink-3)" }}>
                      <Plus size={12} strokeWidth={1.75} /> {t("workspace.newThread")}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
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
            { label: t("workspace.accountSettings"), onSelect: () => comingSoon(t("workspace.accountSettings")) },
            { label: t("workspace.preferences"), onSelect: () => comingSoon(t("workspace.preferences")) },
            { separator: true },
            { label: t("workspace.signOut"), onSelect: () => comingSoon("Accounts") },
          ]}
        />
      </div>
    </div>
  );
}

// ─── Rename-thread modal ───
// Custom dialog (Dialog primitive) instead of a native prompt, so it matches the
// design language. `target` is the thread being renamed (null = closed).
// Keyed by target id in the parent, so it remounts (and re-seeds the field)
// each time a different thread is renamed — no effect needed.
function RenameThreadDialog({ target, onOpenChange, onSubmit }) {
  const { t } = useI18n();
  const [value, setValue] = useState(target?.name || "");

  const submit = () => {
    const v = value.trim();
    if (v) onSubmit(v);
  };

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange} title={t("workspace.renameThread")} width={420}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
          placeholder={t("workspace.renameThreadPrompt")}
          style={{ width: "100%", fontSize: 14, fontFamily: "Inter, sans-serif", color: "var(--ink)", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 6, padding: "9px 11px", outline: "none" }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn btn-sm" onClick={() => onOpenChange(false)}>{t("common.cancel")}</button>
          <button className="btn btn-sm btn-primary" onClick={submit} disabled={!value.trim()}>{t("common.save")}</button>
        </div>
      </div>
    </Dialog>
  );
}

// ─── Analyst presence ribbon (top of chat) ───
function PresenceRibbon({ onBookCall, onPullIn, show }) {
  const { t } = useI18n();
  if (!show) return null;
  const lead = DATA.analysts[0];
  return (
    <div style={{ background: "linear-gradient(to right, var(--jade-soft), var(--surface-2))", borderBottom: "1px solid var(--line)", padding: "8px 20px", display: "flex", alignItems: "center", gap: 12 }}>
      <Avatar name={lead.short} color={lead.color} size="sm" status="online" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12 }}>
          <span style={{ fontWeight: 600 }}>{lead.name}</span>
          <span style={{ color: "var(--ink-3)" }}> {t("workspace.watchingThread")}</span>
          <span style={{ color: "var(--jade)", display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />{t("workspace.onlineNow")}</span>
          <span style={{ color: "var(--ink-3)" }}>{t("workspace.presenceSuffix", { n: lead.interactions })}</span>
        </div>
      </div>
      <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>{t("workspace.moreOnCall")}</span>
      <AvatarStack items={DATA.analysts} max={3} />
      <button className="btn btn-sm" onClick={onBookCall}>{t("workspace.book30m")}</button>
      <button className="btn btn-sm btn-primary" onClick={onPullIn}>{t("workspace.pullIn")} <ArrowRight size={14} strokeWidth={1.75} /></button>
    </div>
  );
}

function FloatingChip({ onClick, show }) {
  const { t } = useI18n();
  if (!show) return null;
  return (
    <div style={{ position: "absolute", top: 70, right: 24, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 999, padding: "5px 10px 5px 6px", boxShadow: "var(--shadow-2)", display: "flex", alignItems: "center", gap: 8, zIndex: 4, cursor: "pointer" }} onClick={onClick}>
      <Avatar name="RP" color="#b94a1f" size="sm" status="online" />
      <span style={{ fontSize: 11, fontWeight: 500 }}>{t("workspace.isHere", { name: DATA.analysts[0].name.split(" ")[0] })}</span>
      <ArrowUpRight size={13} strokeWidth={1.75} style={{ color: "var(--ink-3)" }} />
    </div>
  );
}

// ─── Composer (live) ───
function Composer({ input, setInput, onSend, loading, onReferHuman }) {
  const { t } = useI18n();
  return (
    <div style={{ borderTop: "1px solid var(--line)", padding: "12px 20px 14px", background: "var(--surface-2)" }}>
      <div className="card" style={{ padding: "10px 12px" }}>
        <ChatTextarea
          value={input}
          onChange={setInput}
          onSend={onSend}
          submitOn="mod-enter"
          rows={2}
          maxHeight={160}
          placeholder={t("chat.placeholder")}
          style={{ width: "100%", border: "none", outline: "none", resize: "none", fontSize: 13, lineHeight: 1.5, fontFamily: "Inter, sans-serif", background: "transparent", color: "var(--ink)", minHeight: 38 }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <button className="btn btn-sm btn-ghost" onClick={() => comingSoon(t("chat.attach"))}><Paperclip size={14} strokeWidth={1.75} /> {t("chat.attach")}</button>
          <button className="btn btn-sm btn-ghost" onClick={() => comingSoon(t("chat.mention"))}><AtSign size={14} strokeWidth={1.75} /> {t("chat.mention")}</button>
          <button className="btn btn-sm btn-ghost" onClick={() => comingSoon(t("chat.slash"))}><Slash size={14} strokeWidth={1.75} /> {t("chat.slash")}</button>
          <button className="btn btn-sm" onClick={onReferHuman} style={{ color: "var(--terracotta)", borderColor: "var(--terracotta-tint)" }}><ArrowUpRight size={14} strokeWidth={1.75} /> {t("chat.referHuman")}</button>
          <div className="grow" />
          <span className="mono" style={{ fontSize: 9, color: "var(--ink-4)" }}>
            <span className="kbd">⌘</span> <span className="kbd">↵</span> {t("chat.send")}
          </span>
          <SendButton className="btn btn-sm btn-jade" loading={loading} input={input} onSend={onSend} />
        </div>
      </div>
    </div>
  );
}

// ─── Canvas rail (artifacts) ───
// `artifacts` is the active project's own canvas (AI-generated cards, plus the
// canned ones for the demo project). Empty for a fresh user project until the
// assistant pins something via add_artifact.
function CanvasRail({ mode, onToggle, onPopout, onArtifactClick, artifacts }) {
  const { t } = useI18n();
  if (mode === "hidden") return null;
  const isPopout = mode === "popout";
  const width = isPopout ? 600 : 300;

  return (
    <div className="col" style={{ width, borderLeft: "1px solid var(--line)", background: "var(--surface-2)", transition: "width 0.2s" }}>
      <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--line)" }}>
        <span className="label">{t("workspace.sharedCanvas")}</span>
        <span className="chip" style={{ marginLeft: 4 }}>{t("workspace.artifacts", { n: artifacts.length })}</span>
        <div className="grow" />
        <Tooltip content={isPopout ? t("workspace.shrink") : t("workspace.popOut")}>
          <button className="btn btn-ghost btn-sm ui-icon-btn" onClick={onPopout} aria-label={isPopout ? t("workspace.shrinkCanvas") : t("workspace.popOutCanvas")}>
            {isPopout ? <Minimize2 size={15} strokeWidth={1.75} /> : <Maximize2 size={15} strokeWidth={1.75} />}
          </button>
        </Tooltip>
        <Tooltip content={t("common.collapse")}>
          <button className="btn btn-ghost btn-sm ui-icon-btn" onClick={onToggle} aria-label={t("workspace.collapseCanvas")}>
            <X size={15} strokeWidth={1.75} />
          </button>
        </Tooltip>
      </div>

      <div className="scroll col grow" style={{ padding: 12, gap: 10 }}>
        <div style={{ fontSize: 11, color: "var(--ink-3)", lineHeight: 1.4 }}>{t("workspace.canvasHint")}</div>

        {artifacts.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "28px 16px", border: "1px dashed var(--line-strong)", borderRadius: 8, textAlign: "center" }}>
            <Sparkles size={18} strokeWidth={1.75} style={{ color: "var(--terracotta)" }} />
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.5 }}>{t("workspace.canvasEmpty")}</div>
          </div>
        ) : isPopout ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {artifacts.map((a, i) => <ArtifactCard key={a.title + "-" + i} {...a} onClick={() => onArtifactClick(a)} />)}
          </div>
        ) : (
          artifacts.map((a, i) => <ArtifactCard key={a.title + "-" + i} {...a} onClick={() => onArtifactClick(a)} />)
        )}

        <div onClick={() => comingSoon(t("workspace.pinFromChat"))} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: 10, border: "1px dashed var(--line-strong)", borderRadius: 6, fontSize: 11, color: "var(--ink-3)", marginTop: 4, cursor: "pointer" }}><Plus size={13} strokeWidth={1.75} /> {t("workspace.pinFromChat")}</div>

        <div className="card" style={{ padding: 12, marginTop: 8 }}>
          <div className="label" style={{ marginBottom: 8 }}>{t("workspace.onCall")} <BKPM /></div>
          {DATA.analysts.map((a) => (
            <div key={a.short} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
              <Avatar name={a.short} color={a.color} size="sm" status={a.status} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 11.5, fontWeight: 500 }}>{a.name}</div>
                <div className="mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>{a.focus}</div>
              </div>
              <Tooltip content={t("workspace.message", { name: a.name.split(" ")[0] })}>
                <button className="btn btn-sm btn-ghost ui-icon-btn" aria-label={t("workspace.message", { name: a.name })} onClick={() => comingSoon(t("workspace.message", { name: a.name.split(" ")[0] }))}><ArrowUpRight size={15} strokeWidth={1.75} /></button>
              </Tooltip>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Thread column (header + live messages + composer) ───
// Keyed by project+thread id in the parent so switching thread remounts this
// and re-seeds useChat from that thread's stored messages. On mount it drains
// any pending starter prompt; on each completed reply it persists the thread.
function ThreadColumn({ project, threadId, threadName, isDemo, initialMessages, onReferHuman, onPresenceClick, onArtifactAdded, onRename }) {
  const { t, lang } = useI18n();
  const [showPresence, setShowPresence] = useState(isDemo);
  const addArtifact = useProjects((s) => s.addArtifact);
  const setThreadMessages = useProjects((s) => s.setThreadMessages);

  const context = isDemo
    ? `User is in the Wilaya workspace, project "${project.name}" (${project.short}), thread "${threadName}". They are a foreign institutional investor (Khazanah Nasional) doing diligence on nickel midstream co-investment with state-owned MIND ID.`
    : `User is in the Wilaya workspace, in project "${project.name}" (${project.short})${project.sector ? `, sector ${project.sector}` : ""}, thread "${threadName}". Help them scope this investment in Indonesia.`;

  // Apply the assistant's canvas tool calls: pin each new artifact onto this
  // project's canvas and make sure the rail is visible to show it.
  const onAction = useCallback(
    (actions) => {
      let added = false;
      for (const a of actions) {
        if (a?.name === "add_artifact") {
          addArtifact(project.id, buildArtifact(a.args));
          added = true;
        }
      }
      if (added) onArtifactAdded?.();
    },
    [addArtifact, project.id, onArtifactAdded]
  );

  const { messages, input, setInput, send, loading, retrying } = useChat({
    initialMessages,
    context,
    lang,
    canvasTools: true,
    onAction,
  });
  const { containerRef, onScroll, scrollToBottom, isFollowing } = useStickToBottom(messages);
  const composerRef = useRef(null);
  const handleSend = (text) => { scrollToBottom(); send(text); };

  // Drain a pending starter prompt once, after mount.
  const sentPending = useRef(false);
  useEffect(() => {
    if (sentPending.current) return;
    sentPending.current = true;
    const msg = useProjects.getState().consumePending(threadId);
    if (msg) handleSend(msg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist the conversation whenever a reply settles (loading → false), so
  // switching threads or refreshing keeps it.
  useEffect(() => {
    if (!loading) setThreadMessages(threadId, messages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  return (
    <div className="col grow" style={{ minWidth: 0, position: "relative", background: "var(--surface)" }}>
      <PresenceRibbon show={showPresence} onBookCall={onPresenceClick} onPullIn={onPresenceClick} />
      <FloatingChip show={showPresence} onClick={onPresenceClick} />

      <div style={{ padding: "20px 28px 12px", borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h1 className="serif" style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>{threadName}</h1>
          <div className="grow" />
          <DropdownMenu
            align="end"
            trigger={
              <button className="btn btn-sm btn-ghost ui-icon-btn" aria-label={t("workspace.threadOptions")}><MoreHorizontal size={16} strokeWidth={1.75} /></button>
            }
            items={[
              { label: t("workspace.renameThread"), icon: <Pencil size={14} strokeWidth={1.75} />, onSelect: onRename },
              { label: t("workspace.shareThread"), icon: <ArrowUpRight size={14} strokeWidth={1.75} />, onSelect: () => comingSoon(t("workspace.shareThread")) },
              { separator: true },
              { label: t("workspace.archiveThread"), onSelect: () => comingSoon(t("workspace.archiveThread")) },
            ]}
          />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
          {isDemo ? (
            <>
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>{t("workspace.threadMeta")}</span>
              <span className="chip">{t("workspace.tagRegulatory")}</span>
              <span className="chip">{t("workspace.tagStructuring")}</span>
            </>
          ) : (
            <>
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>{t("workspace.freshThreadMeta")}</span>
              {project.sector && <span className="chip">{project.sector}</span>}
            </>
          )}
        </div>
      </div>

      <div ref={containerRef} onScroll={onScroll} className="scroll col grow" style={{ padding: "20px 28px", gap: 18 }}>
        {messages.length === 0 && (
          <>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)" }}>{t("workspace.chatIntro")}</div>
            <div style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 8, padding: 12 }}>
              <div className="label" style={{ marginBottom: 6 }}>{t("workspace.tryAsking")}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {t("workspace.chatSuggestions").map((s) => (
                  <div
                    key={s}
                    onClick={() => !loading && handleSend(s)}
                    style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12.5, padding: "7px 9px", background: "var(--surface)", borderRadius: 6, border: "1px solid var(--line)", cursor: loading ? "default" : "pointer" }}
                  >
                    <ArrowUpRight size={14} strokeWidth={1.75} style={{ flexShrink: 0, marginTop: 2, color: "var(--ink-3)" }} /> {s}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        {messages.map((m, i) => (
          <ChatTurn key={i} turn={m} loading={loading && i === messages.length - 1} retrying={retrying && i === messages.length - 1} />
        ))}
      </div>

      <JumpToLatest show={!isFollowing} onClick={() => scrollToBottom("smooth")} label={t("chat.toLatest")} anchorRef={composerRef} />

      <div ref={composerRef}>
        <Composer input={input} setInput={setInput} onSend={handleSend} loading={loading} onReferHuman={onReferHuman} />
      </div>
    </div>
  );
}

// ─── MAIN — Active thread screen ───
export function ActiveThread() {
  const { t } = useI18n();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [canvasMode, setCanvasMode] = useState("rail");
  const [focusArtifact, setFocusArtifact] = useState(null);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);

  // Read the persisted store only after mount, so the server render and the
  // first client render both show the demo backdrop (no hydration mismatch).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const userProjects = useProjects((s) => s.projects);
  const storeActiveProjectId = useProjects((s) => s.activeProjectId);
  const threadsByProject = useProjects((s) => s.threadsByProject);
  const activeThreadByProject = useProjects((s) => s.activeThreadByProject);
  const threadNames = useProjects((s) => s.threadNames);
  const messagesByThread = useProjects((s) => s.messagesByThread);
  const artifactsByProject = useProjects((s) => s.artifactsByProject);
  const setActiveProject = useProjects((s) => s.setActiveProject);
  const setActiveThread = useProjects((s) => s.setActiveThread);
  const createThread = useProjects((s) => s.createThread);
  const renameThread = useProjects((s) => s.renameThread);

  // Projects: user-created (when mounted) + the default demo backdrop.
  const projects = mounted ? [...userProjects, DEMO_PROJECT] : [DEMO_PROJECT];
  const activeId = (mounted && projects.some((p) => p.id === storeActiveProjectId)) ? storeActiveProjectId : DEMO_PROJECT_ID;
  const active = projects.find((p) => p.id === activeId) || DEMO_PROJECT;
  const isDemo = active.id === DEMO_PROJECT_ID;

  // Threads of the active project, with any rename override applied, and which
  // one is open.
  const rawThreads = isDemo ? DEMO_THREADS : (mounted ? threadsByProject[activeId] || [] : []);
  const threads = rawThreads.map((th) => ({ ...th, name: (mounted && threadNames[th.id]) || th.name }));
  const storedThreadId = mounted ? activeThreadByProject[activeId] : undefined;
  const activeThreadId = threads.some((th) => th.id === storedThreadId) ? storedThreadId : threads[0]?.id;
  const activeThread = threads.find((th) => th.id === activeThreadId) || threads[0];
  const threadName = activeThread?.name || t("workspace.newThread");
  const canAddThread = !isDemo && threads.length < MAX_THREADS;

  // The open thread's conversation: stored messages, or the seed for the demo
  // thread, or empty.
  const savedMessages = mounted ? messagesByThread[activeThreadId] : undefined;
  const initialMessages = savedMessages ?? (activeThreadId === SEED_THREAD_ID ? SEED_MESSAGES : []);

  // The active project's canvas: AI-generated artifacts, with the demo project
  // also showing its canned cards underneath.
  const aiArtifacts = (mounted && artifactsByProject[activeId]) || [];
  const artifacts = isDemo ? [...aiArtifacts, ...DATA.artifacts] : aiArtifacts;

  const handleNewThread = () => createThread(activeId, threads.length);

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
              <span style={{ fontWeight: 500 }}>{active.name}</span>
              <span style={{ color: "var(--ink-4)" }}>/</span>
              <span style={{ fontWeight: 600, color: "var(--terracotta)" }}>{threadName}</span>
            </div>
            <span className="chip chip-jade chip-dot" style={{ marginLeft: 4 }}>{active.stage}</span>
          </>
        }
        right={
          <>
            <button className="btn btn-sm btn-ghost" onClick={() => comingSoon(t("workspace.search"))}><Search size={14} strokeWidth={1.75} /> {t("workspace.search")} <span className="kbd">⌘K</span></button>
            <Tooltip content={t("common.notifications")} side="bottom">
              <Link href="/notifications" className="btn btn-sm btn-ghost ui-icon-btn" aria-label={t("common.notifications")}><Bell size={15} strokeWidth={1.75} /></Link>
            </Tooltip>
            <LangToggle />
            {canvasMode === "hidden" && (
              <button className="btn btn-sm" onClick={() => setCanvasMode("rail")}>{t("workspace.showCanvas")} <ArrowRight size={14} strokeWidth={1.75} /></button>
            )}
          </>
        }
      />

      <div className="row grow" style={{ minHeight: 0 }}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          projects={projects}
          activeId={activeId}
          onSelectProject={setActiveProject}
          threads={threads}
          activeThreadId={activeThreadId}
          onSelectThread={(tid) => setActiveThread(activeId, tid)}
          onNewThread={handleNewThread}
          canAddThread={canAddThread}
          onRenameThread={setRenameTarget}
        />

        <ThreadColumn
          key={activeId + ":" + activeThreadId}
          project={active}
          threadId={activeThreadId}
          threadName={threadName}
          isDemo={isDemo}
          initialMessages={initialMessages}
          onReferHuman={() => setHandoffOpen(true)}
          onPresenceClick={() => setHandoffOpen(true)}
          onArtifactAdded={() => setCanvasMode((m) => (m === "hidden" ? "rail" : m))}
          onRename={() => activeThread && setRenameTarget(activeThread)}
        />

        <CanvasRail
          mode={canvasMode}
          onToggle={() => setCanvasMode("hidden")}
          onPopout={() => setCanvasMode(canvasMode === "popout" ? "rail" : "popout")}
          onArtifactClick={setFocusArtifact}
          artifacts={artifacts}
        />
      </div>

      <CanvasFocus artifact={focusArtifact} onOpenChange={(o) => !o && setFocusArtifact(null)} />
      <HandoffModal open={handoffOpen} onOpenChange={setHandoffOpen} />
      <RenameThreadDialog
        key={renameTarget?.id || "closed"}
        target={renameTarget}
        onOpenChange={(o) => !o && setRenameTarget(null)}
        onSubmit={(name) => { renameThread(renameTarget.id, name); setRenameTarget(null); }}
      />
    </div>
  );
}
