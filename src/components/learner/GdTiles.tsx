"use client";

import { useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";

// Participant tiles for the group discussion: 4:3 rectangles in a video-call
// style. Bots are illustrated portraits whose mouth follows the loudness of
// the voice actually being played (levelRef, 0..1, fed by an audio analyser in
// GroupDiscussionRound); when only the browser voice is available (no audio to
// analyse) levelRef is -1 and the mouth uses a speech-like rhythm instead.
// The "You" tile shows the student's own camera — shown locally only, never
// recorded or uploaded.

export type TileLevelRef = MutableRefObject<number>;

type Look = { skin: string; hair: string; shirt: string; bg: string; style: "short" | "long" | "bun"; glasses?: boolean };

const LOOKS: Record<string, Look> = {
  bot0: { skin: "#c68642", hair: "#1f1a17", shirt: "#1d4ed8", bg: "#dbeafe", style: "short" },
  bot1: { skin: "#8d5524", hair: "#111827", shirt: "#047857", bg: "#d1fae5", style: "short", glasses: true },
  bot2: { skin: "#e0ac69", hair: "#3b2314", shirt: "#b45309", bg: "#fef3c7", style: "long" },
  bot3: { skin: "#f1c27d", hair: "#5b3a29", shirt: "#7c3aed", bg: "#ede9fe", style: "bun" },
};

function Avatar({ slot, active, levelRef }: { slot: string; active: boolean; levelRef: TileLevelRef }) {
  const look = LOOKS[slot] ?? LOOKS.bot0;
  const mouth = useRef<SVGEllipseElement>(null);
  const smooth = useRef(0);

  useEffect(() => {
    let raf = 0;
    const apply = (open: number) => {
      const m = mouth.current;
      if (!m) return;
      m.setAttribute("ry", String(1.1 + open * 6.5));
      m.setAttribute("rx", String(6.5 + open * 2));
    };
    if (!active) {
      smooth.current = 0;
      apply(0);
      return undefined;
    }
    const tick = (t: number) => {
      const level = levelRef.current;
      const target = level >= 0 ? level : Math.max(0, (Math.sin(t / 95) + 1) / 2) * (0.55 + 0.35 * Math.sin(t / 340));
      smooth.current += (target - smooth.current) * 0.45;
      apply(Math.min(1, Math.max(0, smooth.current)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, levelRef]);

  const dark = "#1f2937";
  return (
    <svg viewBox="0 0 160 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ display: "block" }}>
      <rect width="160" height="120" fill={look.bg} />
      {look.style === "long" && <rect x="52" y="22" width="56" height="74" rx="26" fill={look.hair} />}
      <path d="M18 120 C18 94 50 86 80 86 C110 86 142 94 142 120 Z" fill={look.shirt} />
      <rect x="72" y="70" width="16" height="20" rx="6" fill={look.skin} />
      <rect x="72" y="76" width="16" height="8" fill="#000" opacity="0.08" />
      <ellipse cx="80" cy="52" rx="26" ry="30" fill={look.skin} />
      {look.style === "bun" && <circle cx="80" cy="18" r="9" fill={look.hair} />}
      <path d="M53 50 C50 20 110 20 107 50 C100 36 60 36 53 50 Z" fill={look.hair} />
      <g className="gd-blink" style={{ transformOrigin: "80px 52px" }}>
        <circle cx="70" cy="53" r="2.6" fill={dark} />
        <circle cx="90" cy="53" r="2.6" fill={dark} />
      </g>
      <path d="M64 46 Q70 43 76 46 M84 46 Q90 43 96 46" stroke={look.hair} strokeWidth="2" fill="none" strokeLinecap="round" />
      {look.glasses && (
        <g stroke={dark} strokeWidth="1.6" fill="none">
          <rect x="62" y="47" width="16" height="12" rx="4" />
          <rect x="82" y="47" width="16" height="12" rx="4" />
          <path d="M78 52 H82" />
        </g>
      )}
      <ellipse ref={mouth} cx="80" cy="68" rx="6.5" ry="1.1" fill="#7f1d1d" stroke="#5b1414" strokeWidth="0.8" />
    </svg>
  );
}

function useCamera(enabled: boolean) {
  const [status, setStatus] = useState<"idle" | "requesting" | "on" | "denied">("idle");
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
    setStatus("idle");
  };
  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return setStatus("denied");
    setStatus("requesting");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" }, audio: false });
      streamRef.current = s;
      setStream(s);
      setStatus("on");
      s.getVideoTracks()[0]?.addEventListener("ended", () => stop());
    } catch {
      setStatus("denied");
    }
  };

  useEffect(() => {
    if (!enabled) return undefined;
    void start();
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, stream, start, stop };
}

export function ParticipantTile({
  slot,
  name,
  role,
  active,
  levelRef,
  isYou = false,
  listening = false,
}: {
  slot: string;
  name: string;
  role: string;
  active: boolean;
  levelRef: TileLevelRef;
  isYou?: boolean;
  listening?: boolean;
}) {
  const cam = useCamera(isYou);
  const videoRef = useRef<HTMLVideoElement>(null);
  const live = isYou ? listening : active;

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.srcObject = isYou ? cam.stream : null;
  }, [cam.stream, isYou]);

  const initials = name === "You" ? (role || "You").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() : name[0];

  return (
    <div
      className="gd-tile"
      style={{ border: `2px solid ${live ? "var(--accent)" : "var(--border)"}`, boxShadow: live ? "0 0 0 3px var(--accent-l)" : "none" }}
    >
      <style>{`
        .gd-tile { position: relative; aspect-ratio: 4 / 3; border-radius: 8px; overflow: hidden; background: #0f172a; transition: box-shadow .15s, border-color .15s; min-width: 0; }
        .gd-cap { position: absolute; left: 0; right: 0; bottom: 0; padding: 18px 10px 7px; background: linear-gradient(to top, rgba(15,23,42,.78), rgba(15,23,42,0)); color: #fff; display: flex; align-items: baseline; gap: 8px; }
        .gd-cap b { font-size: 13px; font-weight: 700; }
        .gd-cap span { font-size: 11px; opacity: .85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .gd-badge { position: absolute; top: 7px; left: 7px; font-size: 10.5px; font-weight: 700; color: #fff; background: rgba(15,23,42,.65); padding: 2px 8px; border-radius: 4px; display: flex; align-items: center; gap: 5px; }
        .gd-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; animation: gd-pulse 1s infinite; }
        .gd-cambtn { position: absolute; top: 6px; right: 6px; font-size: 11px; font-weight: 600; color: #fff; background: rgba(15,23,42,.65); border: 0; padding: 3px 8px; border-radius: 4px; cursor: pointer; }
        .gd-blink { animation: gd-blink 4.5s infinite; }
        @keyframes gd-blink { 0%, 94%, 100% { transform: scaleY(1); } 96% { transform: scaleY(0.1); } }
        @keyframes gd-pulse { 50% { opacity: .3; } }
        @media (prefers-reduced-motion: reduce) { .gd-blink, .gd-dot { animation: none; } }
      `}</style>

      {isYou ? (
        <>
          <video ref={videoRef} autoPlay muted playsInline aria-label="Your camera preview" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", display: cam.status === "on" ? "block" : "none" }} />
          {cam.status !== "on" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", background: "#1e293b", color: "#e2e8f0" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#334155", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "16px" }}>{initials}</div>
              <div style={{ fontSize: "11px", opacity: 0.85, textAlign: "center", padding: "0 8px" }}>
                {cam.status === "requesting" ? "Starting camera…" : cam.status === "denied" ? "Camera blocked or unavailable" : "Camera is off"}
              </div>
            </div>
          )}
          <button type="button" className="gd-cambtn" onClick={() => (cam.status === "on" ? cam.stop() : void cam.start())} title="Your video stays on this device — it is not recorded or uploaded.">
            {cam.status === "on" ? "Camera off" : "Camera on"}
          </button>
        </>
      ) : (
        <Avatar slot={slot} active={active} levelRef={levelRef} />
      )}

      {live && (
        <div className="gd-badge">
          <span className="gd-dot" />
          {isYou ? "Listening" : "Speaking"}
        </div>
      )}
      <div className="gd-cap">
        <b>{name}</b>
        <span>{role}</span>
      </div>
    </div>
  );
}
