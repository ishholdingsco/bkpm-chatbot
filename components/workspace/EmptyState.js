// New-project empty state, ported from content/midfi-screens.jsx (EmptyState).
// Shown when a project/thread has no messages yet. Starter prompts and the
// primary CTA drop the user into the live workspace thread.

import Link from "next/link";
import { DATA, AvatarStack, BKPM, TopBar } from "@/components/ui";

const STARTERS = [
  { icon: "§", label: "What's the foreign-ownership cap on this sector?", tag: "Regulatory" },
  { icon: "◇", label: "Show me comparable deals in the last 24 months", tag: "Comps" },
  { icon: "⌘", label: "Sketch a typical SPV structure with a state-owned partner", tag: "Structure" },
  { icon: "☉", label: "What tax incentives apply (tax holiday, super-deduction)?", tag: "Tax" },
  { icon: "⛰", label: "Which provinces host the active sites for this sector?", tag: "Geography" },
  { icon: "↗", label: "Connect me with the right Wilaya analyst", tag: "Human" },
];

const SECTORS = ["Critical minerals", "Energy", "Digital infra", "Manufacturing", "Agriculture"];

export function EmptyState() {
  return (
    <div className="frame col" style={{ background: "var(--surface)" }}>
      <TopBar right={<span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>new project</span>} />

      <div className="grow" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, position: "relative", overflow: "auto" }}>
        <div style={{ maxWidth: 720, width: "100%" }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>NEW PROJECT</div>
          <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, margin: "6px 0 8px", letterSpacing: "-0.015em" }}>
            What are you exploring in <span style={{ color: "var(--terracotta)" }}>Indonesia</span>?
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink-2)", margin: "0 0 20px", lineHeight: 1.55 }}>
            Name this project, then start a thread. The shared canvas will collect every regulation, comp, and structure as we go — and a <BKPM /> analyst is one ↗ away.
          </p>

          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <div className="label" style={{ marginBottom: 8 }}>Project name</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", borderBottom: "1px solid var(--line)", paddingBottom: 8 }}>
              <span style={{ fontSize: 16, color: "var(--ink-4)" }}>e.g.</span>
              <span style={{ fontSize: 16 }}>Geothermal — North Sumatra</span>
              <span style={{ width: 1, height: 16, background: "var(--terracotta)", animation: "blink 1s infinite" }} />
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
              <span className="label" style={{ alignSelf: "center", marginRight: 4 }}>Sector</span>
              {SECTORS.map((s) => (
                <span key={s} className="chip" style={{ cursor: "pointer" }}>{s}</span>
              ))}
            </div>
          </div>

          <div className="label" style={{ marginBottom: 10 }}>Or start with a question</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {STARTERS.map((s) => (
              <Link key={s.label} href="/workspace" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="card" style={{ padding: 12, cursor: "pointer", display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 24, height: 24, borderRadius: 4, background: "var(--surface-3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--terracotta)", fontWeight: 600 }}>{s.icon}</div>
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
              <button className="btn btn-primary">Create project &amp; start thread</button>
            </Link>
            <button className="btn">Import deal memo (.pdf, .docx)</button>
            <div className="grow" />
            <span style={{ fontSize: 11 }}>3 <BKPM /> analysts available now</span>
            <AvatarStack items={DATA.analysts} max={3} />
          </div>
        </div>
      </div>
    </div>
  );
}
