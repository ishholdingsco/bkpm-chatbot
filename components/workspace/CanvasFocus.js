"use client";
// Canvas focus overlay, ported from content/midfi-screens.jsx (CanvasFocus).
// Opened from the shared canvas: clicking a DOC artifact opens the full
// document reader (regulation text + outline/annotations rail); other artifact
// kinds fall back to the compact preview that already lived in ActiveThread.

import { Download, ArrowUpRight } from "lucide-react";
import { Dialog } from "@/components/ui/controls";
import { ArtifactCard } from "@/components/ui";

const OUTLINE = [
  ["§ C(1) Mining concessions", false],
  ["§ C(2)–(6) Other minerals", false],
  ["§ C(7) Nickel midstream ●", true],
  ["§ C(8) Cobalt", false],
  ["§ C(9) Copper", false],
];

const ANNOTATIONS = [
  ["1", "YOU", "SME definition?", "#b94a1f"],
  ["2", "AI", "Cross-ref BKPM 4/2021 §17", "#1c1a14"],
  ["3", "RP", "Konawe used 12% SME quota", "#2f6a4f"],
];

function DocumentReader() {
  return (
    <div className="row" style={{ gap: 0, minHeight: 0 }}>
      {/* doc area */}
      <div className="col grow scroll" style={{ background: "#f0ebe0", alignItems: "center", padding: 24, maxHeight: "70vh", borderRadius: 8 }}>
        <div className="card" style={{ width: 640, padding: "40px 52px", position: "relative" }}>
          <div className="mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.1em" }}>PERPRES 10/2021</div>
          <h2 className="serif" style={{ fontSize: 20, fontWeight: 600, margin: "4px 0 16px" }}>Annex II — Open Sectors with Conditions</h2>
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 8 }}>§ C(7) — Smelting &amp; refining of nickel ore</div>

          <div style={{ fontSize: 13.5, lineHeight: 1.7, color: "var(--ink)" }}>
            <p style={{ margin: "0 0 12px" }}><span className="bar" style={{ display: "inline-block", width: "92%" }} /></p>
            <p style={{ margin: "0 0 12px" }}>
              Smelting and refining of nickel ore <span className="hl-yellow">shall be open to foreign capital up to 100%</span>, subject to partnership with national small and medium enterprises (SMEs) for non-core auxiliary services as set forth in BKPM Regulation 4/2021 §17.
            </p>
            <p style={{ margin: "0 0 12px", color: "var(--ink-3)" }}><span className="bar" style={{ display: "inline-block", width: "88%" }} /></p>
            <p style={{ margin: "0 0 12px", color: "var(--ink-3)" }}><span className="bar" style={{ display: "inline-block", width: "70%" }} /></p>
            <p style={{ margin: "0 0 12px" }}>
              Holders shall comply with <span className="hl-terra">domestic value-added requirements (DMO 30%)</span> and submit annual reports to BKPM on local hiring and SME engagement metrics.
            </p>
            <p style={{ margin: "0 0 12px" }}><span className="bar" style={{ display: "inline-block", width: "95%" }} /></p>
            <p style={{ margin: "0 0 12px" }}><span className="bar" style={{ display: "inline-block", width: "78%" }} /></p>
          </div>
        </div>
      </div>

      {/* right rail: outline + annotations */}
      <div className="col" style={{ width: 260, flexShrink: 0, borderLeft: "1px solid var(--line)", background: "var(--surface-2)", padding: 14, gap: 12, maxHeight: "70vh", overflow: "auto" }}>
        <div className="label">Outline</div>
        <div style={{ fontSize: 12, lineHeight: 1.7 }}>
          {OUTLINE.map(([txt, active]) => (
            <div key={txt} style={{ fontWeight: active ? 600 : 400, color: active ? "var(--terracotta)" : "var(--ink-3)" }}>{txt}</div>
          ))}
        </div>
        <div className="div-h" />
        <div className="label">Annotations · 3</div>
        {ANNOTATIONS.map(([n, who, txt, c]) => (
          <div key={n} style={{ display: "flex", gap: 8 }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: c, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, flexShrink: 0 }}>{n}</div>
            <div style={{ minWidth: 0 }}>
              <div className="mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>{who}</div>
              <div style={{ fontSize: 11.5 }}>{txt}</div>
            </div>
          </div>
        ))}
        <div className="div-h" />
        <div className="label">Linked threads</div>
        <div style={{ fontSize: 11.5, color: "var(--terracotta)" }}>● DNI / smelter co-investment</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-2)" }}>○ Tax holiday eligibility</div>
      </div>
    </div>
  );
}

// Compact preview for non-document artifacts (the original ActiveThread modal).
function ArtifactPreview({ artifact }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span className="chip">{artifact.kind}</span>
        <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>{artifact.meta}</span>
      </div>
      <ArtifactCard {...artifact} onClick={() => {}} />
      {artifact.highlight && (
        <div style={{ marginTop: 14, fontSize: 13, lineHeight: 1.6, color: "var(--ink-2)", fontStyle: "italic", borderLeft: "3px solid var(--terracotta)", paddingLeft: 12 }}>
          &quot;{artifact.highlight}&quot;
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <button className="btn btn-sm btn-primary">Open in canvas</button>
        <button className="btn btn-sm"><ArrowUpRight size={14} strokeWidth={1.75} /> Share</button>
      </div>
    </>
  );
}

export function CanvasFocus({ artifact, onOpenChange }) {
  const isDoc = artifact?.kind === "DOC";
  return (
    <Dialog
      open={!!artifact}
      onOpenChange={onOpenChange}
      title={artifact?.title || ""}
      width={isDoc ? 940 : 560}
    >
      {artifact && (isDoc
        ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span className="chip chip-terra">DOC</span>
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>Pinned by AI · 14:00 · {artifact.meta}</span>
              <div className="grow" />
              <button className="btn btn-sm"><Download size={14} strokeWidth={1.75} /> Download PDF</button>
            </div>
            <DocumentReader />
          </>
        )
        : <ArtifactPreview artifact={artifact} />
      )}
    </Dialog>
  );
}
