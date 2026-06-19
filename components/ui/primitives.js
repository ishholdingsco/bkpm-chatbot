// Pure render primitives reused across every screen, ported from
// content/midfi-shared.jsx. No hooks — safe to import anywhere.

import { DATA, KIND_COLOR } from "./data";

const LOGO_SRC = "/assets/bkpm-logo.png";

// ─────────────────────────────────────────────────────────────
// Avatars + presence
// ─────────────────────────────────────────────────────────────
export function Avatar({ name, color, size, status }) {
  const cls = size === "sm" ? "avatar avatar-sm" : size === "lg" ? "avatar avatar-lg" : "avatar";
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div className={cls} style={{ background: color || "#7a7466" }}>{name}</div>
      {status && (
        <div style={{
          position: "absolute", bottom: -1, right: -1,
          width: size === "lg" ? 12 : 8, height: size === "lg" ? 12 : 8,
          borderRadius: "50%",
          background: status === "online" ? "#2f6a4f" : status === "away" ? "#c8a13a" : "#a39d8d",
          border: "2px solid #fff",
        }} />
      )}
    </div>
  );
}

export function AvatarStack({ items, max = 3 }) {
  const shown = items.slice(0, max);
  return (
    <div style={{ display: "flex" }}>
      {shown.map((a, i) => (
        <div key={a.short} style={{ marginLeft: i ? -8 : 0, border: "2px solid #fff", borderRadius: "50%" }}>
          <Avatar name={a.short} color={a.color} size="sm" status={a.status} />
        </div>
      ))}
      {items.length > max && (
        <div className="avatar avatar-sm" style={{ background: "#e6e0d2", color: "#4a463a", marginLeft: -8, border: "2px solid #fff" }}>
          +{items.length - max}
        </div>
      )}
    </div>
  );
}

// Logo — "Wilaya.." in Georgia regular with BKPM-blue/green trailing dots,
// next to the official BKPM agency mark.
export function Logo({ size = 18, showTag = true, mono = false }) {
  const dotL = mono ? "currentColor" : "#0055a6";
  const dotR = mono ? "currentColor" : "#51b749";
  const inkColor = mono ? "currentColor" : "#1c1a14";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: Math.round(size * 0.55) }}>
      <span style={{
        fontFamily: 'Georgia, "Source Serif 4", serif',
        fontSize: size,
        fontWeight: 400,
        letterSpacing: "-0.01em",
        color: inkColor,
        lineHeight: 1,
      }}>
        Wilaya<span style={{ color: dotL }}>.</span><span style={{ color: dotR }}>.</span>
      </span>
      {showTag && (
        <>
          <span style={{ display: "inline-block", width: 1, height: Math.round(size * 0.85), background: "rgba(28,26,20,0.18)" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_SRC} alt="BKPM" style={{ height: Math.round(size * 1.25), width: "auto", display: "block", filter: mono ? "grayscale(1)" : "none" }} />
        </>
      )}
    </div>
  );
}

// Inline "BKPM" mention — small image of the agency mark, baseline-aligned.
export function BKPM({ size = 14 }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={LOGO_SRC} alt="BKPM" style={{ height: size, width: "auto", verticalAlign: "-0.18em", display: "inline-block" }} />;
}

// ─── Shared TopBar — used by every screen so the chrome is consistent. ───
export function TopBar({ left, center, right, org, showLogo = true, logoSize = 18, showOrg = true }) {
  return (
    <div style={{
      height: 48,
      borderBottom: "1px solid var(--line)",
      background: "var(--surface)",
      display: "flex",
      alignItems: "center",
      padding: "0 18px",
      gap: 14,
      flexShrink: 0,
    }}>
      {showLogo && <Logo size={logoSize} />}
      {showLogo && left && <div style={{ height: 18, width: 1, background: "var(--line)" }} />}
      {left}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", minWidth: 0 }}>{center}</div>
      {right}
      {showOrg && (
        <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{org || DATA.org.name}</span>
      )}
    </div>
  );
}

// Cite chip
export function Cite({ children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontFamily: "IBM Plex Mono, monospace", fontSize: 10,
      padding: "2px 7px", border: "1px solid #e6e0d2", borderRadius: 3,
      background: "#fbf8f1", color: "#4a463a", textDecoration: "none",
    }}>
      <span style={{ color: "#b94a1f" }}>§</span>{children}
    </span>
  );
}

// Artifact card (canvas rail)
export function ArtifactCard({ kind, title, meta, highlight, onClick }) {
  const colorMap = { DOC: "#b94a1f", MODEL: "#2f6a4f", DIAGRAM: "#c8a13a", MAP: "#7a7466" };
  return (
    <div className="card" onClick={onClick} style={{ padding: 10, cursor: "pointer" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span className={"chip " + (KIND_COLOR[kind] || "")}>{kind}</span>
        <span className="mono" style={{ fontSize: 9, color: "#a39d8d", marginLeft: "auto" }}>14:02</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.3, marginBottom: 6 }}>{title}</div>
      {kind === "DOC" && (
        <div className="ph" style={{ height: 50, background: "#ede8d9" }}><span>regulation excerpt</span></div>
      )}
      {kind === "MODEL" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3, height: 50 }}>
          {Array(16).fill(0).map((_, i) => (
            <div key={i} style={{ background: i % 5 === 0 ? colorMap[kind] : "#e6e0d2", height: "100%", opacity: 0.6 }} />
          ))}
        </div>
      )}
      {kind === "DIAGRAM" && (
        <svg viewBox="0 0 200 50" style={{ width: "100%", height: 50 }}>
          <rect x="60" y="2" width="80" height="14" rx="2" fill="#fbe8dc" stroke="#b94a1f" strokeWidth="1" />
          <text x="100" y="12" textAnchor="middle" fontSize="7" fill="#b94a1f" fontFamily="IBM Plex Mono">OFFSHORE HOLDCO</text>
          <line x1="100" y1="16" x2="100" y2="22" stroke="#7a7466" strokeWidth="1" />
          <rect x="60" y="22" width="80" height="12" rx="2" fill="#fff" stroke="#7a7466" strokeWidth="1" />
          <text x="100" y="31" textAnchor="middle" fontSize="7" fill="#4a463a" fontFamily="IBM Plex Mono">PT INDOCO</text>
          <line x1="100" y1="34" x2="100" y2="38" stroke="#7a7466" strokeWidth="1" />
          <rect x="60" y="38" width="80" height="10" rx="2" fill="#fff" stroke="#7a7466" strokeWidth="1" />
          <text x="100" y="45" textAnchor="middle" fontSize="7" fill="#4a463a" fontFamily="IBM Plex Mono">PT OPCO</text>
        </svg>
      )}
      {kind === "MAP" && (
        <svg viewBox="0 0 200 50" style={{ width: "100%", height: 50 }}>
          <path d="M20 30 Q40 10 70 25 T120 28 Q150 18 180 32" fill="none" stroke="#cfc6b0" strokeWidth="1.5" />
          <circle cx="60" cy="22" r="3" fill="#b94a1f" />
          <circle cx="95" cy="27" r="3" fill="#b94a1f" />
          <circle cx="130" cy="25" r="3" fill="#2f6a4f" />
          <circle cx="155" cy="28" r="2" fill="#b94a1f" />
        </svg>
      )}
      {highlight && (
        <div style={{ marginTop: 6, fontSize: 10, color: "#b94a1f", fontStyle: "italic" }}>&quot;{highlight}&quot;</div>
      )}
      <div className="mono" style={{ fontSize: 9, color: "#a39d8d", marginTop: 4 }}>{meta}</div>
    </div>
  );
}
