"use client";

// Round 2 result screen: scores per parameter (out of 10), the automatic discussion metrics and
// the full transcript with the student's turns highlighted. Scores and answers only: no overall
// summary, no suggestions and no readiness / pass-fail label (those belong to the final report).

export type GdParameterScores = Record<string, number>;
export type GdMetrics = {
  speaking_time_share: number;
  student_turns: number;
  interruptions_made: number;
  interruptions_received: number;
  references_to_others: number;
  filler_words: number;
  opened_discussion: boolean;
  concluded_discussion: boolean;
};
export type GdTranscriptTurn = { speaker: string; is_student: boolean; text: string; phase?: string; interrupts?: boolean };
export type GdRoundData = {
  overall_score: number;
  parameter_scores: GdParameterScores;
  payload: { topic?: string; category?: string; difficulty?: string; metrics: GdMetrics; transcript: GdTranscriptTurn[] };
};

const PARAMETER_LABELS: Record<string, string> = {
  content_relevance: "Content & relevance",
  communication_clarity: "Communication clarity",
  initiative: "Initiative",
  listening_building: "Listening & building on others",
  leadership_collaboration: "Leadership & collaboration",
  time_management_conclusion: "Time management & conclusion",
};

const yesNo = (b: boolean) => (b ? "Yes" : "No");

export function GdResultScreen({ result, onContinue, continuing = false }: { result: GdRoundData; onContinue: () => void; continuing?: boolean }) {
  const { metrics, transcript, topic } = result.payload;
  const stats: [string, string][] = [
    ["Speaking time share", `${metrics.speaking_time_share}%`],
    ["Your turns", String(metrics.student_turns)],
    ["Interruptions made", String(metrics.interruptions_made)],
    ["Interruptions received", String(metrics.interruptions_received)],
    ["Times you built on others", String(metrics.references_to_others)],
    ["Filler words", String(metrics.filler_words)],
    ["You opened the discussion", yesNo(metrics.opened_discussion)],
    ["You concluded the discussion", yesNo(metrics.concluded_discussion)],
  ];

  return (
    <div className="screen active" style={{ padding: "20px 32px", maxWidth: "980px" }}>
      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)", letterSpacing: ".04em", textTransform: "uppercase" }}>Round 2 of 3 · Group discussion</div>
      <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "2px 0 4px" }}>Round 2 result</h2>
      {topic && <p style={{ color: "var(--muted)", margin: "0 0 16px" }}>Topic: {topic}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px", alignItems: "start" }}>
        <div className="card" style={{ padding: "20px", borderRadius: "16px" }}>
          <div style={{ fontSize: "13px", color: "var(--muted)", fontWeight: 600 }}>Round 2 score</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px", margin: "4px 0 14px" }}>
            <span style={{ fontSize: "40px", fontWeight: 800 }}>{result.overall_score}</span>
            <span style={{ color: "var(--muted)" }}>/ 10</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {Object.entries(PARAMETER_LABELS).map(([key, label]) => {
              const score = result.parameter_scores[key] ?? 0;
              return (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600 }}>
                    <span>{label}</span>
                    <span>{score}/10</span>
                  </div>
                  <div style={{ height: "8px", borderRadius: "999px", background: "var(--border)", marginTop: "4px", overflow: "hidden" }} role="img" aria-label={`${label}: ${score} out of 10`}>
                    <div style={{ width: `${Math.max(0, Math.min(10, score)) * 10}%`, height: "100%", background: "var(--accent)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="card" style={{ padding: "20px", borderRadius: "16px" }}>
            <div style={{ fontWeight: 700, marginBottom: "10px" }}>Discussion metrics</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {stats.map(([label, value]) => (
                <div key={label} style={{ padding: "8px 10px", borderRadius: "10px", background: "var(--bg)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "11px", color: "var(--muted)" }}>{label}</div>
                  <div style={{ fontSize: "16px", fontWeight: 700 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: "20px", borderRadius: "16px" }}>
            <div style={{ fontWeight: 700, marginBottom: "4px" }}>Next: Round 3 · HR interview</div>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.6 }}>
              A spoken HR interview with your camera and microphone on. You continue whatever you scored here.
            </p>
            <button className="btn btn-p" style={{ width: "100%", justifyContent: "center", padding: "12px" }} onClick={onContinue} disabled={continuing}>
              {continuing ? "Preparing Round 3…" : "Continue to Round 3"}
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: "20px", borderRadius: "16px", marginTop: "16px" }}>
        <div style={{ fontWeight: 700, marginBottom: "10px" }}>Full discussion transcript</div>
        {transcript.length === 0 && <div style={{ color: "var(--muted)", fontSize: "13px" }}>No turns were recorded.</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {transcript.map((t, i) => (
            <div key={i} data-student={t.is_student ? "true" : "false"}
              style={{ padding: "8px 10px", borderRadius: "10px", background: t.is_student ? "var(--accent-l)" : "var(--bg)", border: t.is_student ? "1px solid var(--accent)" : "1px solid transparent" }}>
              <span style={{ fontWeight: 700, fontSize: "12px", color: t.is_student ? "var(--accent)" : "var(--text)" }}>
                {t.is_student ? "You" : t.speaker}{t.interrupts ? " (cut in)" : ""}:{" "}
              </span>
              <span style={{ fontSize: "13px" }}>{t.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
