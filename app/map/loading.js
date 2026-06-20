// Route-level loading UI for /map (issue #39). Next.js shows this Suspense
// fallback instantly on navigation while the heavy map bundle streams in, so the
// page never arrives as a blank/half-built frame. Visual-only (shimmer) — the
// localized "Loading map…" text lives in the in-canvas overlay (MapboxMap),
// which mounts once the bundle is ready. Mirrors the MapPage chrome layout.

import { Skeleton } from "@/components/ui/Skeleton";

export default function MapLoading() {
  return (
    <main className="screen">
      <div className="frame col">
        {/* TopBar */}
        <div style={{ height: 48, borderBottom: "1px solid var(--line)", background: "var(--surface)", display: "flex", alignItems: "center", padding: "0 18px", gap: 14, flexShrink: 0 }}>
          <Skeleton width={96} height={16} />
          <div style={{ width: 1, height: 18, background: "var(--line)" }} />
          <Skeleton width={220} height={14} />
          <div style={{ flex: 1 }} />
          <Skeleton width={260} height={28} radius={8} />
          <Skeleton width={36} height={28} radius={8} />
          <Skeleton width={110} height={28} radius={8} />
        </div>

        <div className="row grow" style={{ minHeight: 0 }}>
          {/* Map canvas */}
          <div className="grow" style={{ position: "relative", background: "var(--surface)", backgroundImage: "radial-gradient(var(--line-strong) 1px, transparent 1px)", backgroundSize: "26px 26px", overflow: "hidden" }}>
            {/* Layer panel hint (top-left) */}
            <div className="card" style={{ position: "absolute", top: 16, left: 16, width: 260, padding: 12 }}>
              <Skeleton width={120} height={12} />
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={34} radius={8} />)}
              </div>
            </div>
            {/* Controls hint (top-right) */}
            <div style={{ position: "absolute", top: 16, right: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <Skeleton width={36} height={62} radius={8} />
              <Skeleton width={36} height={62} radius={8} />
            </div>
            {/* Center pill */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Skeleton width={148} height={36} radius={24} />
            </div>
          </div>

          {/* Chat sidebar */}
          <div className="col" style={{ width: 340, borderLeft: "1px solid var(--line)", background: "var(--surface)", flexShrink: 0 }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 8 }}>
              <Skeleton width={26} height={26} circle />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <Skeleton width={120} height={12} />
                <Skeleton width={170} height={9} />
              </div>
            </div>
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
              <Skeleton height={14} />
              <Skeleton width="85%" height={14} />
              <Skeleton height={92} radius={8} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
