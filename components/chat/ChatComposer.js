"use client";
// Reusable chat input primitives shared by the map sidebar (MapChat) and the
// workspace composer. They own the textarea→send wiring and the Send-button
// enabled/label logic so neither surface re-implements it. Layout & styling
// stay with the caller, so each surface keeps its exact look.

import { useLayoutEffect, useRef } from "react";
import { Send, Loader2 } from "lucide-react";

// Textarea that submits on a configurable key combo and auto-grows with its
// content (like most modern chat inputs).
//   submitOn="enter"      → Enter (Shift+Enter inserts a newline)
//   submitOn="mod-enter"  → ⌘/Ctrl+Enter
// It grows up to `maxHeight` px, then scrolls internally; when `value` is
// cleared after a send it snaps back to a single line. All other props
// (placeholder, style…) pass through to <textarea>.
export function ChatTextarea({ value, onChange, onSend, submitOn = "enter", maxHeight = 140, ...rest }) {
  const ref = useRef(null);

  // Re-measure on every value change so it grows while typing and resets to
  // one line once the input is cleared on send.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, maxHeight);
    el.style.height = next + "px";
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [value, maxHeight]);

  const onKeyDown = (e) => {
    if (e.key !== "Enter") return;
    const hasMod = e.metaKey || e.ctrlKey;
    const shouldSend = submitOn === "mod-enter" ? hasMod : !e.shiftKey;
    if (shouldSend) {
      e.preventDefault();
      onSend();
    }
  };
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      {...rest}
    />
  );
}

// Send button — disabled while loading or when the input is empty, shows a
// spinner while a reply is streaming. Caller supplies the class for color.
export function SendButton({ className, loading, input, onSend }) {
  return (
    <button
      className={(className || "") + " ui-icon-btn"}
      disabled={loading || !input.trim()}
      onClick={onSend}
      aria-label="Send message"
    >
      {loading
        ? <Loader2 size={15} strokeWidth={2} className="spin" />
        : <Send size={15} strokeWidth={1.75} />}
    </button>
  );
}
