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
            <path d="M13 3l-7.931 9.693c-.342.418-.513.627-.514.803a.5.5 0 00.186.394c.138.11.407.11.947.11H12l-1 7 7.93-9.693c.342-.418.513-.627.514-.803a.5.5 0 00-.186-.394C19.12 10 18.85 10 18.31 10H12l1-7z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          AI operational · 91.4% model accuracy
        </div>
        <div className="hero-title">
          Fuel Your Aptitude
          <br />
          Score with AI.
        </div>
        <div className="hero-sub">
          Welcome to TalentSnaps. Start a practice session to build your aptitude profile and unlock your national
          leaderboard ranking.
        </div>
        <div className="hero-acts">
          <button className="hbtn hbtn-w" onClick={() => setActiveScreen("practice")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15.002 11.334c.333.223.5.334.558.475a.5.5 0 010 .383c-.058.14-.225.251-.559.474l-3.757 2.505c-.404.27-.606.404-.774.394a.5.5 0 01-.369-.198C10 15.234 10 14.991 10 14.505v-5.01c0-.486 0-.729.101-.862a.5.5 0 01.37-.198c.167-.01.369.125.773.394l3.758 2.505z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Start Practice
          </button>
          <button className="hbtn hbtn-gh" onClick={() => setActiveScreen("iv")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
              <path d="M3 7.2c0-1.12 0-1.68.218-2.108a2 2 0 01.874-.874C4.52 4 5.08 4 6.2 4h11.6c1.12 0 1.68 0 2.108.218a2 2 0 01.874.874C21 5.52 21 6.08 21 7.2V20l-3.324-1.662a4.161 4.161 0 00-.51-.234 2.007 2.007 0 00-.36-.085c-.139-.019-.28-.019-.561-.019H6.2c-1.12 0-1.68 0-2.108-.218a2 2 0 01-.874-.874C3 16.48 3 15.92 3 14.8V7.2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Mock Interview
          </button>
          {isInstitutionalStudent ? (
            <button className="hbtn hbtn-gh" onClick={() => setActiveScreen("resume")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                <path d="M9 17h6m-6-4h6M9 9h1m3-6H8.2c-1.12 0-1.68 0-2.108.218a2 2 0 00-.874.874C5 4.52 5 5.08 5 6.2v11.6c0 1.12 0 1.68.218 2.108a2 2 0 00.874.874C6.52 21 7.08 21 8.2 21h7.6c1.12 0 1.68 0 2.108-.218a2 2 0 00.874-.874C19 19.48 19 18.92 19 17.8V9m-6-6l6 6m-6-6v4.4c0 .56 0 .84.109 1.054a1 1 0 00.437.437C13.76 9 14.04 9 14.6 9H19" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Resume Builder
            </button>
          ) : (
            <button className="hbtn hbtn-gh" onClick={() => setActiveScreen("subs")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                <path d="M3.113 9h17.774M7.05 3.05L12 9l4.96-5.945m3.726 5.474l-3.448-5.173c-.087-.13-.13-.195-.188-.242a.5.5 0 00-.172-.092C16.807 3 16.728 3 16.572 3H7.428c-.156 0-.235 0-.306.022a.5.5 0 00-.172.092c-.057.047-.1.112-.187.242L3.314 8.53c-.113.17-.17.255-.19.346a.5.5 0 00.007.243c.025.09.086.172.209.335l8.02 10.694c.217.29.326.434.459.486a.5.5 0 00.362 0c.133-.052.242-.197.459-.486l8.02-10.694c.123-.163.184-.245.21-.335a.5.5 0 00.006-.243c-.02-.091-.077-.176-.19-.346z" strokeLinecap="round" strokeLinejoin="round" />
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
              <path d="M12 10.4V20m0-9.6c0-2.24 0-3.36-.436-4.216a4 4 0 00-1.748-1.748C8.96 4 7.84 4 5.6 4h-1c-.56 0-.84 0-1.054.109a1 1 0 00-.437.437C3 4.76 3 5.04 3 5.6v10.8c0 .56 0 .84.109 1.054a1 1 0 00.437.437C3.76 18 4.04 18 4.6 18h2.947c.54 0 .81 0 1.071.047.232.04.458.11.674.204.243.106.468.255.917.555L12 20m0-9.6c0-2.24 0-3.36.436-4.216a4 4 0 011.748-1.748C15.04 4 16.16 4 18.4 4h1c.56 0 .84 0 1.054.109a1 1 0 01.437.437C21 4.76 21 5.04 21 5.6v10.8c0 .56 0 .84-.109 1.054a1 1 0 01-.437.437C20.24 18 19.96 18 19.4 18h-2.947c-.54 0-.81 0-1.071.047-.232.04-.458.11-.674.204-.243.106-.468.255-.917.555L12 20" strokeLinecap="round" strokeLinejoin="round" />
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
              <path d="M12 13a2 2 0 100 4 2 2 0 000-4zm0 0V6M8 8h.01M16 8h.01M18 12h.01M6 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
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
              <path d="M12 7v5l2.5 1.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="sv" id="dash-stat-streak">
            {loading ? "..." : stats?.streak || 0}
          </div>
          <div className="sl">Day Streak</div>
          <div className="sd neu">Start your first session</div>
        </div>
        <div className="sc">
          <div className="si2" style={{ background: "var(--purple-l)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2" width="15" height="15">
              <path d="M15.92 12.896l3.338-4.006c.275-.33.412-.494.51-.68.087-.163.15-.339.189-.52C20 7.485 20 7.27 20 6.84V6.2c0-1.12 0-1.68-.218-2.108a2 2 0 00-.874-.874C18.48 3 17.92 3 16.8 3H7.2c-1.12 0-1.68 0-2.108.218a2 2 0 00-.874.874C4 4.52 4 5.08 4 6.2v.641c0 .43 0 .644.043.849a2 2 0 00.189.52c.098.186.235.35.51.68l3.338 4.006m5.32-1.697l5.967-7.66m-8.768 7.66L4.64 3.534M6.557 6H17.45M17 16a5 5 0 11-10 0 5 5 0 0110 0z" strokeLinejoin="round" />
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
              <path d="M13 3l-7.931 9.693c-.342.418-.513.627-.514.803a.5.5 0 00.186.394c.138.11.407.11.947.11H12l-1 7 7.93-9.693c.342-.418.513-.627.514-.803a.5.5 0 00-.186-.394C19.12 10 18.85 10 18.31 10H12l1-7z" strokeLinecap="round" strokeLinejoin="round" />
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
                    <path d="M12 7v5l2.5 1.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  No activity yet. Start a practice session!
                </div>
              )}
            </div>
          </div>
          <div className="card">
            <div className="ct">Today&apos;s Challenges</div>
            <div style={{ overflowX: "auto" }}>
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
