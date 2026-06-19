"use client";
// New-project empty state, ported from content/midfi-screens.jsx (EmptyState).
// Shown when a project/thread has no messages yet. Starter prompts and the
// primary CTA drop the user into the live workspace thread.

import Link from "next/link";
import { DATA, AvatarStack, BKPM, TopBar, ComingSoonButton, useI18n } from "@/components/ui";

// Icons pair with the translated starter prompts (emptyState.starters) by index.
const STARTER_ICONS = ["§", "◇", "⌘", "☉", "⛰", "↗"];

export function EmptyState() {
  const { t } = useI18n();
  const starters = t("emptyState.starters");
  const sectors = t("emptyState.sectors");
  return (
    <div className="frame col" style={{ background: "var(--surface)" }}>
      <TopBar right={<span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{t("emptyState.tag")}</span>} />

      <div className="grow" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, position: "relative", overflow: "auto" }}>
        <div style={{ maxWidth: 720, width: "100%" }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>{t("emptyState.newProject")}</div>
          <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, margin: "6px 0 8px", letterSpacing: "-0.015em" }}>
            {t("emptyState.headlinePre")} <span style={{ color: "var(--terracotta)" }}>{t("emptyState.headlineHl")}</span>?
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink-2)", margin: "0 0 20px", lineHeight: 1.55 }}>
            {t("emptyState.body").split("{bkpm}")[0]}<BKPM />{t("emptyState.body").split("{bkpm}")[1]}
          </p>

          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <div className="label" style={{ marginBottom: 8 }}>{t("emptyState.projectName")}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", borderBottom: "1px solid var(--line)", paddingBottom: 8 }}>
              <span style={{ fontSize: 16, color: "var(--ink-4)" }}>{t("emptyState.eg")}</span>
              <span style={{ fontSize: 16 }}>{t("emptyState.egProject")}</span>
              <span style={{ width: 1, height: 16, background: "var(--terracotta)", animation: "blink 1s infinite" }} />
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
              <span className="label" style={{ alignSelf: "center", marginRight: 4 }}>{t("emptyState.sector")}</span>
              {sectors.map((s) => (
                <span key={s} className="chip" style={{ cursor: "pointer" }}>{s}</span>
              ))}
            </div>
          </div>

          <div className="label" style={{ marginBottom: 10 }}>{t("emptyState.orQuestion")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {starters.map((s, i) => (
              <Link key={s.label} href="/workspace" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="card" style={{ padding: 12, cursor: "pointer", display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 24, height: 24, borderRadius: 4, background: "var(--surface-3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--terracotta)", fontWeight: 600 }}>{STARTER_ICONS[i]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, lineHeight: 1.4 }}>{s.label}</div>
                    <div className="mono" style={{ fontSize: 9, color: "var(--ink-3)", marginTop: 4, letterSpacing: "0.06em" }}>{s.tag.toUpperCase()}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 18, alignItems: "center" }}>
            <Link href="/workspace" style={{ textDecoration: "none" }}>
              <button className="btn btn-primary">{t("emptyState.createProject")}</button>
            </Link>
            <ComingSoonButton label={t("emptyState.importMemo")} className="btn">{t("emptyState.importMemo")}</ComingSoonButton>
            <div className="grow" />
            <span style={{ fontSize: 11 }}>{t("emptyState.analystsAvailable").split("{bkpm}")[0]}<BKPM />{t("emptyState.analystsAvailable").split("{bkpm}")[1]}</span>
            <AvatarStack items={DATA.analysts} max={3} />
          </div>
        </div>
      </div>
    </div>
  );
}
