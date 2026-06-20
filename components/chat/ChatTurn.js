"use client";
// A single chat turn renderer, ported from content/midfi-thread.jsx.
// Works for both the seeded demo turns (rich fields: name/time/cite/pin/kind)
// and live streamed messages (role/content). Used by the workspace thread.

import { Loader2, Pin } from "lucide-react";
import { DATA, Avatar, BKPM, Cite, useI18n } from "@/components/ui";
import { Markdown } from "@/components/chat/Markdown";

// Small inline status dot (presence / accent) — replaces the "●" glyph.
function Dot({ color = "currentColor", size = 6 }) {
  return <span style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", background: color, flexShrink: 0 }} />;
}

// "AI is thinking" placeholder shown while a reply streams in. While a failed
// request is being retried it shows a quieter "reconnecting" hint instead.
function Thinking({ retrying }) {
  const { t } = useI18n();
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--ink-3)" }}>
      <Loader2 size={14} strokeWidth={2} className="spin" /> {t(retrying ? "chat.reconnecting" : "common.thinking")}
    </span>
  );
}

export function ChatTurn({ turn, loading, retrying }) {
  const { t } = useI18n();
  const isUser = turn.who ? turn.who === "user" : turn.role === "user";
  const isSuggest = turn.kind === "suggest";
  const name = turn.name || (isUser ? DATA.user.name : t("chat.assistant"));
  const time = turn.time || "";
  const text = turn.text ?? turn.content;

  if (isSuggest) {
    return (
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderLeft: "3px solid var(--terracotta)", borderRadius: 6, padding: "12px 14px", maxWidth: 640 }}>
        <div className="label" style={{ color: "var(--terracotta)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}><Dot /> <BKPM /> {t("chat.suggestHandoff")}</div>
        <div style={{ fontSize: 13, lineHeight: 1.55 }}>{text}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          <button className="btn btn-sm btn-primary">{t("chat.askRina")}</button>
          <button className="btn btn-sm">{t("chat.scheduleCall")}</button>
          <button className="btn btn-sm btn-ghost">{t("chat.notYet")}</button>
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
      <div style={{ fontSize: 13.5, lineHeight: 1.55, maxWidth: 640, background: isUser ? "var(--surface-3)" : "transparent", padding: isUser ? "10px 14px" : "4px 0", borderRadius: 8, color: "var(--ink)", whiteSpace: isUser ? "pre-wrap" : "normal" }}>
        {isUser ? text : text ? <Markdown>{text}</Markdown> : loading ? <Thinking retrying={retrying} /> : ""}
      </div>
      {turn.cite && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
          {turn.cite.map((c) => <Cite key={c}>{c}</Cite>)}
          {turn.pin && <span className="mono" style={{ fontSize: 10, color: "var(--jade)", display: "inline-flex", alignItems: "center", gap: 4 }}><Pin size={11} strokeWidth={1.75} /> {t("chat.pinnedToCanvas", { pin: turn.pin })}</span>}
        </div>
      )}
    </div>
  );
}
