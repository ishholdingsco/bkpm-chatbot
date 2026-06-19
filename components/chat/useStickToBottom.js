"use client";
// Stick-to-bottom scroll for chat lists (issue #29). Keeps the message
// container pinned to the bottom while the assistant streams tokens, but yields
// the instant the user scrolls up — and re-engages when they scroll back down.
// Shared by both chat surfaces (workspace thread + map sidebar) via a ref the
// caller spreads onto its `.scroll` container.
//
// `dep` is whatever changes per streamed update (pass the `messages` array): the
// hook re-pins to the bottom on each change while it's still "following".

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

// How close to the bottom (px) still counts as "at the bottom". Gives a little
// slack so a near-bottom resting position keeps following.
const THRESHOLD = 64;

export function useStickToBottom(dep) {
  const containerRef = useRef(null);
  // Source of truth read synchronously inside the layout effect; the state below
  // only mirrors it for rendering (e.g. the jump button).
  const followRef = useRef(true);
  // Set right before we move the scrollbar ourselves so the resulting scroll
  // event isn't mistaken for the user scrolling up.
  const selfScrollRef = useRef(false);
  const [isFollowing, setIsFollowing] = useState(true);

  const setFollow = useCallback((next) => {
    if (followRef.current !== next) {
      followRef.current = next;
      setIsFollowing(next);
    }
  }, []);

  // Jump to the bottom and (re-)engage following. `behavior: "smooth"` is fine
  // for the button; token streaming uses the instant path in the layout effect.
  const scrollToBottom = useCallback(
    (behavior = "auto") => {
      const el = containerRef.current;
      if (!el) return;
      selfScrollRef.current = true;
      el.scrollTo({ top: el.scrollHeight, behavior });
      setFollow(true);
    },
    [setFollow]
  );

  // Re-pin on every streamed update while following. useLayoutEffect runs before
  // paint, so the catch-up is invisible (no smooth/animated lag during fast
  // streaming). Also runs on first render → opens scrolled to the latest turn.
  useLayoutEffect(() => {
    if (!followRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    selfScrollRef.current = true;
    el.scrollTop = el.scrollHeight;
  }, [dep]);

  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    // Swallow the scroll event our own auto-pin just triggered.
    if (selfScrollRef.current) {
      selfScrollRef.current = false;
      return;
    }
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setFollow(distance <= THRESHOLD);
  }, [setFollow]);

  return { containerRef, onScroll, scrollToBottom, isFollowing };
}

// Floating "jump to latest" pill (issue #29, optional). Render inside a
// position:relative parent. It floats just above the composer — but the
// composer auto-grows with its text (issue #6), so a fixed offset would let a
// tall composer swallow the pill. Instead we measure the composer (`anchorRef`)
// and sit `gap` px above it, easing the move so it tracks the growth smoothly.
export function JumpToLatest({ show, onClick, label, anchorRef, gap = 12 }) {
  const [bottom, setBottom] = useState(72);

  useEffect(() => {
    const el = anchorRef?.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => setBottom(el.offsetHeight + gap);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [anchorRef, gap]);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
      className="btn btn-sm"
      style={{
        position: "absolute",
        left: "50%",
        bottom,
        zIndex: 5,
        borderRadius: 999,
        background: "var(--surface)",
        boxShadow: "var(--shadow-2)",
        // Track the composer height + fade in/out, all eased so nothing snaps.
        transition: "bottom 220ms ease, opacity 180ms ease, transform 180ms ease",
        opacity: show ? 1 : 0,
        transform: show ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(6px)",
        pointerEvents: show ? "auto" : "none",
      }}
    >
      <ChevronDown size={14} strokeWidth={1.75} /> {label}
    </button>
  );
}
