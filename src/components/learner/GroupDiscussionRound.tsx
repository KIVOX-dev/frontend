"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { ParticipantTile } from "./GdTiles";
import { GdComposer } from "./GdComposer";

// Round 2: group discussion with four AI participants. The server decides who speaks and writes
// each line (POST /mock-sessions/:id/gd/turn); this component plays it with Google voices
// (POST /tts), captures the student by mic or text, and records the transcript for scoring.

const PREP_SECONDS = 120;
const DISCUSSION_SECONDS = 14 * 60; // must match TOTAL_MS in node-api mockGd.service.js
const CLOSING_SECONDS = 60;
const QUIET_BEFORE_BOT_MS = 2500; // pause so bots never talk over each other or the student

const BOTS = [
  { slot: "bot0", name: "Kiran", role: "Dominator" },
  { slot: "bot1", name: "Deep", role: "Fact Quoter" },
  { slot: "bot2", name: "Sasi", role: "Off-topic Drifter" },
  { slot: "bot3", name: "Ari", role: "Mediator" },
] as const;

const CATEGORIES = [
  { id: "", label: "Any category" },
  { id: "current_affairs", label: "Current affairs" },
  { id: "abstract", label: "Abstract" },
  { id: "case_study", label: "Case study" },
  { id: "tech_business", label: "Tech & business" },
];
const DIFFICULTIES = ["easy", "medium", "hard"] as const;

type Turn = {
  speaker: string;
  is_student: boolean;
  text: string;
  phase: "prep" | "discussion" | "closing";
  at_ms: number;
  duration_ms: number;
  interrupts: boolean;
  interrupted_student: boolean;
  references_other: boolean;
};
type Topic = { category: string; difficulty: string; topic: string };
type BotInfo = { slot: string; name: string; id: string };
type TurnReply =
  | { action: "wait" }
  | { action: "speak"; bot: BotInfo; phase: string; text: string };
type InterruptReply = { interrupt: false } | { interrupt: true; bot: BotInfo; text: string };

export type GdRoundResult = Record<string, unknown>;

// Minimal Web Speech typing (not in lib.dom for all targets).
type Recognizer = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};
function newRecognizer(): Recognizer | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognizer; webkitSpeechRecognition?: new () => Recognizer };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

const clock = (s: number) => `${Math.floor(Math.max(s, 0) / 60)}:${String(Math.max(s, 0) % 60).padStart(2, "0")}`;
const wordCount = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);

