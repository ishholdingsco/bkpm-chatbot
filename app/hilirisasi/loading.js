// Route-level loading UI for /hilirisasi (issue #39). Shown instantly on
// navigation while the value-chain bundle streams in, so the tree page never
// arrives blank/half-built. Visual-only (shimmer) — the localized loading text
// lives in the in-canvas overlay (HilirisasiTree), which mounts with the bundle.
// Mirrors the Hilirisasi layout: tree canvas + analyst chat sidebar.

import { Skeleton } from "@/components/ui/Skeleton";

export default function HilirisasiLoading() {
  return (
    <main className="screen">
      <div className="frame col">
        {/* TopBar */}
        <div style={{ height: 48, borderBottom: "1px solid var(--line)", background: "var(--surface)", display: "flex", alignItems: "center", padding: "0 18px", gap: 14, flexShrink: 0 }}>
          <Skeleton width={96} height={16} />
          <div style={{ width: 1, height: 18, background: "var(--line)" }} />
          <Skeleton width={220} height={14} />
          <div style={{ flex: 1 }} />
          <Skeleton width={240} height={28} radius={8} />
          <Skeleton width={36} height={28} radius={8} />
          <Skeleton width={110} height={28} radius={8} />
        </div>

        <div className="row grow" style={{ minHeight: 0 }}>
          {/* Tree canvas */}
          <div className="grow" style={{ position: "relative", background: "var(--bg)", backgroundImage: "radial-gradient(var(--line-strong) 1px, transparent 1px)", backgroundSize: "28px 28px", overflow: "hidden" }}>
            {/* Commodity panel hint (left rail) */}
            <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 192, borderRight: "1px solid var(--line)", background: "var(--surface)", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <Skeleton width={120} height={12} />
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={40} radius={8} />)}
            </div>
            {/* Stats card hint (top-center) */}
            <div style={{ position: "absolute", top: 12, left: "calc(192px + (100% - 192px) / 2)", transform: "translateX(-50%)" }}>
              <Skeleton width={420} height={44} radius={10} />
            </div>
            {/* Center pill */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Skeleton width={196} height={36} radius={24} />
            </div>
          </div>

          {/* Analyst chat sidebar */}
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
