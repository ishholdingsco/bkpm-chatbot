import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Dynamic Open Graph / social-share image (1200×630), rendered from the BKPM
// design tokens so the preview matches the app's design language rather than a
// default placeholder. Re-used as the Twitter card via app/twitter-image.js.
// Kept flat (paper background + ink type + one logo) so the generated PNG stays
// well under WhatsApp's ~300KB sweet-spot for reliable chat previews (#35).

export const alt =
  "Wilaya · BKPM Investment Explorer — atlas investasi langsung Indonesia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// BKPM palette — mirror of the tokens in app/midfi-styles.css.
const BG = "#f6f3ec";
const INK = "#1c1a14";
const INK_2 = "#4a463a";
const INK_3 = "#7a7466";
const LINE = "#e6e0d2";
const BLUE = "#0055a6";
const BLUE_DEEP = "#003f7d";
const GREEN = "#51b749";

export default async function Image() {
  const logoData = await readFile(
    join(process.cwd(), "public/assets/bkpm-logo.png"),
    "base64",
  );
  const logoSrc = `data:image/png;base64,${logoData}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: BG,
          padding: "72px 84px",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        {/* BKPM-blue top accent rule */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 10,
            background: BLUE,
          }}
        />

        {/* Brand row: BKPM mark + live tag */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="BKPM" height={56} />
          <div style={{ width: 1, height: 40, background: LINE }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontFamily: "monospace",
              fontSize: 22,
              letterSpacing: 2,
              color: INK_3,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 10,
                background: GREEN,
              }}
            />
            ATLAS · LIVE
          </div>
        </div>

        {/* Wordmark + headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "auto",
            marginBottom: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              fontSize: 132,
              fontWeight: 400,
              letterSpacing: "-0.02em",
              color: INK,
              lineHeight: 1,
            }}
          >
            Wilaya
            <span style={{ color: BLUE }}>.</span>
            <span style={{ color: GREEN }}>.</span>
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: 880,
              marginTop: 28,
              fontSize: 34,
              lineHeight: 1.32,
              color: INK_2,
            }}
          >
            Intelijen investasi Indonesia — kawasan industri, KEK & peluang
            dalam satu atlas langsung, dengan analis AI.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: "monospace",
            fontSize: 22,
            color: INK_3,
          }}
        >
          <div style={{ display: "flex" }}>BKPM Investment Explorer</div>
          <div style={{ display: "flex", color: BLUE_DEEP }}>
            wilaya · indonesia
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