export function GroupDiscussionRound({
  sessionId,
  studentName,
  onComplete,
  onExit,
}: {
  sessionId: string;
  studentName: string;
  onComplete: (result: GdRoundResult) => void;
  onExit: () => void;
}) {
  const [phase, setPhase] = useState<"pick" | "prep" | "discussion" | "closing" | "submitting">("pick");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("medium");
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [notes, setNotes] = useState("");
  const [prepLeft, setPrepLeft] = useState(PREP_SECONDS);
  const [elapsed, setElapsed] = useState(0);
  const [closingLeft, setClosingLeft] = useState(CLOSING_SECONDS);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [typed, setTyped] = useState("");
  const [micSupported] = useState(() => newRecognizer() !== null);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);

  const turnsRef = useRef<Turn[]>([]);
  const phaseRef = useRef(phase);
  const topicRef = useRef<Topic | null>(null);
  const startRef = useRef(0);
  const lastActivityRef = useRef(0);
  const lastStudentEndRef = useRef(0);
  const nextAskAtRef = useRef(0);
  const busyRef = useRef(false);
  const closingDoneRef = useRef(false);
  const closingEndsAtRef = useRef(0);
  const lastInterruptRef = useRef(0);
  const lastInterruptCheckRef = useRef(0);
  const speakStartRef = useRef(0);
  const bargedInRef = useRef(false);
  // Whatever is currently speaking: an <audio> element or a Web Audio buffer wrapper.
  const audioRef = useRef<{ paused: boolean; pause: () => void } | null>(null);
  // Loudness (0..1) of the voice being played, read by the avatar tiles to move the mouth; -1 = no
  // audio to analyse (browser voice), so the tile uses a speech-like rhythm instead.
  const levelRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const recRef = useRef<Recognizer | null>(null);
  const finalTextRef = useRef("");
  const interimRef = useRef(""); // words still being recognised: kept when the student releases early
  const submittedRef = useRef(false);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const addTurn = useCallback((t: Turn) => {
    turnsRef.current = [...turnsRef.current, t];
    setTurns(turnsRef.current);
  }, []);

  const stopAudio = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  // Running Web Audio context, or null when the browser won't give one (then we use <audio>).
  const getCtx = useCallback(async (): Promise<AudioContext | null> => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      const ctx = audioCtxRef.current ?? new Ctx();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();
      return ctx.state === "running" ? ctx : null;
    } catch {
      return null;
    }
  }, []);

  // Plays decoded audio through an analyser; the analyser's loudness drives the avatar's mouth.
  const playBuffer = useCallback((ctx: AudioContext, buffer: AudioBuffer) => new Promise<void>((resolve) => {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    const handle = {
      paused: false,
      pause() {
        this.paused = true;
        try { source.stop(); } catch { /* not started / already stopped */ }
      },
    };
    audioRef.current = handle;
    const data = new Uint8Array(analyser.fftSize);
    let raf = 0;
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i += 1) {
        const d = (data[i] - 128) / 128;
        sum += d * d;
      }
      levelRef.current = Math.min(1, Math.sqrt(sum / data.length) * 4.5);
      raf = requestAnimationFrame(tick);
    };
    source.onended = () => {
      handle.paused = true;
      cancelAnimationFrame(raf);
      levelRef.current = 0;
      try { source.disconnect(); analyser.disconnect(); } catch { /* already gone */ }
      resolve();
    };
    raf = requestAnimationFrame(tick);
    source.start();
  }), []);

  // Fallback player: a plain <audio> element (no loudness metering, so the mouth uses a rhythm).
  const playElement = useCallback((blob: Blob) => new Promise<void>((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([blob], { type: "audio/mpeg" }));
    const audio = new Audio(url);
    audioRef.current = audio;
    levelRef.current = -1;
    const done = () => { levelRef.current = 0; URL.revokeObjectURL(url); };
    audio.onended = () => { done(); resolve(); };
    audio.onpause = () => { done(); resolve(); }; // stopAudio() (the student talked over the bot)
    audio.onerror = () => { done(); reject(new Error(`media error ${audio.error?.code ?? "?"}`)); };
    audio.play().catch((e) => { done(); reject(e); });
  }), []);

  // Plays one bot line with its own Google voice. If that fails for ANY reason (service error,
  // autoplay blocked, undecodable audio) it falls back to the browser voice and says why, so a
  // silent room is never a mystery.
  const playLine = useCallback(async (slot: string, text: string) => {
    try {
      const res = await api.post("/tts", { voice: slot, text }, { responseType: "blob" });
      const raw = res.data as Blob;
      const bytes = await raw.arrayBuffer();
      // What actually arrived, so a failure is diagnosable from the message alone.
      const head = Array.from(new Uint8Array(bytes.slice(0, 4))).map((b) => b.toString(16).padStart(2, "0")).join(" ");
      const facts = `${bytes.byteLength} bytes, ${raw.type || "no content-type"}, starts ${head || "—"}`;
      if (bytes.byteLength < 128) throw new Error(`the server sent empty audio (${facts})`);
      if (/^(text\/|application\/json)/.test(raw.type)) throw new Error(`the server sent ${raw.type} instead of audio (${facts})`);

      let played = false;
      // 1) Web Audio: decodes by content (ignores the label) and gives exact loudness for lip-sync.
      try {
        const ctx = await getCtx();
        if (ctx) {
          const buffer = await ctx.decodeAudioData(bytes.slice(0));
          await playBuffer(ctx, buffer);
          played = true;
        }
      } catch (e) {
        console.warn("Web Audio decode failed, trying <audio>", e);
      }
      // 2) Plain <audio> element.
      if (!played) {
        try {
          await playElement(raw);
          played = true;
        } catch (e) {
          console.warn("<audio> playback failed", e);
        }
      }
      if (!played) throw new Error(`the audio could not be decoded (${facts})`);
      setVoiceNote(null);
      return;
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      setVoiceNote(
        status
          ? `Google voice unavailable (error ${status}). Using your browser's voice instead.`
          : `Couldn't play the Google voice (${err instanceof Error ? err.message : "unknown error"}). Using your browser's voice instead.`
      );
    }
    await new Promise<void>((resolve) => {
      const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
      if (!synth) {
        setVoiceNote("No voice is available in this browser. Lines are shown as text only.");
        return resolve();
      }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-IN";
      levelRef.current = -1; // nothing to analyse: tiles animate the mouth with a speech-like rhythm
      u.onend = () => { levelRef.current = 0; resolve(); };
      u.onerror = () => { levelRef.current = 0; resolve(); };
      synth.speak(u);
    });
  }, [getCtx, playBuffer, playElement]);

  const botSpeak = useCallback(
    async (bot: BotInfo, text: string, opts: { phase: string; interrupts?: boolean }) => {
      const started = Date.now();
      setSpeaking(bot.slot);
      bargedInRef.current = false;
      await playLine(bot.slot, text);
      setSpeaking(null);
      const now = Date.now();
      addTurn({
        speaker: bot.name,
        is_student: false,
        text,
        phase: opts.phase === "closing" ? "closing" : "discussion",
        at_ms: started - startRef.current,
        duration_ms: now - started,
        interrupts: Boolean(opts.interrupts),
        interrupted_student: Boolean(opts.interrupts),
        references_other: false,
      });
      lastActivityRef.current = now;
    },
    [addTurn, playLine]
  );

  // ---- student input -------------------------------------------------------------------------
  const commitStudent = useCallback(
    (text: string, durationMs: number, interrupts = false) => {
      const clean = text.trim();
      if (!clean) return;
      const now = Date.now();
      addTurn({
        speaker: "You",
        is_student: true,
        text: clean,
        phase: phaseRef.current === "closing" ? "closing" : "discussion",
        at_ms: now - durationMs - startRef.current,
        duration_ms: durationMs,
        interrupts,
        interrupted_student: false,
        references_other: false,
      });
      lastStudentEndRef.current = now;
      lastActivityRef.current = now;
    },
    [addTurn]
  );

  const stopMic = useCallback(
    (commit: boolean) => {
      const rec = recRef.current;
      recRef.current = null;
      if (!rec) return;
      rec.onend = null;
      rec.onresult = null;
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
      setListening(false);
      const text = `${finalTextRef.current} ${interimRef.current}`.trim();
      interimRef.current = "";
      setInterim("");
      if (commit) commitStudent(text, Date.now() - speakStartRef.current, bargedInRef.current);
      finalTextRef.current = "";
      bargedInRef.current = false;
    },
    [commitStudent]
  );

  const startMic = (): boolean => {
    if (recRef.current || phaseRef.current === "prep") return false;
    const rec = newRecognizer();
    if (!rec) {
      toast.warning("Voice input isn't supported in this browser. Please type your points.");
      return false;
    }
    // Student talking over a bot: cut the bot off and record it as an interruption made.
    if (audioRef.current && !audioRef.current.paused) {
      stopAudio();
      bargedInRef.current = true;
    }
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-IN";
    finalTextRef.current = "";
    interimRef.current = "";
    speakStartRef.current = Date.now();
    rec.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const r = e.results[i];
        if (r.isFinal) finalTextRef.current = `${finalTextRef.current} ${r[0].transcript}`.trim();
        else live += r[0].transcript;
      }
      interimRef.current = live;
      setInterim(live);
    };
    rec.onend = () => {
      if (recRef.current === rec) stopMic(true); // browser ended on its own (long silence)
    };
    rec.onerror = () => {
      if (recRef.current === rec) stopMic(true);
    };
    recRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      recRef.current = null;
      setListening(false);
      return false;
    }
    return true;
  };

  const sendTyped = () => {
    if (!typed.trim()) return;
    if (audioRef.current && !audioRef.current.paused) {
      stopAudio();
      bargedInRef.current = true;
    }
    // Typed turns have no real duration: estimate from word count so airtime share stays sensible.
    commitStudent(typed, Math.max(2000, wordCount(typed) * 400), bargedInRef.current);
    bargedInRef.current = false;
    setTyped("");
  };

  // ---- topic + phases ------------------------------------------------------------------------
  const pickTopic = async (random: boolean) => {
    setLoadingTopic(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      params.set("difficulty", difficulty);
      if (random) params.set("random", "true");
      const res = await api.get(`/mock-sessions/gd/topics?${params.toString()}`);
      const data = res.data as { topic?: Topic; topics?: Topic[] };
      const chosen = data.topic ?? data.topics?.[Math.floor(Math.random() * (data.topics?.length || 1))];
      if (!chosen) return toast.warning("No topic found for that choice. Try another.");
      topicRef.current = chosen;
      setTopic(chosen);
      setPrepLeft(PREP_SECONDS);
      setPhase("prep");
    } catch {
      toast.warning("Couldn't load a topic. Please try again.");
    } finally {
      setLoadingTopic(false);
    }
  };

  const beginDiscussion = useCallback(() => {
    startRef.current = Date.now();
    lastActivityRef.current = Date.now();
    lastStudentEndRef.current = Date.now();
    nextAskAtRef.current = 0;
    setPhase("discussion");
  }, []);

  useEffect(() => {
    if (phase !== "prep") return;
    const t = setInterval(() => setPrepLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase]);
  useEffect(() => {
    if (phase === "prep" && prepLeft <= 0) beginDiscussion();
  }, [phase, prepLeft, beginDiscussion]);

  const finish = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    stopMic(true);
    stopAudio();
    setPhase("submitting");
    try {
      const t = topicRef.current;
      const res = await api.post(`/mock-sessions/${sessionId}/rounds/2`, {
        topic: t?.topic ?? "Group discussion",
        category: t?.category ?? "",
        difficulty: t?.difficulty ?? "medium",
        turns: turnsRef.current,
        duration_seconds: Math.round((Date.now() - startRef.current) / 1000),
      });
      onComplete(res.data.round as GdRoundResult);
    } catch {
      submittedRef.current = false;
      setPhase("closing");
      toast.warning("Couldn't save the discussion. Tap Finish to try again.");
    }
  }, [onComplete, sessionId, stopAudio, stopMic]);

  const askBots = useCallback(async () => {
    const now = Date.now();
    busyRef.current = true;
    try {
      const res = await api.post(`/mock-sessions/${sessionId}/gd/turn`, {
        topic: topicRef.current?.topic ?? "",
        turns: turnsRef.current,
        elapsed_ms: now - startRef.current,
        student_silent_ms: now - lastStudentEndRef.current,
        student_name: studentName,
        closing_done: closingDoneRef.current,
      });
      const reply = res.data as TurnReply;
      if (reply.action === "wait") {
        nextAskAtRef.current = Date.now() + 4000;
        return;
      }
      if (reply.phase === "closing") {
        closingDoneRef.current = true;
        closingEndsAtRef.current = Date.now() + CLOSING_SECONDS * 1000;
        setPhase("closing");
      }
      await botSpeak(reply.bot, reply.text, { phase: reply.phase });
    } catch {
      nextAskAtRef.current = Date.now() + 8000; // transient failure: back off, keep the room alive
    } finally {
      busyRef.current = false;
    }
  }, [botSpeak, sessionId, studentName]);

  const checkInterrupt = useCallback(async () => {
    busyRef.current = true;
    try {
      const res = await api.post(`/mock-sessions/${sessionId}/gd/interrupt-check`, {
        topic: topicRef.current?.topic ?? "",
        turns: turnsRef.current,
        student_speaking_ms: Date.now() - speakStartRef.current,
        ms_since_last_interrupt: lastInterruptRef.current ? Date.now() - lastInterruptRef.current : Number.MAX_SAFE_INTEGER,
      });
      const reply = res.data as InterruptReply;
      if (reply.interrupt && recRef.current) {
        lastInterruptRef.current = Date.now();
        stopMic(true); // keep what the student said so far
        await botSpeak(reply.bot, reply.text, { phase: "discussion", interrupts: true });
      }
    } catch {
      /* interruptions are optional flavour; ignore failures */
    } finally {
      busyRef.current = false;
    }
  }, [botSpeak, sessionId, stopMic]);

  // The room's heartbeat: timers, turn-taking, interruptions.
  useEffect(() => {
    if (phase !== "discussion" && phase !== "closing") return;
    const t = setInterval(() => {
      const now = Date.now();
      setElapsed(Math.floor((now - startRef.current) / 1000));
      if (phaseRef.current === "closing") {
        const left = Math.ceil((closingEndsAtRef.current - now) / 1000);
        setClosingLeft(left);
        if (left <= 0) void finish();
        return;
      }
      if (busyRef.current) return;
      const studentTalking = Boolean(recRef.current);
      if (studentTalking) {
        if (now - speakStartRef.current > 20000 && now - lastInterruptCheckRef.current > 5000) {
          lastInterruptCheckRef.current = now;
          void checkInterrupt();
        }
        return;
      }
      if (now < nextAskAtRef.current || now - lastActivityRef.current < QUIET_BEFORE_BOT_MS) return;
      void askBots();
    }, 1000);
    return () => clearInterval(t);
  }, [phase, askBots, checkInterrupt, finish]);

  useEffect(
    () => () => {
      stopAudio();
      const rec = recRef.current;
      recRef.current = null;
      if (rec) {
        rec.onend = null;
        try {
          rec.stop();
        } catch {
          /* ignore */
        }
      }
    },
    [stopAudio]
  );

  const transcriptEnd = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    transcriptEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, interim]);

  // ---- render --------------------------------------------------------------------------------
  const card = { background: "var(--surface, #fff)", border: "1px solid var(--border)", borderRadius: "16px" } as const;

  if (phase === "pick") {
    return (
      <div className="screen active" style={{ padding: "20px 32px", maxWidth: "820px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 700 }}>Round 2 · Group Discussion</h2>
        <p style={{ color: "var(--muted)", margin: "4px 0 16px" }}>
          You and four AI participants discuss a topic. 2 min to prepare, up to 14 min of discussion, then a 1 min closing summary.
        </p>
        <div className="card" style={{ ...card, padding: "20px" }}>
          <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: "8px" }}>Category</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
            {CATEGORIES.map((c) => (
              <button key={c.id} type="button" onClick={() => setCategory(c.id)} aria-pressed={category === c.id}
                style={{ padding: "6px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: `1px solid ${category === c.id ? "var(--accent)" : "var(--border)"}`, background: category === c.id ? "var(--accent-l)" : "transparent", color: category === c.id ? "var(--accent)" : "var(--muted)" }}>
                {c.label}
              </button>
            ))}
          </div>
          <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: "8px" }}>Difficulty</div>
          <div style={{ display: "flex", gap: "6px", marginBottom: "18px" }}>
            {DIFFICULTIES.map((d) => (
              <button key={d} type="button" onClick={() => setDifficulty(d)} aria-pressed={difficulty === d}
                style={{ padding: "6px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, textTransform: "capitalize", cursor: "pointer", border: `1px solid ${difficulty === d ? "var(--accent)" : "var(--border)"}`, background: difficulty === d ? "var(--accent-l)" : "transparent", color: difficulty === d ? "var(--accent)" : "var(--muted)" }}>
                {d}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button className="btn btn-p" disabled={loadingTopic} onClick={() => pickTopic(true)}>
              {loadingTopic ? "Picking…" : "Give me a random topic"}
            </button>
            <button className="btn btn-o" onClick={onExit}>Exit</button>
          </div>
        </div>
        <div className="card" style={{ ...card, padding: "16px 20px", marginTop: "14px" }}>
          <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: "8px" }}>Your group</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "8px" }}>
            {BOTS.map((b) => (
              <div key={b.slot} style={{ padding: "8px 10px", borderRadius: "10px", background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 700, fontSize: "13px" }}>{b.name}</div>
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>{b.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "prep") {
    return (
      <div className="screen active" style={{ padding: "20px 32px", maxWidth: "820px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 700 }}>Preparation</h2>
          <span style={{ fontWeight: 700, fontSize: "20px", fontVariantNumeric: "tabular-nums" }}>{clock(prepLeft)}</span>
        </div>
        <div className="card" style={{ ...card, padding: "20px" }}>
          <div style={{ fontSize: "12px", color: "var(--muted)", textTransform: "capitalize" }}>
            {topic?.category.replace("_", " ")} · {topic?.difficulty}
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, margin: "6px 0 14px" }}>{topic?.topic}</div>
          <label htmlFor="gd-notes" style={{ fontWeight: 600, fontSize: "13px" }}>Your notes (private, not scored)</label>
          <textarea id="gd-notes" className="fi" rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Jot down 2–3 points and an example…" style={{ marginTop: "6px" }} />
          <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
            <button className="btn btn-p" onClick={beginDiscussion}>Start discussion now</button>
            <button className="btn btn-o" onClick={onExit}>Exit</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "submitting") {
    return <div className="screen active" style={{ padding: "60px", textAlign: "center", color: "var(--muted)" }}>Scoring your discussion…</div>;
  }

  const inClosing = phase === "closing";
  const remaining = DISCUSSION_SECONDS - elapsed;
  return (
    <div className="screen active" style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "12px", color: "var(--muted)" }}>Round 2 · Group Discussion{inClosing ? " · Closing summary" : ""}</div>
          <div style={{ fontWeight: 700, fontSize: "16px" }}>{topic?.topic}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontWeight: 700, fontSize: "20px", fontVariantNumeric: "tabular-nums" }}>
            {inClosing ? clock(closingLeft) : clock(remaining)}
          </span>
          <button type="button" className="btn btn-o" onClick={() => void playLine("bot3", "Hello. This is a voice check.")}>Test voice</button>
          <button className="btn btn-o" onClick={() => void finish()}>{inClosing ? "Finish" : "End discussion"}</button>
        </div>
      </div>

      <div className="gd-grid">
        <style>{`
          .gd-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; width: 100%; max-width: calc(5 * (26vh * 4 / 3) + 40px); margin: 0 auto; }
          @media (max-width: 760px) { .gd-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); max-width: none; gap: 8px; } }
        `}</style>
        {[...BOTS.map((b) => ({ key: b.slot, name: b.name, role: b.role })), { key: "you", name: "You", role: studentName }].map((p) => (
          <ParticipantTile
            key={p.key}
            slot={p.key}
            name={p.name}
            role={p.role}
            isYou={p.key === "you"}
            active={speaking === p.key}
            listening={listening}
            levelRef={levelRef}
          />
        ))}
      </div>

      {voiceNote && (
        <div role="status" style={{ padding: "8px 12px", borderRadius: "10px", background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", fontSize: "12.5px" }}>
          🔈 {voiceNote}
        </div>
      )}
      <div className="card" style={{ ...card, flex: 1, minHeight: "200px", overflowY: "auto", padding: "14px" }} aria-live="polite">
        {turns.length === 0 && <div style={{ color: "var(--muted)", fontSize: "13px" }}>Start the discussion by sharing your opening view, or the moderator will begin shortly.</div>}
        {turns.map((t, i) => (
          <div key={i} style={{ marginBottom: "8px", padding: "8px 10px", borderRadius: "10px", background: t.is_student ? "var(--accent-l)" : "var(--bg)" }}>
            <span style={{ fontWeight: 700, fontSize: "12px", color: t.is_student ? "var(--accent)" : "var(--text)" }}>{t.speaker}{t.interrupts ? " (cut in)" : ""}: </span>
            <span style={{ fontSize: "13px" }}>{t.text}</span>
            {!t.is_student && (
              <button type="button" aria-label={`Replay ${t.speaker}`} onClick={() => void playLine(BOTS.find((b) => b.name === t.speaker)?.slot ?? "bot3", t.text)}
                style={{ all: "unset", cursor: "pointer", marginLeft: "8px", fontSize: "12px", color: "var(--accent)" }}>🔊</button>
            )}
          </div>
        ))}
        {interim && <div style={{ fontSize: "13px", color: "var(--muted)", fontStyle: "italic" }}>You: {interim}</div>}
        <div ref={transcriptEnd} />
      </div>

      <GdComposer
        typed={typed}
        setTyped={setTyped}
        onSendTyped={sendTyped}
        micSupported={micSupported}
        listening={listening}
        onMicStart={startMic}
        onMicStop={stopMic}
      />
    </div>
  );
}
