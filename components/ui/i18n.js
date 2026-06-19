"use client";
// Lightweight i18n for the prototype — no external lib. A React Context holds
// the active language; `useI18n().t(key, vars)` does a dot-path lookup into the
// per-language message bundles in messages/*.json. Default is Bahasa Indonesia
// (the BKPM audience); the choice persists to localStorage. See issue #8.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { DropdownMenu } from "./controls";
import id from "@/messages/id.json";
import en from "@/messages/en.json";
import zh from "@/messages/zh.json";

const BUNDLES = { id, en, zh };
const DEFAULT_LANG = "id";
const STORAGE_KEY = "wilaya.lang";

// Order + labels for the language switcher. `code` is the short chip shown on
// the trigger; `label` is the menu row.
export const LANGUAGES = [
  { lang: "id", code: "ID", label: "Bahasa Indonesia" },
  { lang: "en", code: "EN", label: "English" },
  { lang: "zh", code: "中", label: "中文" },
];

const I18nContext = createContext(null);

// Resolve a dot-path ("map.layers.title") against a bundle, returning whatever
// it points at (string | array | object) or undefined.
function lookup(bundle, key) {
  return key.split(".").reduce((node, part) => (node == null ? undefined : node[part]), bundle);
}

// Replace {name} placeholders from `vars`.
function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export function LanguageProvider({ children }) {
  // Always start at the default so the server render and first client render
  // match; the stored preference is applied after mount (below).
  const [lang, setLangState] = useState(DEFAULT_LANG);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (saved && BUNDLES[saved] && saved !== lang) setLangState(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next) => {
    if (!BUNDLES[next]) return;
    setLangState(next);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key, vars) => {
      const hit = lookup(BUNDLES[lang], key) ?? lookup(BUNDLES[DEFAULT_LANG], key);
      if (hit == null) return key; // surface the missing key instead of blank
      return typeof hit === "string" ? interpolate(hit, vars) : hit;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// Components under the provider read { lang, setLang, t }. Falls back to a
// default-language `t` if used outside a provider (e.g. isolated tests) so it
// never throws.
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (ctx) return ctx;
  return {
    lang: DEFAULT_LANG,
    setLang: () => {},
    t: (key, vars) => {
      const hit = lookup(BUNDLES[DEFAULT_LANG], key);
      return typeof hit === "string" ? interpolate(hit, vars) : hit ?? key;
    },
  };
}

// Drop-in language switcher used in the top bars. Mirrors the existing
// btn-ghost dropdown styling.
export function LangToggle() {
  const { lang, setLang } = useI18n();
  const current = LANGUAGES.find((l) => l.lang === lang) || LANGUAGES[0];
  return (
    <DropdownMenu
      align="end"
      trigger={
        <button className="btn btn-sm btn-ghost" aria-label="Language">
          {current.code} <ChevronDown size={13} strokeWidth={1.75} />
        </button>
      }
      items={LANGUAGES.map((l) => ({
        label: l.label,
        hint: l.code,
        onSelect: () => setLang(l.lang),
      }))}
    />
  );
}
