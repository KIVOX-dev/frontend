"use client";

import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { HrLogin } from "@/components/hr/HrLogin";
import { HrShell } from "@/components/layout/HrShell";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function HrPage() {
  const { isAuthenticated, user } = useAuthStore();
  const { activeScreen, setActiveScreen } = useUiStore();
  const [mounted, setMounted] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [lbFilter, setLbFilter] = useState("Global Talent");
  const [lbSearch, setLbSearch] = useState("");

  // Form State
  const [title, setTitle] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [deadline, setDeadline] = useState("");
  const [minScore, setMinScore] = useState("");
  const [gradYear, setGradYear] = useState("Any year");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizeLeaderboardScore = (entry: any) => {
    const accuracy = Number(entry?.accuracy);
    if (Number.isFinite(accuracy) && accuracy >= 0) {
      return Math.min(100, Math.max(0, accuracy));
    }

    const rawScore = Number(entry?.score);
    if (!Number.isFinite(rawScore) || rawScore <= 0) {
      return 0;
    }

    return Math.min(100, Math.max(0, rawScore > 100 ? rawScore / 10 : rawScore));
  };

  const fetchJobs = async () => {
    try {
      const res = await api.get("/jobs/me");
      setJobs(res.data);
    } catch (err) {
      console.error("Error fetching jobs", err);
    }
  };

  const fetchAllJobs = async () => {
    try {
      const res = await api.get("/jobs");
      setAllJobs(res.data);
    } catch (err) {
      console.error("Error fetching all jobs", err);
    }
  };

  const fetchApplicants = async () => {
    try {
      const res = await api.get("/jobs/applications/me");
      setApplicants(res.data);
    } catch (err) {
      console.error("Error fetching applicants", err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get("/leaderboard");
      if (res.data.success) {
        setLeaderboard(
          (res.data.data || []).map((entry: any) => ({
            ...entry,
            displayScore: normalizeLeaderboardScore(entry),
            tests_completed: Number(entry?.tests_completed) || 0,
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching leaderboard", err);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (activeScreen === "dash") {
      setActiveScreen("hr-dash");
    }
    if (isAuthenticated && (user?.role === "hr" || user?.role === "recruiter")) {
      fetchJobs();
      fetchAllJobs();
      fetchApplicants();
      fetchLeaderboard();
    }
  }, [activeScreen, setActiveScreen, isAuthenticated, user]);

  if (!mounted) return null;

  if (!isAuthenticated || (user?.role !== "hr" && user?.role !== "recruiter")) {
    return <HrLogin />;
  }

  const currentScreen = activeScreen === "dash" ? "hr-dash" : activeScreen;

  const handlePostVacancy = async () => {
    if (!title) return alert("Job Title is required!");
    setLoading(true);
    try {
      await api.post("/jobs", {
        college_id: 1, // Defaulting to 1 for now
        title: title,
        job_type: jobType.toLowerCase().replace("-", "_"),
        application_deadline: deadline ? new Date(deadline).toISOString() : null,
        min_cgpa: minScore ? parseFloat(minScore) : null,
        eligible_years: gradYear,
        description: description,
        required_skills: skills.join(", "),
        company_name: (user as any)?.company_name || (user as any)?.company || "Company",
      });
      alert("Job Posted Successfully!");
      setTitle("");
      setDescription("");
      setSkills([]);
      fetchJobs();
      setActiveScreen("hr-dash");
    } catch (err) {
      console.error(err);
      alert("Failed to post job");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };



  return (
    <HrShell>
      {currentScreen === "hr-dash" && (
        <div className="screen active" id="screen-hr-dash">
          <div className="hero">
            <div className="hero-tag">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              HR Dashboard · {(user as any)?.company_name || (user as any)?.company || "Company"}
            </div>
            <div className="hero-title">
              Find Your Next<br />
              Top Talent.
            </div>
            <div className="hero-sub">
              Browse AI-scored aptitude profiles, view job-role badges, and shortlist directly from the SkilloWait leaderboard.
            </div>
            <div className="hero-acts">
              <button className="hbtn hbtn-w" onClick={() => setActiveScreen("hr-vac")}>Post a Vacancy</button>
              <button className="hbtn hbtn-gh" onClick={() => setActiveScreen("hr-lb")}>View Talent Board</button>
            </div>
          </div>
          <div className="sg">
            <div className="sc">
              <div className="si2" style={{ background: "var(--accent-l)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" width="15" height="15">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                </svg>
              </div>
              <div className="sv">{jobs.filter((j) => j.is_active).length}</div>
              <div className="sl">Active Vacancies</div>
              <div className="sd neu">—</div>
            </div>
            <div className="sc">
              <div className="si2" style={{ background: "var(--green-l)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" width="15" height="15">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <div className="sv">{applicants.length}</div>
              <div className="sl">Total Applicants</div>
              <div className="sd neu">—</div>
            </div>
            <div className="sc">
              <div className="si2" style={{ background: "var(--purple-l)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2" width="15" height="15">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
              </div>
              <div className="sv">{applicants.filter(a => a.status === "shortlisted").length}</div>
              <div className="sl">Shortlisted</div>
              <div className="sd neu">—</div>
            </div>
            <div className="sc">
              <div className="si2" style={{ background: "var(--amber-l)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" width="15" height="15">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
              </div>
              <div className="sv">—</div>
              <div className="sl">Top Score (Avg)</div>
              <div className="sd neu">No data yet</div>
            </div>
          </div>
          
          <div className="gms">
            <div className="card">
              <div className="ct">Recent Applicants <span onClick={() => setActiveScreen("hr-app")} style={{ cursor: "pointer", color: "var(--accent)" }}>View all</span></div>
              {applicants.length === 0 ? (
                <div style={{ textAlign: "center", padding: "36px", color: "var(--muted)", fontSize: "13px" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40" style={{ display: "block", margin: "0 auto 10px", opacity: 0.3 }}>
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                  No applicants yet. Wait for students to apply.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {applicants.slice(0, 3).map((app) => (
                    <div className="vcard" key={app.id}>
                      <div className="vtit">{app.student_name || app.student_email || "Student"}</div>
                      <div className="vco">
                        Applied for: {app.job_title}
                      </div>
                      <span className="badge bg">{app.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="card">
                <div className="ct">Your Vacancies</div>
                {jobs.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px", color: "var(--muted)", fontSize: "13px" }}>
                    No vacancies posted yet.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
                    {jobs.map((job) => (
                      <div className="vcard" key={job.id}>
                        <div className="vtit">{job.title}</div>
                        <div className="vco">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
                            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                          </svg>
                          {job.company_name} · {job.job_type.replace("_", "-").toUpperCase()}
                        </div>
                        <span className="badge bg">{job.status}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button className="btn btn-p btn-sm" style={{ width: "100%", justifyContent: "center" }} onClick={() => setActiveScreen("hr-vac")}>
                  + Post New Vacancy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {currentScreen === "hr-vac" && (
        <div className="screen active" id="screen-hr-vac">
          <div className="ph">
            <div className="pt">Post a Vacancy</div>
            <div className="ps">Once posted, eligible students can apply directly from their Profile Summarizer</div>
          </div>
          <div className="g2">
            <div className="card">
              <div className="ct">Vacancy Details</div>
              <label className="input-lbl">Job Title</label>
              <input className="input-field" placeholder="e.g. Full Stack Developer" value={title} onChange={(e) => setTitle(e.target.value)} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
                <div>
                  <label className="input-lbl">Role Type</label>
                  <select className="input-field" style={{ marginBottom: 0 }} value={jobType} onChange={(e) => setJobType(e.target.value)}>
                    <option>Full-time</option>
                    <option>Internship</option>
                    <option>Contract</option>
                  </select>
                </div>
                <div>
                  <label className="input-lbl">Deadline</label>
                  <input className="input-field" type="date" style={{ marginBottom: 0 }} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </div>
              </div>
              <div style={{ height: "12px" }}></div>
              <label className="input-lbl">Required Subjects / Skills</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", padding: "10px", border: "1.5px solid var(--border)", borderRadius: "var(--r2)", background: "var(--surface)", marginBottom: "12px" }}>
                {skills.map((skill, i) => (
                  <span className="badge bb" key={i}>
                    {skill}
                    <button onClick={() => handleRemoveSkill(skill)} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "4px", color: "var(--accent)" }}>×</button>
                  </span>
                ))}
                <div style={{ display: "flex", flex: 1, minWidth: "150px" }}>
                  <input
                    style={{ border: "none", background: "transparent", outline: "none", flex: 1, fontSize: "13px", color: "var(--text)" }}
                    placeholder="Type skill & press Enter..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                  />
                  <button className="btn btn-g btn-sm" onClick={handleAddSkill} style={{ padding: "4px 8px", fontSize: "11px" }}>+ Add</button>
                </div>
              </div>

              <label className="input-lbl">Minimum Aptitude Score <span style={{ color: "var(--faint)", fontWeight: 400 }}>(optional)</span></label>
              <input type="number" className="input-field" placeholder="e.g. 70" value={minScore} onChange={(e) => setMinScore(e.target.value)} />

              <label className="input-lbl">Graduation Year</label>
              <input className="input-field" placeholder="e.g. 2024, 2025 (or leave blank for any)" value={gradYear} onChange={(e) => setGradYear(e.target.value)} />

              <label className="input-lbl">Job Description</label>
              <textarea className="input-field" rows={5} placeholder="Paste JD here — students see this before applying" value={description} onChange={(e) => setDescription(e.target.value)} style={{ resize: "vertical" }} />

              <button className="btn btn-p" style={{ width: "100%", justifyContent: "center", marginTop: "8px" }} onClick={handlePostVacancy} disabled={loading}>
                {loading ? "Posting..." : "Post Vacancy Live"}
              </button>
            </div>
            <div className="card" style={{ background: "var(--surface2)" }}>
              <div className="ct">Live Preview</div>
              <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: "18px", marginBottom: "14px" }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "18px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>
                  {title || "Job Title"}
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "5px", marginBottom: "12px" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  {(user as any)?.company_name || (user as any)?.company || "Company"} · {jobType}
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
                  {skills.slice(0, 2).map((s, i) => <span key={i} className="badge bb">{s}</span>)}
                  {minScore && <span className="badge ba">Min Score: {minScore}</span>}
                </div>
                <button className="btn btn-p btn-sm" style={{ width: "100%", justifyContent: "center" }}>Apply Now</button>
              </div>
              <div style={{ background: "var(--green-l)", border: "1.5px solid rgba(14,159,110,.18)", borderRadius: "var(--r2)", padding: "12px", fontSize: "12px", color: "var(--text)", lineHeight: 1.6 }}>
                <strong style={{ color: "var(--green)" }}>Who sees this?</strong> All SkilloWait students matching your filters will see this vacancy in their Profile Summarizer → Open Roles tab.
              </div>
            </div>
          </div>
        </div>
      )}
      
      {currentScreen === "hr-app" && (
        <div className="screen active" id="screen-hr-app">
          <div className="ph" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div className="pt">Applicants</div>
              <div className="ps">All Vacancies · Pending Review</div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <select className="fi" style={{ width: "auto", padding: "7px 12px", fontSize: "12px" }}>
                <option>All Statuses</option>
                <option>Shortlisted</option>
                <option>Under Review</option>
                <option>Rejected</option>
              </select>
              <select className="fi" style={{ width: "auto", padding: "7px 12px", fontSize: "12px" }}>
                <option>Score ↓</option>
                <option>Name</option>
                <option>Date</option>
              </select>
            </div>
          </div>
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>College</th>
                  <th>Score</th>
                  <th>Top Subjects</th>
                  <th>Interview</th>
                  <th>Badge</th>
                  <th>Resume</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {applicants.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>No applications found.</td>
                  </tr>
                ) : (
                  applicants.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <div className="tn" style={{ color: "var(--accent)", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px" }}>{app.student_name || "Student"}</div>
                        <div className="ts">{app.student_email}</div>
                      </td>
                      <td>{app.job_title}</td>
                      <td>
                        <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", fontWeight: 700, color: "var(--green)" }}>—</span>
                        <div className="ts">Pending Score</div>
                      </td>
                      <td><span className="badge bb">N/A</span></td>
                      <td><span style={{ fontWeight: 700, color: "var(--green)" }}>—/100</span></td>
                      <td>
                        <span className="badge bp">
                          Pending
                        </span>
                      </td>
                      <td><button className="btn btn-g btn-sm">View Resume</button></td>
                      <td><button className="btn btn-green btn-sm">{app.status}</button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {currentScreen === "hr-lb" && (
        <div className="screen lb-v2-screen active" id="screen-hr-lb" style={{ position: "relative" }}>
          <div className="settings-immersive-canvas">
            <div className="mesh-container">
              <div className="mesh-sphere mesh-sphere-1"></div>
              <div className="mesh-sphere mesh-sphere-2"></div>
              <div className="mesh-sphere mesh-sphere-3"></div>
            </div>
          </div>

          <div className="leaderboard-v2-active">
            <div className="ph" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
              <div>
                <div className="pt">Global Talent Board</div>
                <div className="ps">Executive sourcing view · Unified ranking across all partner institutions</div>
              </div>

            </div>

            <div className="lb-metric-strip" style={{ position: "relative", zIndex: 1 }}>
              <div className="lb-metric-card creative-tilt-card">
                <div className="lb-metric-icon" style={{ background: "#FEF3C7", color: "#D97706" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <div className="lb-metric-val">{leaderboard.length}</div>
                <div className="lb-metric-lbl">Total Profiles Scored</div>
              </div>
              <div className="lb-metric-card creative-tilt-card">
                <div className="lb-metric-icon" style={{ background: "#DCFCE7", color: "#16A34A" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div className="lb-metric-val">{leaderboard.filter(l => l.displayScore >= 70).length}</div>
                <div className="lb-metric-lbl">Placement Ready</div>
              </div>
              <div className="lb-metric-card creative-tilt-card">
                <div className="lb-metric-icon" style={{ background: "#FCE7F3", color: "#DB2777" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                    <line x1="4" y1="22" x2="4" y2="15" />
                  </svg>
                </div>
                <div className="lb-metric-val">{new Set(allJobs.map(j => j.company_name)).size}</div>
                <div className="lb-metric-lbl">Partner Companies</div>
              </div>
              <div className="lb-metric-card creative-tilt-card">
                <div className="lb-metric-icon" style={{ background: "#E0E7FF", color: "#4F46E5" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <div className="lb-metric-val">
                  {leaderboard.length > 0 ? Math.round(leaderboard.reduce((acc, curr) => acc + curr.displayScore, 0) / leaderboard.length) : 0}%
                </div>
                <div className="lb-metric-lbl">Top percentile avg</div>
              </div>
            </div>

            <div className="lb-control-bar" style={{ position: "relative", zIndex: 1 }}>
              <div className="lb-search-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input type="text" placeholder="Search by name, college, or role..." value={lbSearch} onChange={e => setLbSearch(e.target.value)} />
              </div>
              {["Global Talent", "Top 1% Profiles", "Engineering", "Management"].map(pill => (
                <div key={pill} className={`lb-filter-pill ${lbFilter === pill ? "active" : ""}`} onClick={() => setLbFilter(pill)}>
                  {pill}
                </div>
              ))}
            </div>

            <div className="lb-table-container extreme-glass" style={{ position: "relative", zIndex: 1 }}>
              <table className="lb-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Candidate</th>
                    <th>Department</th>
                    <th>Tests</th>
                    <th>Score</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.filter(s => {
                    if (lbSearch && !s.name.toLowerCase().includes(lbSearch.toLowerCase())) return false;
                    if (lbFilter === "Top 1% Profiles" && s.displayScore < 90) return false;
                    if (lbFilter === "Engineering" && (!s.department || !s.department.toLowerCase().includes("engineer"))) return false;
                    if (lbFilter === "Management" && (!s.department || !s.department.toLowerCase().includes("manage"))) return false;
                    return true;
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>No students found in leaderboard.</td>
                    </tr>
                  ) : (
                    leaderboard.filter(s => {
                      if (lbSearch && !s.name.toLowerCase().includes(lbSearch.toLowerCase())) return false;
                      if (lbFilter === "Top 1% Profiles" && s.displayScore < 90) return false;
                      if (lbFilter === "Engineering" && (!s.department || !s.department.toLowerCase().includes("engineer"))) return false;
                      if (lbFilter === "Management" && (!s.department || !s.department.toLowerCase().includes("manage"))) return false;
                      return true;
                    }).map((student) => (
                      <tr key={student.id}>
                        <td>
                          <div className={`lbrk ${student.rank === 1 ? 'gold' : student.rank === 2 ? 'silver' : student.rank === 3 ? 'bronze' : ''}`} style={{ display: "inline-flex" }}>
                            #{student.rank}
                          </div>
                        </td>
                        <td>
                          <div className="tn">{student.name}</div>
                        </td>
                        <td>{student.department || "Unknown"}</td>
                        <td>{student.tests_completed} completed</td>
                        <td><span style={{ fontWeight: 700, color: "var(--teal)" }}>{student.displayScore.toFixed(1)}/100</span></td>
                        <td><button className="btn btn-o btn-sm">Invite</button></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {currentScreen === "hr-analytics" && (
        <div className="screen active" id="screen-hr-analytics">
          <div className="ph">
            <div className="pt">Candidate Analytics</div>
            <div className="ps">Data driven insights for your active job vacancies</div>
          </div>
          <div className="sg">
            <div className="sc">
              <div className="si2" style={{ background: "var(--accent-l)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" width="15" height="15">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                </svg>
              </div>
              <div className="sv">{jobs.filter(j => j.is_active).length}</div>
              <div className="sl">Active Postings</div>
            </div>
            <div className="sc">
              <div className="si2" style={{ background: "var(--green-l)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" width="15" height="15">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <div className="sv">{applicants.length}</div>
              <div className="sl">Total Inbound</div>
            </div>
            <div className="sc">
              <div className="si2" style={{ background: "var(--purple-l)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2" width="15" height="15">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
              </div>
              <div className="sv">{applicants.filter(a => a.status === "shortlisted").length}</div>
              <div className="sl">Conversion Rate</div>
            </div>
          </div>
          <div className="card" style={{ marginTop: "20px", textAlign: "center", padding: "60px 20px" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="48" height="48" style={{ color: "var(--border-d)", marginBottom: "16px" }}>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>Not enough data</div>
            <div style={{ color: "var(--muted)", marginTop: "4px" }}>Wait for more candidates to apply to see charts and trends.</div>
          </div>
        </div>
      )}



      {currentScreen !== "hr-dash" && currentScreen !== "hr-vac" && currentScreen !== "hr-app" && currentScreen !== "hr-lb" && currentScreen !== "hr-analytics" && (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
          <h2>{currentScreen.replace("hr-", "").toUpperCase()} Screen</h2>
          <p>This module is currently being migrated to React.</p>
        </div>
      )}
    </HrShell>
  );
}
