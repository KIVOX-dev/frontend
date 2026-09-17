"use client";

import { useAuthStore } from "@/stores/authStore";
import { ActivityHeatmap } from "@/components/shared/ActivityHeatmap";
import { ConnectedAppsCard } from "@/components/shared/ConnectedAppsCard";

/**
 * The screen behind the profile chip's "My Activity" menu item — account
 * summary plus the GitHub-style activity heatmap. Reused as-is across every
 * role's shell (LearnerShell/CollegeAdminShell/HrShell all route their own
 * "my-activity" screen id here).
 */
export function MyActivity() {
  const { user } = useAuthStore();

  return (
    <div className="screen active" style={{ padding: "24px 40px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)", marginBottom: "4px" }}>My Activity</h2>
        <p style={{ color: "var(--muted)", fontSize: "14px" }}>Your account and activity history.</p>
      </div>

      <div className="card" style={{ marginBottom: "20px", padding: "20px", display: "flex", alignItems: "center", gap: "14px" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "var(--accent)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {user?.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--text)" }}>{user?.name || "—"}</div>
          <div style={{ fontSize: "13px", color: "var(--muted)" }}>{user?.email || "—"}</div>
          <div style={{ fontSize: "12px", color: "var(--muted)", textTransform: "capitalize", marginTop: "2px" }}>
            {user?.role?.replace(/_/g, " ") || "—"}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "20px", padding: "20px" }}>
        <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text)", marginBottom: "4px" }}>Activity</div>
        <ActivityHeatmap />
      </div>

      {user?.role === "student" && <ConnectedAppsCard />}
    </div>
  );
}
