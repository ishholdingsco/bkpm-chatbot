"use client";
// "Book a call with an analyst" overlay, ported from content/midfi-screens.jsx
// (HandoffModal). Self-contained around the shared Dialog primitive — the
// workspace just renders <HandoffModal open onOpenChange/>. Slot selection is
// live so the confirm button reflects the picked time.

import { useState } from "react";
import { Mail } from "lucide-react";
import { Dialog } from "@/components/ui/controls";
import { DATA, Avatar, useI18n } from "@/components/ui";

const SLOTS = [
  ["Today", "15:00 WIB"],
  ["Today", "16:30 WIB"],
  ["Tomorrow", "09:00 WIB"],
  ["Tomorrow", "10:30 WIB"],
  ["Tomorrow", "14:00 WIB"],
  ["Mon 28", "09:30 WIB"],
];

export function HandoffModal({ open, onOpenChange }) {
  const { t } = useI18n();
  const lead = DATA.analysts[0];
  const [picked, setPicked] = useState(1); // default: Today 16:30

  // Localize the relative day labels; absolute dates ("Mon 28") pass through.
  const dayLabel = (day) =>
    day === "Today" ? t("handoff.today") : day === "Tomorrow" ? t("handoff.tomorrow") : day;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={t("handoff.title", { name: lead.name })} width={600}>
      {/* analyst summary */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: 14, borderRadius: 10, background: "linear-gradient(135deg, var(--terracotta-soft), var(--jade-soft))", marginBottom: 16 }}>
        <Avatar name={lead.short} color={lead.color} size="lg" status="online" />
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }}>{lead.name}</div>
          <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 2 }}>{lead.role} · {lead.focus}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            <span className="chip chip-jade chip-dot">{t("handoff.onlineNow")}</span>
            <span className="chip">{t("handoff.priorInteractions", { n: lead.interactions })}</span>
            <span className="chip">{t("handoff.dealLead")}</span>
          </div>
        </div>
      </div>

      <div className="label" style={{ marginBottom: 6 }}>{t("handoff.threadContext")}</div>
      <div style={{ padding: 10, background: "var(--surface-2)", borderRadius: 6, fontSize: 12, lineHeight: 1.45, border: "1px solid var(--line)" }}>
        <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>{DATA.projects[0].short} · {DATA.threads[0].name}</span>
        <div style={{ marginTop: 4 }}>{t("handoff.contextBody")}</div>
      </div>

      <div className="label" style={{ marginTop: 16, marginBottom: 8 }}>{t("handoff.pickSlot")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
        {SLOTS.map(([day, time], i) => {
          const sel = i === picked;
          return (
            <button
              key={day + time}
              onClick={() => setPicked(i)}
              style={{
                padding: "10px 8px", textAlign: "center", borderRadius: 6, cursor: "pointer",
                border: "1px solid " + (sel ? "var(--terracotta)" : "var(--line)"),
                background: sel ? "var(--terracotta-soft)" : "var(--surface)",
              }}
            >
              <div className="mono" style={{ fontSize: 9, color: sel ? "var(--terracotta)" : "var(--ink-3)" }}>{dayLabel(day).toUpperCase()}</div>
              <div style={{ fontSize: 13, fontWeight: sel ? 600 : 500, marginTop: 2, color: sel ? "var(--terracotta)" : "var(--ink)" }}>{time}</div>
            </button>
          );
        })}
      </div>

      <div className="label" style={{ marginTop: 16, marginBottom: 6 }}>{t("handoff.addNote")}</div>
      <div className="card" style={{ padding: 10, background: "var(--surface-2)", minHeight: 50 }}>
        <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{t("handoff.noteBody")}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18 }}>
        <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)", display: "inline-flex", alignItems: "center", gap: 5 }}>
          <Mail size={12} strokeWidth={1.75} /> {t("handoff.confirmsEmail")}
        </span>
        <div className="grow" />
        <button className="btn" onClick={() => onOpenChange(false)}>{t("common.cancel")}</button>
        <button className="btn btn-primary" onClick={() => onOpenChange(false)}>
          {t("handoff.confirm")} · {dayLabel(SLOTS[picked][0])} {SLOTS[picked][1].replace(" WIB", "")}
        </button>
      </div>
    </Dialog>
  );
}
