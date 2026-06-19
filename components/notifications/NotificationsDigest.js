// Notifications / digest inbox, ported from content/midfi-screens.jsx
// (NotificationsDigest). Pure render — the feed and weekly digest are static
// demo content. The "Open thread" / "Review" CTAs link into the workspace.

"use client";
import Link from "next/link";
import { Check } from "lucide-react";
import { Avatar, TopBar, useI18n } from "@/components/ui";

const ITEMS = [
  { kind: "analyst", who: "Rina P.", avatar: "RP", color: "#b94a1f", text: "replied in DNI / smelter co-invest", detail: "“Konawe used a 12% SME quota — happy to walk through it.”", time: "4m", project: "SULAWESI.NI", urgent: true },
  { kind: "ai", who: "BKPM AI", avatar: "AI", color: "#1c1a14", text: "flagged a regulation update", detail: "Perpres 49/2021 amendment on critical minerals · effective 1 May 2026", time: "1h", project: "SULAWESI.NI", urgent: false },
  { kind: "analyst", who: "Adi W.", avatar: "AW", color: "#2f6a4f", text: "shared a comp set in PLN offtake", detail: "4 IPP deals from 2024–2025, attached", time: "3h", project: "SULAWESI.NI", urgent: false },
  { kind: "opp", who: "BKPM AI", avatar: "AI", color: "#1c1a14", text: "matched a new opportunity", detail: "Bauxite refining, Bintan — fits your SE Asia critical minerals thesis", time: "5h", project: "New", urgent: false },
  { kind: "system", who: "", avatar: "✓", color: "#7a7466", text: "Tax holiday memo exported to Khazanah workspace", detail: "12-page PDF · auto-generated from thread", time: "yesterday", project: "SULAWESI.NI", urgent: false },
];

const FILTERS = [
  ["all", true], ["analysts", false], ["ai", false],
  ["opportunities", false], ["system", false],
];

export function NotificationsDigest() {
  const { t } = useI18n();
  return (
    <div className="frame col" style={{ background: "var(--surface)" }}>
      <TopBar right={<span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{t("notifications.user")}</span>} showOrg={false} />

      <div className="row grow" style={{ minHeight: 0 }}>
        <div style={{ width: 60, background: "var(--surface-2)", borderRight: "1px solid var(--line)" }} />

        <div className="col grow scroll" style={{ padding: "32px 48px", background: "var(--surface)" }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>{t("notifications.inbox")}</div>
          <h1 className="serif" style={{ fontSize: 28, fontWeight: 500, margin: "4px 0 4px", letterSpacing: "-0.01em" }}>{t("notifications.greeting")}</h1>
          <p style={{ fontSize: 14, color: "var(--ink-2)", margin: "0 0 24px" }}>{t("notifications.subhead")}</p>

          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {FILTERS.map(([key, active]) => (
              <span key={key} className={"chip " + (active ? "chip-terra chip-dot" : "")} style={{ fontWeight: active ? 600 : 400, cursor: "pointer" }}>{t("notifications.filters." + key)}</span>
            ))}
          </div>

          <div className="col" style={{ gap: 1, background: "var(--line)", border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
            {ITEMS.map((n, i) => (
              <div key={i} style={{ background: n.urgent ? "var(--terracotta-soft)" : "var(--surface)", padding: "14px 18px", display: "flex", gap: 14, alignItems: "flex-start", cursor: "pointer" }}>
                {n.urgent && <div style={{ width: 4, height: 40, background: "var(--terracotta)", borderRadius: 2, marginTop: 4 }} />}
                {n.avatar === "✓"
                  ? <div className="avatar avatar-sm" style={{ background: n.color, display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={13} strokeWidth={2.5} color="#fff" /></div>
                  : <Avatar name={n.avatar} color={n.color} size="sm" />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>{n.who}</span>
                    <span style={{ color: "var(--ink-2)" }}> {n.text}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 4, lineHeight: 1.45, fontStyle: n.kind === "analyst" ? "italic" : "normal" }}>{n.detail}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
                    <span className="mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>{n.project}</span>
                    <span style={{ color: "var(--ink-4)" }}>·</span>
                    <span className="mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>{n.time} ago</span>
                  </div>
                </div>
                {n.urgent && (
                  <Link href="/workspace" style={{ textDecoration: "none" }}>
                    <button className="btn btn-sm btn-primary">{t("notifications.openThread")}</button>
                  </Link>
                )}
                {!n.urgent && n.kind === "opp" && (
                  <Link href="/workspace" style={{ textDecoration: "none" }}>
                    <button className="btn btn-sm">{t("notifications.review")}</button>
                  </Link>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, padding: 16, background: "var(--surface-2)", borderRadius: 8, border: "1px solid var(--line)" }}>
            <div className="label" style={{ marginBottom: 6 }}>{t("notifications.weeklyDigest")}</div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)" }}>
              4 active threads · 12 artifacts pinned · 2 analyst calls scheduled · 1 IC pre-read drafted. Estimated $2.7B in tracked opportunities across 4 projects.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
