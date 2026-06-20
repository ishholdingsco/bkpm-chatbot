// Route-level loading UI for /workspace (issue #39). The thread itself seeds
// from static data and renders whole, so it needs no in-page skeleton — but the
// screen still pulls a sizeable client bundle (thread, canvas, chat hooks) on
// navigation. This Suspense fallback shows the thread shell instantly so the
// page arrives composed, not piecemeal. Visual-only (shimmer). Mirrors the
// ActiveThread layout: sidebar · thread · canvas rail.

import { Skeleton } from "@/components/ui/Skeleton";

export default function WorkspaceLoading() {
  return (
    <main className="screen">
      <div className="frame col">
        {/* TopBar */}
        <div style={{ height: 48, borderBottom: "1px solid var(--line)", background: "var(--surface)", display: "flex", alignItems: "center", padding: "0 18px", gap: 14, flexShrink: 0 }}>
          <Skeleton width={260} height={14} />
          <div style={{ flex: 1 }} />
          <Skeleton width={120} height={28} radius={8} />
          <Skeleton width={36} height={28} radius={8} />
          <Skeleton width={36} height={28} radius={8} />
        </div>

        <div className="row grow" style={{ minHeight: 0 }}>
          {/* Sidebar */}
          <div className="col" style={{ width: 240, borderRight: "1px solid var(--line)", background: "var(--surface-2)", padding: "14px 14px", gap: 10 }}>
            <Skeleton width={120} height={16} />
            <div style={{ height: 1, background: "var(--line)", margin: "4px 0" }} />
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={32} radius={8} />)}
          </div>

          {/* Thread column */}
          <div className="col grow" style={{ minWidth: 0, background: "var(--surface)" }}>
            <div style={{ padding: "20px 28px 12px", borderBottom: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 8 }}>
              <Skeleton width={240} height={22} />
              <Skeleton width={320} height={10} />
            </div>
            <div style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
              {/* user bubble */}
              <div style={{ alignSelf: "flex-end", width: "55%" }}><Skeleton height={44} radius={10} /></div>
              {/* assistant turn */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Skeleton height={14} />
                <Skeleton width="92%" height={14} />
                <Skeleton width="78%" height={14} />
              </div>
              <div style={{ alignSelf: "flex-end", width: "45%" }}><Skeleton height={36} radius={10} /></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Skeleton height={14} />
                <Skeleton width="85%" height={14} />
              </div>
            </div>
            <div style={{ marginTop: "auto", padding: 16, borderTop: "1px solid var(--line)" }}>
              <Skeleton height={56} radius={10} />
            </div>
          </div>

          {/* Canvas rail */}
          <div className="col" style={{ width: 300, borderLeft: "1px solid var(--line)", background: "var(--surface-2)" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 8 }}>
              <Skeleton width={120} height={12} />
              <div style={{ flex: 1 }} />
              <Skeleton width={26} height={26} radius={6} />
            </div>
            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {[0, 1, 2].map((i) => <Skeleton key={i} height={88} radius={8} />)}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
