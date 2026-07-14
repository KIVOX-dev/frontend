"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  department?: string;
  created_at?: string;
};

type Assessment = {
  id: number;
  title: string;
  assessment_type: string;
  status: string;
  difficulty: string;
  duration_minutes: number;
  total_marks: number;
  created_at: string;
};

export function CollegeAdminDashboard() {
  const { user: currentUser } = useAuthStore();
  const { activeScreen } = useUiStore();
  const [users, setUsers] = useState<User[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalStudents: 0, totalFaculty: 0, totalAssessments: 0 });
  const [loading, setLoading] = useState(false);

  // Create user form
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "student", department: "" });
  const [createMsg, setCreateMsg] = useState("");

  // Assessment form
  const [showCreateAssessment, setShowCreateAssessment] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({ title: "", description: "", assessment_type: "aptitude", difficulty: "medium", duration_minutes: 30, total_marks: 100, pass_percentage: 40, status: "active" });
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleAIGenerate = async () => {
    if (!assessmentForm.title) {
      alert("Please enter a title first to generate questions.");
      return;
    }
    setIsGeneratingAI(true);
    try {
      const res = await api.post("/assessments/generate-questions", {
        title: assessmentForm.title,
        type: assessmentForm.assessment_type,
        difficulty: assessmentForm.difficulty
      });
      setAssessmentForm(prev => ({ ...prev, description: JSON.stringify(res.data) }));
    } catch (err) {
      alert("Failed to generate AI questions.");
      console.error(err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      // Filter out college admins so they don't see themselves in the Manage Users table
      const filteredUsers = res.data.filter((u: User) => u.role !== "college_admin");
      setUsers(filteredUsers);
      const students = res.data.filter((u: User) => u.role === "student").length;
      const faculty = res.data.filter((u: User) => u.role === "faculty").length;
      setStats(prev => ({ ...prev, totalUsers: res.data.length, totalStudents: students, totalFaculty: faculty }));
    } catch (err) { console.error(err); }
  };

  const fetchAssessments = async () => {
    try {
      const res = await api.get("/assessments");
      setAssessments(res.data);
      setStats(prev => ({ ...prev, totalAssessments: res.data.length }));
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchUsers();
    fetchAssessments();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCreateMsg("");
    try {
      await api.post("/users/", { ...createForm, college_id: currentUser?.college_id });
      setCreateMsg("User created successfully!");
      setCreateForm({ name: "", email: "", password: "", role: "student", department: "" });
      setShowCreateUser(false);
      fetchUsers();
    } catch (err: any) {
      setCreateMsg(err.response?.data?.detail || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch { alert("Failed to delete"); }
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/assessments", assessmentForm);
      setShowCreateAssessment(false);
      setAssessmentForm({ title: "", description: "", assessment_type: "aptitude", difficulty: "medium", duration_minutes: 30, total_marks: 100, pass_percentage: 40, status: "active" });
      fetchAssessments();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to create assessment");
    }
  };

  const handleDeleteAssessment = async (id: number) => {
    if (!confirm("Delete this assessment?")) return;
    try {
      await api.delete(`/assessments/${id}`);
      fetchAssessments();
    } catch { alert("Failed to delete"); }
  };

  return (
    <div className="screen active" style={{ padding: "40px" }}>
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)" }}>Institution Dashboard</h2>
        <p style={{ color: "var(--muted)" }}>Overview of your institution&apos;s users and assessments.</p>
      </div>

      {activeScreen === "dash" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
            {[
              { label: "Total Users", value: stats.totalUsers, color: "#4f46e5" },
              { label: "Students", value: stats.totalStudents, color: "#0891b2" },
              { label: "Faculty", value: stats.totalFaculty, color: "#7c3aed" },
              { label: "Assessments", value: stats.totalAssessments, color: "#059669" },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: "20px", borderLeft: `4px solid ${s.color}` }}>
                <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "4px" }}>{s.label}</div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)" }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>Manage Users</h3>
              <button className="btn btn-p" onClick={() => setShowCreateUser(true)}>+ Add User</button>
            </div>

            {createMsg && <div style={{ padding: "10px", marginBottom: "12px", background: "var(--bg)", borderRadius: "8px", color: "var(--accent)", fontSize: "14px" }}>{createMsg}</div>}

        <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: "13px" }}>
              <th style={{ padding: "12px 8px" }}>Name</th>
              <th style={{ padding: "12px 8px" }}>Email</th>
              <th style={{ padding: "12px 8px" }}>Role</th>
              <th style={{ padding: "12px 8px" }}>Status</th>
              <th style={{ padding: "12px 8px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 500 }}>{u.name}</td>
                <td style={{ padding: "12px 8px", color: "var(--muted)", fontSize: "14px" }}>{u.email}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span style={{ padding: "4px 10px", background: u.role === "faculty" ? "var(--purple-l, #ede9fe)" : "var(--accent-l)", color: u.role === "faculty" ? "var(--purple, #7c3aed)" : "var(--accent)", borderRadius: "6px", fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}>{u.role.replace("_", " ")}</span>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <span style={{ padding: "4px 10px", background: u.status === "approved" ? "#e6f4ea" : u.status === "pending" ? "#fef3c7" : "#fee2e2", color: u.status === "approved" ? "#1e8e3e" : u.status === "pending" ? "#b45309" : "#dc2626", borderRadius: "6px", fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}>{u.status}</span>
                </td>
                <td style={{ padding: "12px 8px", textAlign: "right" }}>
                  <button onClick={() => handleDeleteUser(u.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Delete</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      </>
      )}

      {/* Assessments Section */}
      {(activeScreen === "dash" || activeScreen === "assessments") && (
      <div className="card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>Manage Assessments</h3>
          <button className="btn btn-p" onClick={() => setShowCreateAssessment(true)}>+ Create Assessment</button>
        </div>

        <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: "13px" }}>
              <th style={{ padding: "12px 8px" }}>Title</th>
              <th style={{ padding: "12px 8px" }}>Type</th>
              <th style={{ padding: "12px 8px" }}>Difficulty</th>
              <th style={{ padding: "12px 8px" }}>Duration</th>
              <th style={{ padding: "12px 8px" }}>Marks</th>
              <th style={{ padding: "12px 8px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map(a => (
              <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 500 }}>{a.title}</td>
                <td style={{ padding: "12px 8px", textTransform: "capitalize" }}>{a.assessment_type}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span style={{ padding: "4px 10px", background: a.difficulty === "hard" ? "#fee2e2" : a.difficulty === "medium" ? "#fef3c7" : "#e6f4ea", color: a.difficulty === "hard" ? "#dc2626" : a.difficulty === "medium" ? "#b45309" : "#1e8e3e", borderRadius: "6px", fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}>{a.difficulty}</span>
                </td>
                <td style={{ padding: "12px 8px" }}>{a.duration_minutes} min</td>
                <td style={{ padding: "12px 8px" }}>{a.total_marks}</td>
                <td style={{ padding: "12px 8px", textAlign: "right" }}>
                  <button onClick={() => handleDeleteAssessment(a.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Delete</button>
                </td>
              </tr>
            ))}
            {assessments.length === 0 && (
              <tr><td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>No assessments created yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div className="card" style={{ padding: "32px", width: "100%", maxWidth: "440px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px", color: "var(--text)" }}>Add New User</h3>
            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: "14px" }}>
                <label className="lbl">Name</label>
                <input type="text" className="fi" value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} required />
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label className="lbl">Email</label>
                <input type="email" className="fi" value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} required />
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label className="lbl">Password</label>
                <input type="text" className="fi" value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} required placeholder="Initial password" />
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label className="lbl">Role</label>
                <select className="fi" value={createForm.role} onChange={e => setCreateForm({...createForm, role: e.target.value})}>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                </select>
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label className="lbl">Department (Optional)</label>
                <input type="text" className="fi" value={createForm.department} onChange={e => setCreateForm({...createForm, department: e.target.value})} placeholder="e.g. CSE" />
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" className="btn" onClick={() => setShowCreateUser(false)}>Cancel</button>
                <button type="submit" className="btn btn-p" disabled={loading}>{loading ? "Creating..." : "Create User"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Assessment Modal */}
      {showCreateAssessment && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div className="card" style={{ padding: "32px", width: "100%", maxWidth: "440px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px", color: "var(--text)" }}>Create Assessment</h3>
            <form onSubmit={handleCreateAssessment}>
              <div style={{ marginBottom: "14px" }}>
                <label className="lbl">Title</label>
                <input type="text" className="fi" value={assessmentForm.title} onChange={e => setAssessmentForm({...assessmentForm, title: e.target.value})} required placeholder="e.g. Aptitude Test Set 1" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label className="lbl">Type</label>
                  <select className="fi" value={assessmentForm.assessment_type} onChange={e => setAssessmentForm({...assessmentForm, assessment_type: e.target.value})}>
                    <option value="aptitude">Aptitude</option>
                    <option value="technical">Technical</option>
                    <option value="verbal">Verbal</option>
                    <option value="coding">Coding</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
                <div>
                  <label className="lbl">Difficulty</label>
                  <select className="fi" value={assessmentForm.difficulty} onChange={e => setAssessmentForm({...assessmentForm, difficulty: e.target.value})}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                  <label className="lbl" style={{ marginBottom: 0 }}>Questions Data (JSON file)</label>
                  <button 
                    type="button" 
                    onClick={handleAIGenerate}
                    disabled={isGeneratingAI}
                    style={{ background: "none", border: "none", color: "var(--purple)", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                  >
                    {isGeneratingAI ? "Generating..." : "✨ Auto-Generate with AI"}
                  </button>
                </div>
                <input type="file" accept=".json" className="fi" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        const jsonStr = ev.target?.result as string;
                        JSON.parse(jsonStr); // Validate JSON
                        setAssessmentForm(prev => ({ ...prev, description: jsonStr }));
                      } catch (err) {
                        alert("Invalid JSON format. Please upload a valid JSON file.");
                        e.target.value = "";
                      }
                    };
                    reader.readAsText(file);
                  }
                }} />
                {assessmentForm.description && <div style={{ fontSize: "12px", color: "var(--teal)", marginTop: "4px" }}>✓ JSON loaded successfully</div>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div>
                  <label className="lbl">Duration (min)</label>
                  <input type="number" className="fi" value={assessmentForm.duration_minutes} onChange={e => setAssessmentForm({...assessmentForm, duration_minutes: parseInt(e.target.value) || 30})} />
                </div>
                <div>
                  <label className="lbl">Total Marks</label>
                  <input type="number" className="fi" value={assessmentForm.total_marks} onChange={e => setAssessmentForm({...assessmentForm, total_marks: parseInt(e.target.value) || 100})} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" className="btn" onClick={() => setShowCreateAssessment(false)}>Cancel</button>
                <button type="submit" className="btn btn-p">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
