import "./globals.css";
import "./midfi-styles.css";
import "./map-styles.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { ToastHost, DesktopOnlyGate } from "@/components/ui";
import { LanguageProvider } from "@/components/ui/i18n";

export const metadata = {
  title: "Wilaya · BKPM Investment Explorer",
  description:
    "Indonesia investment intelligence — an interactive atlas of industrial estates, special economic zones and opportunities, with an AI analyst.",
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
