// Reusable shimmer placeholder for the loading states (issue #39). Pure render —
// no hooks, no "use client" — so it works in route-level `loading.js` server
// components and in client overlays alike. The shimmer + colours live in the
// `.ui-skeleton` rule (app/midfi-styles.css) and follow the BKPM surface tokens,
// so it reads as on-brand rather than a generic browser spinner.

export function Skeleton({ width, height = 12, radius, circle = false, className = "", style }) {
  return (
    <div
      aria-hidden="true"
      className={"ui-skeleton " + className}
      style={{
        width: width ?? "100%",
        height: circle ? width ?? height : height,
        borderRadius: circle ? "50%" : radius ?? "var(--radius-sm)",
        ...style,
      }}
    />
  );
}
