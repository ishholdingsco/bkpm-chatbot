"use client";
// Custom 404 (App Router not-found convention, issue #37). The root
// app/not-found.js catches every unmatched URL across the app and replaces
// Next's bare "This page could not be found" default with an on-brand Wilaya
// hero that gives the user a way back. Marked "use client" because it reads
// useI18n() (a client hook); the LanguageProvider in app/layout.js wraps it.

import Link from "next/link";
import { Compass, Map as MapIcon, Home } from "lucide-react";
import { Logo, LangToggle, useI18n } from "@/components/ui";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <main className="notfound">
      <header className="notfound-bar">
        <Logo size={18} />
        <LangToggle />
      </header>

      <div className="notfound-hero">
        <span className="notfound-icon" aria-hidden="true">
          <Compass size={30} strokeWidth={1.5} />
        </span>
        <div className="notfound-figure serif" aria-hidden="true">404</div>
        <h1 className="notfound-title serif">{t("notFound.title")}</h1>
        <p className="notfound-body">{t("notFound.body")}</p>
        <div className="notfound-actions">
          <Link href="/map" className="btn btn-primary">
            <MapIcon size={14} strokeWidth={1.75} /> {t("notFound.toMap")}
          </Link>
          <Link href="/" className="btn btn-ghost">
            <Home size={14} strokeWidth={1.75} /> {t("notFound.toHome")}
          </Link>
        </div>
      </div>

      <div className="notfound-footer mono">{t("notFound.footer")}</div>
    </main>
  );
}
