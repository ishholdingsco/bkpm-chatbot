"use client";
// Project comparison screen, ported from content/map-screens.jsx (CompareView).
// The demo shortlist values live inline (proper-noun demo data); chrome and row
// labels come from the i18n bundles.

import { Fragment } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Plus, Star } from "lucide-react";
import { DATA, BKPM, TopBar, ComingSoonButton, useI18n } from "@/components/ui";

const PROJECTS = [
  {
    name: "Nickel Midstream — Sulawesi", short: "SULAWESI.NI", sector: "Critical minerals",
    ticket: "$400M", irr: "18.2%", payback: "6.4 yr", risk: "Med", stage: "Diligence", star: true,
    facts: { ownership: "100% foreign OK", incentives: "Tax holiday 15y", counterparty: "MIND ID", timeline: "24 mo to FID" },
  },
  {
    name: "Geothermal — N. Sumatra", short: "NSUMATRA.GEO", sector: "Renewable energy",
    ticket: "$180M", irr: "12.5%", payback: "8.1 yr", risk: "Low", stage: "Scoping", star: false,
    facts: { ownership: "95% foreign OK", incentives: "Tax holiday 10y", counterparty: "PLN", timeline: "36 mo to FID" },
  },
  {
    name: "Data Centers — Batam", short: "BATAM.DC", sector: "Digital infra",
    ticket: "$220M", irr: "15.8%", payback: "5.2 yr", risk: "Low", stage: "Diligence", star: false,
    facts: { ownership: "100% foreign OK", incentives: "KEK + FTZ", counterparty: "BP Batam", timeline: "12 mo to FID" },
  },
];

const ROWS = [
  ["sector", (p) => p.sector],
  ["ticket", (p) => p.ticket],
  ["irr", (p) => p.irr],
  ["payback", (p) => p.payback],
  ["risk", (p) => p.risk],
  ["stage", (p) => p.stage],
  ["ownership", (p) => p.facts.ownership],
  ["incentives", (p) => p.facts.incentives],
  ["counterparty", (p) => p.facts.counterparty],
  ["timeline", (p) => p.facts.timeline],
];

export function CompareView() {
  const { t } = useI18n();
  return (
    <div className="frame col" style={{ background: "var(--surface)" }}>
      <TopBar
        showOrg={false}
        left={
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <Link href="/workspace" style={{ textDecoration: "none" }}>
              <button className="btn btn-sm btn-ghost"><ArrowLeft size={14} strokeWidth={1.75} /> {t("compare.workspace")}</button>
            </Link>
            <span style={{ color: "var(--ink-4)" }}>/</span>
            <span style={{ fontWeight: 500 }}>{DATA.org.name}</span>
            <span style={{ color: "var(--ink-4)" }}>/</span>
            <span style={{ fontWeight: 600 }}>{t("compare.compareCrumb")}</span>
          </div>
        }
        right={
          <>
            <ComingSoonButton label={t("compare.addProject")} className="btn btn-sm"><Plus size={14} strokeWidth={1.75} /> {t("compare.addProject")}</ComingSoonButton>
            <ComingSoonButton label={t("compare.exportMemo")} className="btn btn-sm">{t("compare.exportMemo")}</ComingSoonButton>
            <ComingSoonButton label={t("compare.shareComparison")} className="btn btn-sm btn-primary">{t("compare.shareComparison")}</ComingSoonButton>
          </>
        }
      />

      <div className="scroll col grow" style={{ padding: "24px 32px", gap: 20 }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>{t("compare.shortlist")}</div>
          <h1 className="serif" style={{ fontSize: 26, fontWeight: 600, margin: "4px 0 0", letterSpacing: "-0.01em" }}>{t("compare.title")}</h1>
          <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "4px 0 0" }}>{t("compare.subtitle")}</p>
        </div>

        {/* project header cards */}
        <div style={{ display: "grid", gridTemplateColumns: "200px repeat(3, 1fr)", gap: 0 }}>
          <div />
          {PROJECTS.map((p) => (
            <div key={p.short} className="card" style={{ padding: 16, marginRight: 8, position: "relative", borderTop: p.star ? "3px solid var(--terracotta)" : "3px solid transparent" }}>
              {p.star && (
                <span className="chip chip-terra" style={{ position: "absolute", top: 10, right: 10, fontSize: 9, display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <Star size={10} strokeWidth={2} fill="currentColor" /> {t("compare.bestFit")}
                </span>
              )}
              <div className="mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>{p.short}</div>
              <div className="serif" style={{ fontSize: 16, fontWeight: 600, marginTop: 4, lineHeight: 1.25 }}>{p.name}</div>
              <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                <span className="chip chip-jade" style={{ fontSize: 9 }}>{p.stage}</span>
                <span className="chip" style={{ fontSize: 9 }}>{p.risk} {t("compare.riskSuffix")}</span>
              </div>
            </div>
          ))}
        </div>

        {/* comparison rows */}
        <div className="compare-grid">
          {ROWS.map(([key, getter]) => (
            <Fragment key={key}>
              <div className="row-head">{t("compare.rows." + key)}</div>
              {PROJECTS.map((p) => {
                const isIRR = key === "irr";
                return (
                  <div key={p.short} style={{ fontWeight: isIRR && p.star ? 600 : 400, color: isIRR && p.star ? "var(--terracotta)" : "inherit" }}>
                    {getter(p)}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>

        {/* AI synthesis */}
        <div className="card" style={{ padding: 16, borderLeft: "3px solid var(--terracotta)", background: "var(--surface-2)" }}>
          <div className="label" style={{ color: "var(--terracotta)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>● <BKPM /> {t("compare.synthesis")}</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
            {t("compare.synthesisBody")}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <Link href="/workspace" style={{ textDecoration: "none" }}>
              <button className="btn btn-sm btn-primary">{t("compare.draftPreread")} <ArrowRight size={14} strokeWidth={1.75} /></button>
            </Link>
            <ComingSoonButton label={t("compare.askRina")} className="btn btn-sm">{t("compare.askRina")}</ComingSoonButton>
            <ComingSoonButton label={t("compare.saveSynthesis")} className="btn btn-sm btn-ghost">{t("compare.saveSynthesis")}</ComingSoonButton>
          </div>
        </div>
      </div>
    </div>
  );
}
