"use client";
// Reusable chat input primitives shared by the map sidebar (MapChat) and the
// workspace composer. They own the textarea→send wiring and the Send-button
// enabled/label logic so neither surface re-implements it. Layout & styling
// stay with the caller, so each surface keeps its exact look.

// Textarea that submits on a configurable key combo.
//   submitOn="enter"      → Enter (Shift+Enter inserts a newline)
//   submitOn="mod-enter"  → ⌘/Ctrl+Enter
// All other props (rows, placeholder, style…) pass through to <textarea>.
export function ChatTextarea({ value, onChange, onSend, submitOn = "enter", ...rest }) {
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
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      {...rest}
    />
  );
}

// Send button — disabled while loading or when the input is empty, shows a
// spinner glyph while a reply is streaming. Caller supplies the class for color.
export function SendButton({ className, loading, input, onSend }) {
  return (
    <button className={className} disabled={loading || !input.trim()} onClick={onSend}>
      {loading ? "…" : "Send"}
    </button>
  );
}
