import "./globals.css";
import "./midfi-styles.css";
import "./map-styles.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { ToastHost } from "@/components/ui";

export const metadata = {
  title: "Wilaya · BKPM Investment Explorer",
  description:
    "Indonesia investment intelligence — an interactive atlas of industrial estates, special economic zones and opportunities, with an AI analyst.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ToastHost />
      </body>
    </html>
  );
}
