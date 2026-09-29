import React from "react";
import { Logo } from "@/components/shared/Logo";
import { AuthMountains, Snowfall, type AuthSeason } from "@/components/layout/AuthMountains";

const SEASON_BG: Record<AuthSeason, string> = {
  spring: "linear-gradient(150deg, #4A2E52 0%, #8B5A8F 45%, #C98FB0 80%, #F5C6D8 100%)",
  summer: "linear-gradient(150deg, #0B3D24 0%, #1C7A4C 45%, #4CAF6E 80%, #A8DDB5 100%)",
  autumn: "linear-gradient(150deg, #6B2A10 0%, #B54A18 45%, #D97B2B 80%, #F0B860 100%)",
  winter: "linear-gradient(150deg, #17324A 0%, #3E6B96 45%, #6FA3C7 80%, #C8E6F5 100%)",
  night: "linear-gradient(150deg, #002457 0%, #0B408B 45%, #0056D2 80%, #5B9DFC 100%)",
  monsoon: "linear-gradient(150deg, #1F2C2A 0%, #35504A 45%, #4C6F63 80%, #8FAA98 100%)",
};

export function AuthSplitLayout({
  children,
  leftContent,
  season = "night",
}: {
  children: React.ReactNode;
  leftContent?: React.ReactNode;
  /** Each login screen gets its own mountain style + season — see AuthMountains. */
  season?: AuthSeason;
}) {
  return (
    <div id="login-page" style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", background: "var(--bg)" }}>
      <div className="lp-left" style={{ background: SEASON_BG[season] }}>
        <AuthMountains season={season} />
        {season === "winter" && <Snowfall />}
        {/* No generic fallback copy here on purpose: every screen besides
            HrLogin and LearnerLogin used to inherit HrLogin's sibling —
            learner-specific "Train smarter" stats — regardless of whether
            it made sense (an institution admin or super admin screen has
            no business citing "Students trained"). Screens that want their
            own pitch pass `leftContent`; everyone else just gets the full
            mountain scene, unobstructed. */}
        {leftContent && <div className="lp-body">{leftContent}</div>}
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
