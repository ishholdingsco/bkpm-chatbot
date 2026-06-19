"use client";
// Lightweight app-wide toast — used to give backend-less buttons an honest
// "coming soon" acknowledgement instead of doing nothing. Decoupled via a
// window CustomEvent so any component (even server-rendered trees) can fire
// one by calling `toast()` / `comingSoon()` without prop-drilling a context.

import { useEffect, useState } from "react";

const EVENT = "wilaya:toast";

// Fire a toast from anywhere. No-op during SSR (no window).
export function toast(message) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: message }));
}

// Convenience for the common case: a feature that isn't built in the prototype.
export function comingSoon(label) {
  toast(`${label} — coming soon`);
}

// A plain button that fires a "coming soon" toast. Being a client component,
// it lets server-rendered screens (CompareView, EmptyState, …) keep a dead
// CTA honest without the whole screen opting into "use client".
export function ComingSoonButton({ label, className, style, children, ...rest }) {
  return (
    <button className={className} style={style} onClick={() => comingSoon(label)} {...rest}>
      {children}
    </button>
  );
}

let nextId = 1;

// Mount once (in the root layout). Listens for toast events and renders a
// bottom-center stack; each toast auto-dismisses after a few seconds.
export function ToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const onToast = (e) => {
      const id = nextId++;
      setToasts((cur) => [...cur, { id, message: String(e.detail ?? "") }]);
      setTimeout(() => setToasts((cur) => cur.filter((t) => t.id !== id)), 2600);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        // height:auto overrides the global `body > div { height: 100% }`, which
        // would otherwise stretch this wrapper full-height and push toasts up.
        position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
        height: "auto", zIndex: 9999, display: "flex", flexDirection: "column",
        gap: 8, alignItems: "center", pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          style={{
            background: "#1a1a2e", color: "#fff", fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 12.5, fontWeight: 500, padding: "9px 16px", borderRadius: 999,
            boxShadow: "0 6px 20px rgba(20,20,40,0.28)", maxWidth: "80vw",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
