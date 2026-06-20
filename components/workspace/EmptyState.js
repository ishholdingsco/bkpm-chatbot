"use client";
// New-project empty state, ported from content/midfi-screens.jsx (EmptyState).
// Shown when a project/thread has no messages yet. The name is a real input and
// the sector chips are selectable; the primary CTA and the starter prompts both
// create a project in the store (issue #26) and drop the user into the live
// workspace thread — starters also seed the thread's first message.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DATA, AvatarStack, BKPM, TopBar, ComingSoonButton, useI18n } from "@/components/ui";
import { useProjects } from "@/components/workspace/useProjects";

// Icons pair with the translated starter prompts (emptyState.starters) by index.
const STARTER_ICONS = ["§", "◇", "⌘", "☉", "⛰", "↗"];

export function EmptyState() {
  const { t } = useI18n();
  const router = useRouter();
  const createProject = useProjects((s) => s.createProject);
  const [name, setName] = useState("");
  const [sector, setSector] = useState(null);
  const starters = t("emptyState.starters");
  const sectors = t("emptyState.sectors");

  // Create a project from the current form and open the workspace. `firstMessage`
  // (from a starter) is auto-sent as the thread's opening turn.
  const start = (firstMessage) => {
    createProject({ name, sector, firstMessage });
    router.push("/workspace");
  };

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
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("emptyState.egProject")}
              onKeyDown={(e) => { if (e.key === "Enter") start(); }}
              autoFocus
              style={{ width: "100%", fontSize: 16, fontFamily: "Inter, sans-serif", color: "var(--ink)", background: "transparent", border: "none", outline: "none", borderBottom: "1px solid var(--line)", paddingBottom: 8 }}
            />
            <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
              <span className="label" style={{ alignSelf: "center", marginRight: 4 }}>{t("emptyState.sector")}</span>
              {sectors.map((s) => {
                const selected = sector === s;
                return (
                  <button
                    key={s}
                    type="button"
                    className="chip"
                    aria-pressed={selected}
                    onClick={() => setSector(selected ? null : s)}
                    style={{
                      cursor: "pointer",
                      border: "1px solid " + (selected ? "var(--terracotta)" : "var(--line)"),
                      background: selected ? "var(--terracotta-soft)" : "transparent",
                      color: selected ? "var(--terracotta)" : "var(--ink-2)",
                      fontWeight: selected ? 600 : 400,
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="label" style={{ marginBottom: 10 }}>{t("emptyState.orQuestion")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {starters.map((s, i) => (
              <div key={s.label} onClick={() => start(s.label)} className="card" style={{ padding: 12, cursor: "pointer", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 24, height: 24, borderRadius: 4, background: "var(--surface-3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--terracotta)", fontWeight: 600 }}>{STARTER_ICONS[i]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.4 }}>{s.label}</div>
                  <div className="mono" style={{ fontSize: 9, color: "var(--ink-3)", marginTop: 4, letterSpacing: "0.06em" }}>{s.tag.toUpperCase()}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 18, alignItems: "center" }}>
            <button className="btn btn-primary" onClick={() => start()}>{t("emptyState.createProject")}</button>
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
