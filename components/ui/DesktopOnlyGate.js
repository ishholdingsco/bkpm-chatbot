"use client";
// Interim gate for issue #28. The whole prototype is still desktop-only; full
// mobile/tablet layouts (bottom sheets, drawers, FABs) are a large epic that's
// not built yet. Until then, any viewport under the desktop breakpoint (1024px)
// gets this full-screen "open on desktop" notice instead of a broken layout.
//
// Detection is pure CSS (`@media (max-width: 1023.98px)` in midfi-styles.css):
// the gate is `display: none` on desktop, so the desktop experience is byte-for
// -byte unchanged and there's no SSR/hydration flash. The app still mounts
// underneath on small screens, but the fixed overlay covers it completely.

import { Monitor } from "lucide-react";
import { Logo } from "./primitives";
import { useI18n } from "./i18n";

export function DesktopOnlyGate() {
  const { t } = useI18n();
  return (
    <div className="desktop-gate" role="dialog" aria-modal="true" aria-label={t("desktopOnly.title")}>
      <div className="desktop-gate-card">
        <Logo size={22} showTag />
        <span className="desktop-gate-icon" aria-hidden="true">
          <Monitor size={28} strokeWidth={1.5} />
        </span>
        <h1 className="desktop-gate-title serif">{t("desktopOnly.title")}</h1>
        <p className="desktop-gate-body">{t("desktopOnly.body")}</p>
        <p className="desktop-gate-hint mono">{t("desktopOnly.hint")}</p>
        <div className="desktop-gate-footer mono">{t("desktopOnly.footer")}</div>
      </div>
    </div>
  );
}
