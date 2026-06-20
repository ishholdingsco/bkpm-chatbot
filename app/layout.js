import "./globals.css";
import "./midfi-styles.css";
import "./map-styles.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { ToastHost, DesktopOnlyGate } from "@/components/ui";
import { LanguageProvider } from "@/components/ui/i18n";

// Base URL for absolute metadata (social scrapers need absolute OG image URLs).
// Resolved from env so the domain can change without touching code (#35):
//   1. NEXT_PUBLIC_SITE_URL  — explicit override (e.g. a future custom domain)
//   2. VERCEL_PROJECT_PRODUCTION_URL — auto-injected on Vercel (no scheme)
//   3. http://localhost:3000 — local dev fallback
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const TITLE = "Wilaya · BKPM Investment Explorer";
// Social/SEO description is written in English — the primary language for the
// shareable preview — even though the in-app UI is being localised separately
// (full ID/EN i18n is tracked in issue #8; see components/ui/i18n.js).
const DESCRIPTION =
  "Indonesia investment intelligence — a live atlas of industrial estates, SEZs & investment opportunities, with an AI analyst. The Wilaya prototype for BKPM.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Wilaya",
  alternates: { canonical: "/" },
  // OG image is supplied automatically by app/opengraph-image.js (and the
  // Twitter card by app/twitter-image.js) — no need to list images here.
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Wilaya · BKPM Investment Explorer",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

// Real device-width so the responsive gate (and future mobile layouts, #28)
// measure actual CSS pixels instead of a ~980px virtual viewport.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          {children}
          <ToastHost />
          <DesktopOnlyGate />
        </LanguageProvider>
      </body>
    </html>
  );
}
