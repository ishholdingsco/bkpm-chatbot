"use client";
// "Book a call with an analyst" overlay, ported from content/midfi-screens.jsx
// (HandoffModal). Self-contained around the shared Dialog primitive — the
// workspace just renders <HandoffModal open onOpenChange/>. Slot selection is
// live so the confirm button reflects the picked time.

import { useState } from "react";
import { Mail } from "lucide-react";
import { Dialog } from "@/components/ui/controls";
import { DATA, Avatar } from "@/components/ui";

const SLOTS = [
  ["Today", "15:00 WIB"],
  ["Today", "16:30 WIB"],
  ["Tomorrow", "09:00 WIB"],
  ["Tomorrow", "10:30 WIB"],
  ["Tomorrow", "14:00 WIB"],
  ["Mon 28", "09:30 WIB"],
];

export function HandoffModal({ open, onOpenChange }) {
  const lead = DATA.analysts[0];
  const [picked, setPicked] = useState(1); // default: Today 16:30

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={`Book a call · ${lead.name}`} width={600}>
      {/* analyst summary */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: 14, borderRadius: 10, background: "linear-gradient(135deg, var(--terracotta-soft), var(--jade-soft))", marginBottom: 16 }}>
        <Avatar name={lead.short} color={lead.color} size="lg" status="online" />
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }}>{lead.name}</div>
          <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 2 }}>{lead.role} · {lead.focus}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            <span className="chip chip-jade chip-dot">Online now</span>
            <span className="chip">{lead.interactions} prior interactions</span>
            <span className="chip">Konawe deal lead</span>
          </div>
        </div>
      </div>

      <div className="label" style={{ marginBottom: 6 }}>Thread context (auto-attached)</div>
      <div style={{ padding: 10, background: "var(--surface-2)", borderRadius: 6, fontSize: 12, lineHeight: 1.45, border: "1px solid var(--line)" }}>
        <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>{DATA.projects[0].short} · {DATA.threads[0].name}</span>
        <div style={{ marginTop: 4 }}>4 turns · 2 artifacts (Perpres §C(7), SPV diagram). Aisha is exploring a minority convertible into a MIND ID JV.</div>
      </div>

      <div className="label" style={{ marginTop: 16, marginBottom: 8 }}>Pick a slot · 30 minutes · Jakarta time</div>
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
              <div className="mono" style={{ fontSize: 9, color: sel ? "var(--terracotta)" : "var(--ink-3)" }}>{day.toUpperCase()}</div>
              <div style={{ fontSize: 13, fontWeight: sel ? 600 : 500, marginTop: 2, color: sel ? "var(--terracotta)" : "var(--ink)" }}>{time}</div>
            </button>
          );
        })}
      </div>

      <div className="label" style={{ marginTop: 16, marginBottom: 6 }}>Add a note (optional)</div>
      <div className="card" style={{ padding: 10, background: "var(--surface-2)", minHeight: 50 }}>
        <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>Want to walk through the convertible mechanics + timing for the IC pre-read.</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18 }}>
        <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)", display: "inline-flex", alignItems: "center", gap: 5 }}>
          <Mail size={12} strokeWidth={1.75} /> Confirms via email + adds to your calendar
        </span>
        <div className="grow" />
        <button className="btn" onClick={() => onOpenChange(false)}>Cancel</button>
        <button className="btn btn-primary" onClick={() => onOpenChange(false)}>
          Confirm · {SLOTS[picked][0]} {SLOTS[picked][1].replace(" WIB", "")}
        </button>
      </div>
    </Dialog>
  );
}
