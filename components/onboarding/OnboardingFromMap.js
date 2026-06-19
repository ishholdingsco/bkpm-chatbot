// "You tapped a pin" onboarding, ported from content/map-screens.jsx
// (OnboardingFromMap). Renders a dimmed Mapbox focused on Morowali with a
// highlight ring, then a guest-vs-project decision. MapboxMap is a client
// component but this wrapper has no hooks, so it stays a server component.

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import MapboxMap from "@/components/map/MapboxMap";
import { DATA, AvatarStack, BKPM, TopBar } from "@/components/ui";

const THESIS = [
  ["Critical minerals", true], ["Renewable energy", true], ["Digital infra", false],
  ["EV battery", true], ["Manufacturing", false],
];
const TICKETS = ["<$50M", "$50–250M", "$250M–$1B", ">$1B"];

export function OnboardingFromMap() {
  return (
    <div className="frame col" style={{ background: "var(--surface)" }}>
      <TopBar
        showOrg={false}
        right={<span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>Step 1 of 2</span>}
      />
      <div className="row grow" style={{ minHeight: 0 }}>
        {/* left: dimmed map showing the pin they tapped */}
        <div className="map-canvas" style={{ width: "50%", position: "relative" }}>
          <MapboxMap center={[121.5, -2.5]} zoom={5.2} bearing={-10} interactive={false} />
          <div style={{ position: "absolute", inset: 0, background: "rgba(255,247,230,0.18)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }}>
            <div style={{ width: 120, height: 120, borderRadius: "50%", border: "2px solid var(--bkpm-blue)", background: "rgba(0,85,166,0.06)" }} />
          </div>
        </div>

        <div className="col grow" style={{ padding: "40px 48px", justifyContent: "center", maxWidth: 560 }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>YOU TAPPED · IMIP MOROWALI</div>
          <h1 className="serif" style={{ fontSize: 28, fontWeight: 500, margin: "4px 0 8px", letterSpacing: "-0.015em" }}>
            Continue exploring as a guest, or start a <span style={{ color: "var(--terracotta)" }}>project</span>
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, margin: "0 0 20px" }}>
            A project gives you persistent threads, a shared canvas with your team, and direct access to <BKPM /> analysts covering this sector.
          </p>

          <div className="card" style={{ padding: 18, marginBottom: 16 }}>
            <div className="label" style={{ marginBottom: 10 }}>Your investment thesis</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {THESIS.map(([s, sel]) => (
                <span key={s} className={"chip " + (sel ? "chip-terra" : "")} style={{ cursor: "pointer", padding: "5px 10px" }}>{sel && "✓ "}{s}</span>
              ))}
            </div>
            <div className="label" style={{ marginBottom: 8 }}>Ticket size</div>
            <div style={{ display: "flex", gap: 6 }}>
              {TICKETS.map((s, i) => (
                <span key={s} className={"chip " + (i === 2 ? "chip-terra" : "")} style={{ cursor: "pointer", fontSize: 11 }}>{i === 2 && "✓ "}{s}</span>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/map" style={{ textDecoration: "none" }}>
              <button className="btn">Keep exploring</button>
            </Link>
            <Link href="/onboarding/thesis" style={{ textDecoration: "none", flex: 1 }}>
              <button className="btn btn-primary" style={{ width: "100%" }}>Start project from this pin <ArrowRight size={14} strokeWidth={1.75} /></button>
            </Link>
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center" }}>
            <AvatarStack items={DATA.analysts} max={3} />
            <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>3 analysts cover Sulawesi critical minerals · usually reply &lt; 2h</span>
          </div>
        </div>
      </div>
    </div>
  );
}
