import React from "react";
import { Logo } from "@/components/shared/Logo";
import { PortalScene, PORTAL_THEME, type PortalKey } from "@/components/layout/PortalScene";

export function AuthSplitLayout({
  children,
  portal,
}: {
  children: React.ReactNode;
  /** Which product surface this login belongs to — each gets its own color,
      illustration, and copy so the portals read as distinct products
      instead of one background recolored. See PortalScene. */
  portal: PortalKey;
}) {
  return (
    <div id="login-page" style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", background: "var(--bg)" }}>
      <div className="lp-left" style={{ background: PORTAL_THEME[portal].bg }}>
        <PortalScene portal={portal} />
      </div>
      <div
        className="lp-right"
        style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            opacity: 0.06,
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          <Logo variant="mark" height={400} />
        </div>
        {children}
      </div>
    </div>
  );
}
