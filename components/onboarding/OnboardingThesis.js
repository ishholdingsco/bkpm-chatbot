// Investment-thesis onboarding step, ported from content/midfi-screens.jsx
// (Onboarding). Left: the thesis form; right: a live preview of matched
// analysts. Selections are static in the mockup (no toggles), so no hooks.

"use client";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DATA, Avatar, BKPM, TopBar, useI18n } from "@/components/ui";

const SECTORS = [
  ["criticalMinerals", true], ["renewableEnergy", true], ["digitalInfra", false],
  ["evBattery", true], ["manufacturing", false], ["agriculture", false],
  ["tourism", false], ["healthcare", false],
];
const TICKETS = ["<$50M", "$50M–$250M", "$250M–$1B", ">$1B"];
const STAGES = ["exploring", "activeDiligence", "alreadyInvested"];

export function OnboardingThesis() {
  const { t } = useI18n();
  return (
    <div className="frame col" style={{ background: "var(--surface)" }}>
      <TopBar
        showOrg={false}
        right={<span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{t("onboarding.step2of3")}</span>}
      />

      <div className="row grow" style={{ minHeight: 0 }}>
        {/* left: form */}
        <div className="col" style={{ width: 480, padding: "40px 48px", background: "var(--surface)", overflow: "auto" }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>{t("onboarding.welcome")}</div>
          <h1 className="serif" style={{ fontSize: 30, fontWeight: 500, margin: "4px 0 6px", letterSpacing: "-0.015em" }}>
            {t("onboarding.tellThesisPre")} <span style={{ color: "var(--terracotta)" }}>{t("onboarding.tellThesisHl")}</span>
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "0 0 24px", lineHeight: 1.55 }}>
            {t("onboarding.thesisBody").split("{bkpm}")[0]}<BKPM />{t("onboarding.thesisBody").split("{bkpm}")[1]}
          </p>

          <div className="label" style={{ marginBottom: 6 }}>{t("onboarding.sectorsOfInterest")}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
            {SECTORS.map(([key, sel]) => (
              <span key={key} className={"chip " + (sel ? "chip-terra" : "")} style={{ cursor: "pointer", padding: "5px 10px" }}>{sel && "✓ "}{t("onboarding.sectors." + key)}</span>
            ))}
          </div>

          <div className="label" style={{ marginBottom: 6 }}>{t("onboarding.ticketSize")}</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
            {TICKETS.map((s, i) => (
              <span key={s} className={"chip " + (i === 2 ? "chip-terra" : "")} style={{ cursor: "pointer", padding: "6px 12px", fontSize: 11 }}>{i === 2 && "✓ "}{s}</span>
            ))}
          </div>

          <div className="label" style={{ marginBottom: 6 }}>{t("onboarding.stageOfEngagement")}</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
            {STAGES.map((key, i) => (
              <span key={key} className={"chip " + (i === 1 ? "chip-terra" : "")} style={{ cursor: "pointer", padding: "6px 12px", fontSize: 11 }}>{i === 1 && "✓ "}{t("onboarding.stages." + key)}</span>
            ))}
          </div>

          <div className="label" style={{ marginBottom: 6 }}>{t("onboarding.anythingSpecific")}</div>
          <div className="card" style={{ padding: 12, marginBottom: 24 }}>
            <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{t("onboarding.specificPlaceholder")}</span>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/onboarding" style={{ textDecoration: "none" }}>
              <button className="btn"><ArrowLeft size={14} strokeWidth={1.75} /> {t("onboarding.back")}</button>
            </Link>
            <Link href="/workspace" style={{ textDecoration: "none", flex: 1 }}>
              <button className="btn btn-primary" style={{ width: "100%" }}>{t("onboarding.continueMatch")} <ArrowRight size={14} strokeWidth={1.75} /></button>
            </Link>
          </div>
        </div>

        {/* right: preview of who you'll be matched with */}
        <div className="col grow" style={{ background: "linear-gradient(135deg, var(--surface-2), var(--terracotta-soft) 80%)", padding: 40, justifyContent: "center", alignItems: "flex-start" }}>
          <div style={{ maxWidth: 380 }}>
            <div className="label" style={{ marginBottom: 10 }}>{t("onboarding.basedOnThesis")}</div>
            <div className="serif" style={{ fontSize: 18, fontWeight: 500, marginBottom: 16, letterSpacing: "-0.01em" }}>
              {t("onboarding.matchedPre")} <span style={{ color: "var(--terracotta)" }}>{t("onboarding.matchedHl").split("{bkpm}")[0]}<BKPM />{t("onboarding.matchedHl").split("{bkpm}")[1]}</span> {t("onboarding.matchedPost")}
            </div>

            {DATA.analysts.map((a) => (
              <div key={a.short} className="card" style={{ padding: 14, marginBottom: 10, display: "flex", gap: 12, alignItems: "center" }}>
                <Avatar name={a.short} color={a.color} size="lg" status={a.status} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>{a.role}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-2)", marginTop: 4 }}>{t("onboarding.covers")} {a.focus}</div>
                </div>
                <span className="chip chip-jade chip-dot" style={{ fontSize: 9 }}>{t("onboarding.match")}</span>
              </div>
            ))}

            <div style={{ marginTop: 18, padding: 14, borderRadius: 8, background: "rgba(255,255,255,0.6)", border: "1px solid var(--line)" }}>
              <div className="label" style={{ marginBottom: 4 }}>{t("onboarding.youCanAlso")}</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{t("onboarding.alsoTeam")}</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-2)", marginTop: 2 }}>{t("onboarding.alsoData")}</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-2)", marginTop: 2 }}>{t("onboarding.alsoDigest")}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
