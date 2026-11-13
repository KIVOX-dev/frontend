"use client";

import { useEffect, useRef, useState } from "react";

// WhatsApp-style message bar for the group discussion.
//  - Empty text box: a round mic button. HOLD it to record and release to send;
//    slide left to cancel; a quick TAP locks the recording on (then use the bin
//    to cancel or the send arrow to send).
//  - Text typed: the mic turns into a send arrow.
//  - While recording the box becomes: [bin] ● 0:07  ▂▅▇▃▂ … ‹ slide to cancel.
// Speech-to-text itself stays in GroupDiscussionRound (the browser's
// SpeechRecognition); this component only drives start / stop(commit) and shows
// a live level meter taken from the microphone.

const CANCEL_DRAG_PX = 90;
const TAP_MS = 400;
const BARS = 28;

const Mic = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);
const Send = () => (
  <svg viewBox="0 0 24 24" width="21" height="21" fill="currentColor" aria-hidden="true">
    <path d="M3.4 20.4 21 12 3.4 3.6 3.3 10l12 2-12 2z" />
  </svg>
);
const Bin = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </svg>
);

const clock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

type Mode = "idle" | "held" | "locked";

export function GdComposer({
  typed,
  setTyped,
  onSendTyped,
  micSupported,
  listening,
  onMicStart,
  onMicStop,
}: {
  typed: string;
  setTyped: (v: string) => void;
  onSendTyped: () => void;
  micSupported: boolean;
  listening: boolean;
  /** Returns false when recording could not start. */
  onMicStart: () => boolean;
  onMicStop: (commit: boolean) => void;
}) {
  const [mode, setMode] = useState<Mode>("idle");
  const [drag, setDrag] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0.06));
  const downAt = useRef(0);
  const startX = useRef(0);
  const modeRef = useRef<Mode>("idle");
  modeRef.current = mode;

  const setBoth = (m: Mode) => {
    modeRef.current = m;
    setMode(m);
  };

  // The recognizer can end by itself (long silence): leave recording mode with it.
  useEffect(() => {
    if (!listening && modeRef.current !== "idle") {
      setBoth("idle");
      setDrag(0);
    }
  }, [listening]);

  // Timer + live level meter while recording.
  useEffect(() => {
    if (mode === "idle") return undefined;
    const began = Date.now();
    setElapsed(0);
    setLevels(Array(BARS).fill(0.06));
    const timer = setInterval(() => setElapsed(Date.now() - began), 250);

    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let raf = 0;
    let iv: ReturnType<typeof setInterval> | undefined;
    let lastPush = 0;
    let cancelled = false;
    const push = (v: number) => setLevels((prev) => [...prev.slice(1), Math.max(0.06, Math.min(1, v))]);

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        ctx = new Ctx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const buf = new Uint8Array(analyser.fftSize);
        const tick = (t: number) => {
          if (t - lastPush > 55) {
            lastPush = t;
            analyser.getByteTimeDomainData(buf);
            let sum = 0;
            for (let i = 0; i < buf.length; i += 1) {
              const d = (buf[i] - 128) / 128;
              sum += d * d;
            }
            push(Math.sqrt(sum / buf.length) * 5);
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        // No meter available: show a gentle idle wave instead of nothing.
        iv = setInterval(() => push(0.15 + Math.random() * 0.25), 90);
      }
    })();

    return () => {
      cancelled = true;
      clearInterval(timer);
      cancelAnimationFrame(raf);
      if (iv) clearInterval(iv);
      stream?.getTracks().forEach((t) => t.stop());
      void ctx?.close();
    };
  }, [mode]);

  const begin = (m: Mode) => {
    if (!onMicStart()) return false;
    setBoth(m);
    return true;
  };
  const finish = (commit: boolean) => {
    setBoth("idle");
    setDrag(0);
    onMicStop(commit);
  };

  const hasText = typed.trim().length > 0;
  const recording = mode !== "idle";

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || recording) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    downAt.current = Date.now();
    startX.current = e.clientX;
    begin("held");
  };
  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (modeRef.current !== "held") return;
    const dx = Math.min(0, e.clientX - startX.current);
    setDrag(dx);
    if (dx < -CANCEL_DRAG_PX) finish(false);
  };
  const onPointerUp = () => {
    if (modeRef.current !== "held") return;
    if (Date.now() - downAt.current < TAP_MS) {
      setBoth("locked"); // quick tap: keep recording hands-free
      setDrag(0);
    } else {
      finish(true);
    }
  };
  const onPointerCancel = () => {
    if (modeRef.current === "held") finish(false);
  };

  const round: React.CSSProperties = {
    flex: "0 0 auto", width: "46px", height: "46px", borderRadius: "50%", border: 0, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", touchAction: "none", userSelect: "none",
    transition: "transform .12s, background .12s",
  };

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <style>{`
        .gd-pill { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; min-height: 46px; padding: 0 16px; border: 1px solid var(--border); border-radius: 24px; background: var(--surface, #fff); }
        .gd-pill input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font: inherit; font-size: 14px; color: var(--text); padding: 12px 0; }
        .gd-pill:focus-within { border-color: var(--accent); }
        .gd-rec-dot { width: 10px; height: 10px; border-radius: 50%; background: #ef4444; animation: gd-rec 1s infinite; flex: 0 0 auto; }
        @keyframes gd-rec { 50% { opacity: .25; } }
        .gd-wave { flex: 1; min-width: 0; height: 28px; display: flex; align-items: center; gap: 2px; overflow: hidden; }
        .gd-wave i { flex: 1 1 0; min-width: 2px; max-width: 4px; border-radius: 2px; background: var(--accent); }
        .gd-slide { font-size: 12.5px; color: var(--muted); white-space: nowrap; transition: opacity .1s; }
        .gd-iconbtn { border: 0; background: transparent; color: var(--muted); cursor: pointer; padding: 6px; display: flex; border-radius: 50%; }
        .gd-iconbtn:hover { color: #ef4444; background: rgba(239,68,68,.08); }
        @media (prefers-reduced-motion: reduce) { .gd-rec-dot { animation: none; } }
      `}</style>

      {recording ? (
        <div className="gd-pill" role="status" aria-label="Recording">
          {mode === "locked" && (
            <button type="button" className="gd-iconbtn" aria-label="Cancel recording" onClick={() => finish(false)}><Bin /></button>
          )}
          <span className="gd-rec-dot" />
          <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "14px", fontWeight: 600, color: "var(--text)", minWidth: "36px" }}>{clock(elapsed)}</span>
          <div className="gd-wave" aria-hidden="true">
            {levels.map((v, i) => <i key={i} style={{ height: `${Math.round(v * 100)}%` }} />)}
          </div>
          {mode === "held" && (
            <span className="gd-slide" style={{ opacity: Math.max(0.2, 1 + drag / CANCEL_DRAG_PX), transform: `translateX(${drag}px)` }}>‹ Slide to cancel</span>
          )}
        </div>
      ) : (
        <div className="gd-pill">
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSendTyped()}
            placeholder={micSupported ? "Type your point, or hold the mic to speak" : "Type your point…"}
            aria-label="Type your point"
          />
        </div>
      )}

      {hasText && !recording ? (
        <button type="button" aria-label="Send" onClick={onSendTyped} style={{ ...round, background: "var(--accent)" }}><Send /></button>
      ) : mode === "locked" ? (
        <button type="button" aria-label="Send recording" onClick={() => finish(true)} style={{ ...round, background: "var(--accent)" }}><Send /></button>
      ) : micSupported ? (
        <button
          type="button"
          aria-label={recording ? "Recording — release to send" : "Hold to record, release to send. Tap to record hands-free."}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            // Keyboard: Space/Enter starts a hands-free recording (then Send or the bin).
            if ((e.key === " " || e.key === "Enter") && !e.repeat) {
              e.preventDefault();
              begin("locked");
            }
          }}
          style={{ ...round, background: recording ? "#ef4444" : "var(--accent)", transform: recording ? `scale(1.18) translateX(${drag * 0.4}px)` : "none" }}
        >
          <Mic />
        </button>
      ) : (
        <button type="button" aria-label="Send" onClick={onSendTyped} disabled style={{ ...round, background: "var(--border)" }}><Send /></button>
      )}
    </div>
  );
}
