"use client";

import { useUiStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type DashboardStats = {
  tests_completed: number;
  avg_accuracy: number;
  interviews_completed: number;
  streak: number;
  national_rank: number | string;
  placement_status: string;
  recent_activity?: {
    id: number;
    title: string;
    score: number;
    max_score: number;
    percentage: number;
    date: string;
  }[];
};

export function LearnerDashboard() {
  const { setActiveScreen } = useUiStore();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (user?.id) {
      api.get(`/students/${user.id}/dashboard`)
        .then(res => setStats(res.data))
        .catch(err => console.error("Failed to fetch stats", err))
        .finally(() => setLoading(false));
    }
  }, [user?.id]);
  
  const isInstitutionalStudent = user?.role === 'student' && !!user?.college_id;
  
  const hasActivity = stats?.recent_activity && stats.recent_activity.length > 0;

  const defaultChallenges = hasActivity ? [
    { subject: "Quantitative", topic: "Time & Work", defaultStatus: "Due", defaultBadge: "ba", action: "Start", btnClass: "btn-p" },
    { subject: "Logical Reasoning", topic: "Arrangements", defaultStatus: "Due", defaultBadge: "ba", action: "Start", btnClass: "btn-p" },
    { subject: "Data Interpretation", topic: "Bar Charts", defaultStatus: "Weak area", defaultBadge: "br", action: "Start", btnClass: "btn-p" },
    { subject: "Verbal / English", topic: "Reading Comp.", defaultStatus: "New", defaultBadge: "bb", action: "Start", btnClass: "btn-o" }
  ] : [
    { subject: "Quantitative", topic: "Basic Math", defaultStatus: "New", defaultBadge: "bb", action: "Start", btnClass: "btn-p" },
    { subject: "Logical Reasoning", topic: "Puzzles", defaultStatus: "New", defaultBadge: "bb", action: "Start", btnClass: "btn-p" },
    { subject: "Data Interpretation", topic: "Tables", defaultStatus: "New", defaultBadge: "bb", action: "Start", btnClass: "btn-p" },
    { subject: "Verbal / English", topic: "Grammar", defaultStatus: "New", defaultBadge: "bb", action: "Start", btnClass: "btn-o" }
  ];

  const getChallengeData = (c: typeof defaultChallenges[0]) => {
    const isDone = stats?.recent_activity?.some(act => 
      act.title.toLowerCase().includes(c.subject.toLowerCase()) || 
      act.title.toLowerCase().includes("logical re") && c.subject === "Logical Reasoning" ||
      act.title.toLowerCase().includes("quant") && c.subject === "Quantitative"
    );
    if (isDone) return { status: "Done", badge: "bg", action: "Review", btnClass: "btn-g" };
    return { status: c.defaultStatus, badge: c.defaultBadge, action: c.action, btnClass: c.btnClass };
  };

  return (
    <div className="screen active" id="screen-dash">
      <div className="hero">
        <div className="hero-tag">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10">
            <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
          </svg>
          AI operational · 91.4% model accuracy
        </div>
        <div className="hero-title">
          Fuel Your Aptitude
          <br />
          Score with AI.
        </div>
        <div className="hero-sub">
          Welcome to SkilloWait. Start a practice session to build your aptitude profile and unlock your national
          leaderboard ranking.
        </div>
        <div className="hero-acts">
          <button className="hbtn hbtn-w" onClick={() => setActiveScreen("practice")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10,8 16,12 10,16" />
            </svg>
            Start Practice
          </button>
          <button className="hbtn hbtn-gh" onClick={() => setActiveScreen("iv")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            Mock Interview
          </button>
          {isInstitutionalStudent ? (
            <button className="hbtn hbtn-gh" onClick={() => setActiveScreen("resume")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Resume Builder
            </button>
          ) : (
            <button className="hbtn hbtn-gh" onClick={() => setActiveScreen("subs")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
              Upgrade
            </button>
          )}
        </div>
      </div>
      <div className="sg">
        <div className="sc">
          <div className="si2" style={{ background: "var(--accent-l)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" width="15" height="15">
              <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
              <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
            </svg>
          </div>
          <div className="sv" id="dash-stat-tests">
            {loading ? "..." : stats?.tests_completed || 0}
          </div>
          <div className="sl">Tests Completed</div>
          <div className="sd neu">Get started below</div>
        </div>
        <div className="sc">
          <div className="si2" style={{ background: "var(--teal-l)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" width="15" height="15">
              <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
            </svg>
          </div>
          <div className="sv" id="dash-stat-acc">
            {loading ? "..." : stats?.avg_accuracy ? `${stats.avg_accuracy}%` : "—"}
          </div>
          <div className="sl">Avg Accuracy</div>
          <div className="sd neu">Complete a test</div>
        </div>
        <div className="sc">
          <div className="si2" style={{ background: "var(--amber-l)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" width="15" height="15">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
          </div>
          <div className="sv" id="dash-stat-streak">
            {loading ? "..." : stats?.streak || 0}
          </div>
          <div className="sl">Day Streak 🔥</div>
          <div className="sd neu">Start your first session</div>
        </div>
        <div className="sc">
          <div className="si2" style={{ background: "var(--purple-l)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2" width="15" height="15">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="sv" id="dash-stat-rank">
            {loading ? "..." : stats?.national_rank || "—"}
          </div>
          <div className="sl">National Rank</div>
          <div className="sd neu">Practice to unlock</div>
        </div>
        <div className="sc">
          <div className="si2" style={{ background: "var(--red-l)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" width="15" height="15">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div className="sv" id="dash-stat-speed">
            —
          </div>
          <div className="sl">Avg Speed</div>
          <div className="sd neu">Seconds / Q</div>
        </div>
      </div>
      <div className="gms">
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="card">
            <div className="ct">
              Recent Activity <span onClick={() => setActiveScreen("practice")}>View all</span>
            </div>
            <div id="dash-activity-list">
              {stats?.recent_activity?.length ? (
                stats.recent_activity.map(act => (
                  <div key={act.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
                    <div>
                      <div style={{ fontWeight: 500, color: 'var(--text)' }}>{act.title}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '4px' }}>
                        {new Date(act.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, color: act.percentage >= 70 ? 'var(--green)' : act.percentage >= 40 ? 'var(--amber)' : 'var(--red)' }}>
                        {act.percentage}%
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '4px' }}>
                        {act.score} / {act.max_score}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "28px", color: "var(--muted)", fontSize: "13px" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36" style={{ display: "block", margin: "0 auto 10px", opacity: 0.3 }}>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                  No activity yet. Start a practice session!
                </div>
              )}
            </div>
          </div>
          <div className="card">
            <div className="ct">Today&apos;s Challenges</div>
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Topic</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {defaultChallenges.map((c, i) => {
                  const data = getChallengeData(c);
                  return (
                    <tr key={i}>
                      <td>
                        <div className="tn">{c.subject}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: "12px", color: "var(--muted)" }}>{c.topic}</div>
                      </td>
                      <td>
                        <span className={`badge ${data.badge}`}>{data.status}</span>
                      </td>
                      <td>
                        <button className={`btn ${data.btnClass} btn-sm`} onClick={() => setActiveScreen("practice")}>
                          {data.action}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div
            className="card"
            style={{
              background: "linear-gradient(135deg,rgba(27,111,230,.07),rgba(108,92,231,.06))",
              borderColor: "rgba(27,111,230,.14)",
            }}
          >
            <div className="ct" style={{ fontSize: "11.5px", color: "var(--accent)" }}>
              AI Recommendation
            </div>
            <div style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.62, marginBottom: "12px" }}>
              {hasActivity 
                ? "Your Data Interpretation accuracy dropped 12% this week. Practise bar chart questions today to recover."
                : "Welcome! Take your first assessment to unlock personalized, AI-driven insights and recommendations to improve your skills."}
            </div>
            <button className="btn btn-p btn-sm" onClick={() => setActiveScreen("practice")}>
              {hasActivity ? "Train Now" : "Take First Test"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
