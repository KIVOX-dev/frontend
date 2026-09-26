"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/authStore";
import { companyLogoFor } from "@/lib/companyLogos";
import { companyTestName, loadCompanyBankQuestions, type McqQuestion } from "@/lib/companyTestBanks";

const SECONDS_PER_QUESTION = 90;
const QUESTION_COUNT = 20;

export type McqRoundResult = { correct: number; total: number; percentage: number };

type Source = "ai" | "bank";

const formatClock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/**
 * Round 1 of the mock interview: a timed written MCQ test for the chosen
 * role at the chosen company. Questions come from the AI service
 * (POST /interviews/generate-mcq); when it can't generate them, the
 * company's own aptitude pattern is drawn from the offline banks instead.
 * The score is saved to the student's test history like any other test.
 */
export function InterviewMcqRound({
  role,
  company,
  onContinue,
  onExit,
  continuing = false,
}: {
  role: string;
  company: string;
  /** True while Round 2's questions are being fetched. */
  continuing?: boolean;
  onContinue: (result: McqRoundResult) => void;
  onExit: () => void;
}) {
  const { user } = useAuthStore();
  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [source, setSource] = useState<Source>("ai");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const startedAt = useRef(0);
  // submit() runs from the timer too; read answers through a ref so the
  // countdown effect doesn't restart on every click.
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const logo = companyLogoFor(company);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    setSubmitted(false);
    setAnswers({});
    setIdx(0);
    setReviewOpen(false);
    let qs: McqQuestion[] = [];
    let from: Source = "ai";
    try {
      const res = await api.post<{ source: "ai" | "unavailable"; questions: McqQuestion[] }>(
        `/interviews/generate-mcq?role=${encodeURIComponent(role)}&company=${encodeURIComponent(company)}&count=${QUESTION_COUNT}`,
        undefined,
        // A 20-question set takes the model longer than the 30s default.
        { timeout: 60_000 },
      );
      if (res.data?.source === "ai" && res.data.questions?.length >= 5) qs = res.data.questions;
    } catch (err) {
      console.error("MCQ generation failed, using company banks", err);
    }
    if (qs.length === 0) {
      from = "bank";
      try {
        qs = await loadCompanyBankQuestions(company);
      } catch (err) {
        console.error("Failed to load company question banks", err);
      }
    }
    if (qs.length === 0) {
      setLoadError(true);
      setLoading(false);
      return;
    }
    setQuestions(qs);
    setSource(from);
    setTimeLeft(qs.length * SECONDS_PER_QUESTION);
    startedAt.current = Date.now();
    setLoading(false);
  }, [role, company]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);
    const given = answersRef.current;
    const correct = questions.filter((q) => given[q.id] === q.correct_answer).length;
    const percentage = Math.round((correct / questions.length) * 1000) / 10;
    if (!user?.id) return;
    try {
      await api.post(`/students/${user.id}/tests`, {
        test_name: `${company} · ${role} — Interview Round 1`,
        score: correct,
        max_score: questions.length,
        percentage,
        time_taken_seconds: Math.round((Date.now() - startedAt.current) / 1000),
      });
    } catch (err) {
      console.error("Failed to save Round 1 result", err);
      toast.warning("Your score was calculated, but saving it to your history failed.");
    }
  }, [submitted, questions, user?.id, company, role]);

  // One overall countdown, auto-submitting at zero.
  useEffect(() => {
    if (loading || submitted || questions.length === 0) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          submit();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [loading, submitted, questions.length, submit]);

  const sections = useMemo(() => {
    const out: { name: string; start: number; count: number }[] = [];
    questions.forEach((q, i) => {
      const last = out[out.length - 1];
      if (last && last.name === q.section) last.count++;
      else out.push({ name: q.section, start: i, count: 1 });
    });
    return out;
  }, [questions]);

  const answeredCount = Object.keys(answers).length;

  const confirmSubmit = () => {
    const left = questions.length - answeredCount;
    if (left > 0 && !window.confirm(`${left} question${left === 1 ? " is" : "s are"} unanswered. Submit Round 1 anyway?`)) return;
    submit();
  };

  const header = (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
      {logo && (
        <div style={{ height: "44px", padding: "6px 10px", borderRadius: "10px", background: "#fff", border: "1px solid var(--border)", display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={`${company} logo`} style={{ height: "30px", width: "auto", maxWidth: "110px", objectFit: "contain" }} />
        </div>
      )}
      <div>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)", letterSpacing: ".04em", textTransform: "uppercase" }}>Round 1 of 2 · Written test</div>
        <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>
          {companyTestName(company)} · {role}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="screen active" style={{ padding: "32px 40px" }}>
        {header}
        <div className="card" style={{ marginTop: "24px", padding: "48px", textAlign: "center" }}>
          <div className="mcq-spin" style={{ width: "36px", height: "36px", margin: "0 auto 16px", borderRadius: "50%", border: "3px solid var(--accent-l)", borderTopColor: "var(--accent)" }} />
          <p style={{ fontWeight: 600, color: "var(--text)" }}>Preparing your {company} test for {role}…</p>
          <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "6px" }}>Questions follow {company}&apos;s written-test pattern plus the technical skills this role is tested on.</p>
          <style>{".mcq-spin{animation:mcqspin .8s linear infinite}@keyframes mcqspin{to{transform:rotate(360deg)}}"}</style>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="screen active" style={{ padding: "32px 40px" }}>
        {header}
        <div className="card" style={{ marginTop: "24px", padding: "40px", textAlign: "center" }}>
          <p style={{ fontWeight: 600, color: "var(--text)" }}>Failed to load test data.</p>
          <p style={{ fontSize: "13px", color: "var(--muted)", margin: "6px 0 20px" }}>Check your connection and try again.</p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button className="btn btn-p" onClick={load}>Try again</button>
            <button className="btn btn-o" onClick={onExit}>Back to setup</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Results ──
  if (submitted) {
    const correct = questions.filter((q) => answers[q.id] === q.correct_answer).length;
    const pct = Math.round((correct / questions.length) * 100);
    const wrong = questions.filter((q) => answers[q.id] !== q.correct_answer);
    const barColor = (p: number) => (p >= 60 ? "#16a34a" : p >= 35 ? "#d97706" : "#dc2626");
    return (
      <div className="screen active" style={{ padding: "32px 40px" }}>
        {header}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginTop: "24px", alignItems: "start" }}>
          <div className="card" style={{ padding: "28px" }}>
            <div style={{ fontSize: "13px", color: "var(--muted)", fontWeight: 600 }}>Round 1 score</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", margin: "6px 0 14px" }}>
              <span style={{ fontSize: "44px", fontWeight: 800, color: barColor(pct) }}>{pct}%</span>
              <span style={{ color: "var(--muted)", fontSize: "14px" }}>
                {correct} of {questions.length} correct · {answeredCount} answered
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {sections.map((s) => {
                const qs = questions.slice(s.start, s.start + s.count);
                const c = qs.filter((q) => answers[q.id] === q.correct_answer).length;
                const p = Math.round((c / qs.length) * 100);
                return (
                  <div key={s.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "5px" }}>
                      <span style={{ fontWeight: 600, color: "var(--text)" }}>{s.name}</span>
                      <span style={{ color: "var(--muted)" }}>{c}/{qs.length}</span>
                    </div>
                    <div style={{ height: "8px", borderRadius: "4px", background: "var(--border)", overflow: "hidden" }}>
                      <div style={{ width: `${p}%`, height: "100%", background: barColor(p), borderRadius: "4px", transition: "width .8s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {source === "bank" && (
              <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "16px" }}>
                This round used {companyTestName(company)}&apos;s aptitude pattern; role-specific questions weren&apos;t available.
              </p>
            )}
          </div>

          <div className="card" style={{ padding: "28px" }}>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>Next: Round 2 · Spoken interview</div>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: "6px 0 18px", lineHeight: 1.6 }}>
              10 questions for a {role} at {company}, answered out loud with 60 seconds each. Your camera and microphone stay on for this round.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button className="btn btn-p" style={{ justifyContent: "center", padding: "12px" }} onClick={() => onContinue({ correct, total: questions.length, percentage: pct })} disabled={continuing}>
                {continuing ? "Preparing Round 2…" : "Continue to Round 2"}
              </button>
              <button className="btn btn-o" style={{ justifyContent: "center" }} onClick={load}>Retake Round 1</button>
              <button className="btn" style={{ justifyContent: "center" }} onClick={onExit}>Back to setup</button>
            </div>
          </div>
        </div>

        {wrong.length > 0 && (
          <div className="card" style={{ padding: "20px 24px", marginTop: "20px" }}>
            <button
              onClick={() => setReviewOpen((o) => !o)}
              style={{ all: "unset", cursor: "pointer", display: "flex", justifyContent: "space-between", width: "100%", fontWeight: 700, color: "var(--text)" }}
              aria-expanded={reviewOpen}
            >
              Review {wrong.length} missed question{wrong.length === 1 ? "" : "s"}
              <span style={{ color: "var(--accent)", fontSize: "13px" }}>{reviewOpen ? "Hide" : "Show"}</span>
            </button>
            {reviewOpen && (
              <ol style={{ margin: "16px 0 0", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
                {wrong.map((q) => (
                  <li key={q.id} style={{ fontSize: "14px", lineHeight: 1.55 }}>
                    <div style={{ color: "var(--muted)", fontSize: "12px", fontWeight: 600 }}>{q.section}</div>
                    {q.context && <div style={{ color: "var(--muted)", fontSize: "13px" }}>{q.context}</div>}
                    <div style={{ color: "var(--text)", fontWeight: 500 }}>{q.question}</div>
                    <div style={{ marginTop: "4px" }}>
                      <span style={{ color: "#16a34a", fontWeight: 600 }}>Answer: {q.correct_answer}</span>
                      <span style={{ color: answers[q.id] ? "#dc2626" : "var(--muted)", marginLeft: "12px" }}>
                        {answers[q.id] ? `You chose: ${answers[q.id]}` : "Not answered"}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Test ──
  const q = questions[idx];
  const low = timeLeft <= 60;
  return (
    <div className="screen active" style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        {header}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "13px", color: "var(--muted)" }}>{answeredCount}/{questions.length} answered</span>
          <span
            role="timer"
            aria-label={`${formatClock(timeLeft)} left`}
            style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, fontSize: "16px", padding: "8px 14px", borderRadius: "10px", background: low ? "var(--red-l)" : "var(--accent-l)", color: low ? "var(--red)" : "var(--accent)" }}
          >
            {formatClock(timeLeft)}
          </span>
          <button className="btn btn-p" onClick={confirmSubmit}>Submit Round 1</button>
        </div>
      </div>

      {source === "bank" && (
        <div style={{ marginTop: "16px", padding: "10px 14px", borderRadius: "10px", background: "var(--amber-l)", color: "var(--amber)", fontSize: "13px", fontWeight: 600 }}>
          Role-specific questions aren&apos;t available right now, so this round uses {companyTestName(company)}&apos;s aptitude pattern.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 260px", gap: "20px", marginTop: "20px", alignItems: "start" }} className="mcq-grid">
        <div className="card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--muted)", marginBottom: "14px" }}>
            <span style={{ fontWeight: 700, color: "var(--accent)" }}>{q.section}</span>
            <span>Question {idx + 1} of {questions.length}</span>
          </div>
          {q.context && (
            <div style={{ padding: "12px 16px", background: "var(--bg)", borderRadius: "10px", marginBottom: "18px", fontSize: "14px", color: "var(--muted)", lineHeight: 1.6, borderLeft: "3px solid var(--accent)" }}>
              {q.context}
            </div>
          )}
          <h3 style={{ fontSize: "17px", fontWeight: 600, color: "var(--text)", lineHeight: 1.6, marginBottom: "20px" }}>{q.question}</h3>
          <div role="radiogroup" aria-label="Options" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {q.options.map((opt, i) => {
              const chosen = answers[q.id] === opt;
              return (
                <button
                  key={opt}
                  role="radio"
                  aria-checked={chosen}
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                  style={{ display: "flex", alignItems: "center", gap: "12px", textAlign: "left", padding: "12px 16px", borderRadius: "10px", cursor: "pointer", fontSize: "14px", color: "var(--text)", border: `1.5px solid ${chosen ? "var(--accent)" : "var(--border)"}`, background: chosen ? "var(--accent-l)" : "#fff", transition: "all .15s" }}
                >
                  <span style={{ width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", fontSize: "12px", fontWeight: 700, background: chosen ? "var(--accent)" : "var(--bg)", color: chosen ? "#fff" : "var(--muted)" }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
            <button className="btn btn-o" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}>Previous</button>
            {idx < questions.length - 1 ? (
              <button className="btn btn-p" onClick={() => setIdx((i) => i + 1)}>Next</button>
            ) : (
              <button className="btn btn-p" onClick={confirmSubmit}>Submit Round 1</button>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: "18px" }}>
          {sections.map((s) => (
            <div key={s.name} style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", marginBottom: "8px" }}>{s.name}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
                {questions.slice(s.start, s.start + s.count).map((sq, k) => {
                  const n = s.start + k;
                  const current = n === idx;
                  const done = !!answers[sq.id];
                  return (
                    <button
                      key={sq.id}
                      onClick={() => setIdx(n)}
                      aria-label={`Question ${n + 1}${done ? ", answered" : ""}`}
                      aria-current={current ? "step" : undefined}
                      style={{ height: "32px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer", border: `1.5px solid ${current ? "var(--accent)" : "var(--border)"}`, background: done ? "var(--accent)" : "#fff", color: done ? "#fff" : "var(--text)" }}
                    >
                      {n + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{"@media (max-width:900px){.mcq-grid{grid-template-columns:1fr!important}}"}</style>
    </div>
  );
}
