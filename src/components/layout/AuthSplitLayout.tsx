import React from "react";
import { Logo } from "@/components/shared/Logo";
import { AuthMountains, type AuthSeason } from "@/components/layout/AuthMountains";

const SEASON_BG: Record<AuthSeason, string> = {
  spring: "linear-gradient(150deg, #4A2E52 0%, #8B5A8F 45%, #C98FB0 80%, #F5C6D8 100%)",
  summer: "linear-gradient(150deg, #0B3D24 0%, #1C7A4C 45%, #4CAF6E 80%, #A8DDB5 100%)",
  autumn: "linear-gradient(150deg, #6B2A10 0%, #B54A18 45%, #D97B2B 80%, #F0B860 100%)",
  winter: "linear-gradient(150deg, #17324A 0%, #3E6B96 45%, #6FA3C7 80%, #C8E6F5 100%)",
  night: "linear-gradient(150deg, #002457 0%, #0B408B 45%, #0056D2 80%, #5B9DFC 100%)",
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
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", background: "var(--bg)" }}>
      <div className="lp-left" style={{ background: SEASON_BG[season] }}>
        <AuthMountains season={season} />
        <div className="lp-logo" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Logo variant="mark" height={32} priority />
          <span className="text-xl font-black tracking-wider text-white">
            TalentSnaps
          </span>
        </div>
        <div className="lp-body">
          {leftContent || (
            <>
              <div className="lp-pill">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10">
                  <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
                </svg>
                AI-Powered Aptitude Training
              </div>
              <div className="lp-title">
                Train smarter.
                <br />
                Score higher.
              </div>
              <div className="lp-sub">
                Adaptive AI that learns your weak spots, builds your profile, and connects you to real opportunities —
                all in one platform.
              </div>
              <div className="lp-stats">
                <div className="lp-stat">
                  <div className="lp-stat-val">1000+</div>
                  <div className="lp-stat-lbl">Students trained</div>
                </div>
                <div className="lp-stat">
                  <div className="lp-stat-val">90%</div>
                  <div className="lp-stat-lbl">Placement rate</div>
                </div>
                <div className="lp-stat">
                  <div className="lp-stat-val">4.5/5</div>
                  <div className="lp-stat-lbl">Average rating</div>
                </div>
                <div className="lp-stat">
                  <div className="lp-stat-val">20+</div>
                  <div className="lp-stat-lbl">Colleges enrolled</div>
                </div>
              </div>
              <div className="lp-avs">
                <div className="lp-av-stack">
                  <div className="lp-av">AR</div>
                  <div className="lp-av">PK</div>
                  <div className="lp-av">VR</div>
                  <div className="lp-av">SM</div>
                </div>
                <span className="lp-av-text">Joined this week from 38 colleges</span>
              </div>
            </>
          )}
        </div>
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
