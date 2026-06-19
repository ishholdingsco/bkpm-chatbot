"use client";
// A single chat turn renderer, ported from content/midfi-thread.jsx.
// Works for both the seeded demo turns (rich fields: name/time/cite/pin/kind)
// and live streamed messages (role/content). Used by the workspace thread.

import { Loader2, Pin } from "lucide-react";
import { DATA, Avatar, BKPM, Cite } from "@/components/ui";

// Small inline status dot (presence / accent) — replaces the "●" glyph.
function Dot({ color = "currentColor", size = 6 }) {
  return <span style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", background: color, flexShrink: 0 }} />;
}

// "AI is thinking" placeholder shown while a reply streams in.
function Thinking() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--ink-3)" }}>
      <Loader2 size={14} strokeWidth={2} className="spin" /> thinking…
    </span>
  );
}

export function ChatTurn({ turn, loading }) {
  const isUser = turn.who ? turn.who === "user" : turn.role === "user";
  const isSuggest = turn.kind === "suggest";
  const name = turn.name || (isUser ? DATA.user.name : "BKPM Assistant");
  const time = turn.time || "";
  const text = turn.text ?? turn.content;

  if (isSuggest) {
    return (
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderLeft: "3px solid var(--terracotta)", borderRadius: 6, padding: "12px 14px", maxWidth: 640 }}>
        <div className="label" style={{ color: "var(--terracotta)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}><Dot /> <BKPM /> AI · suggested handoff</div>
        <div style={{ fontSize: 13, lineHeight: 1.55 }}>{text}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          <button className="btn btn-sm btn-primary">Yes, ask Rina</button>
          <button className="btn btn-sm">Schedule a call</button>
          <button className="btn btn-sm btn-ghost">Not yet</button>
        </div>
      </div>
    );
  }

  return (
    <div className="col" style={{ alignItems: isUser ? "flex-end" : "flex-start", gap: 4, maxWidth: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
        {!isUser && <Avatar name="AI" color="#1c1a14" size="sm" />}
        <span style={{ fontWeight: 600 }}>{name}</span>
        {time && <span className="mono" style={{ fontSize: 9, color: "var(--ink-4)" }}>{time}</span>}
        {isUser && <Avatar name={DATA.user.short} color={DATA.user.color} size="sm" />}
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.55, maxWidth: 640, background: isUser ? "var(--surface-3)" : "transparent", padding: isUser ? "10px 14px" : "4px 0", borderRadius: 8, color: "var(--ink)", whiteSpace: "pre-wrap" }}>
        {text || (loading ? <Thinking /> : "")}
      </div>
      {turn.cite && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
          {turn.cite.map((c) => <Cite key={c}>{c}</Cite>)}
          {turn.pin && <span className="mono" style={{ fontSize: 10, color: "var(--jade)", display: "inline-flex", alignItems: "center", gap: 4 }}><Pin size={11} strokeWidth={1.75} /> pinned to canvas: {turn.pin}</span>}
        </div>
      )}
    </div>
  );
}
