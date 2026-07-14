"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export function AddStudentPanel() {
  const { user } = useAuthStore();
  const [form, setForm] = useState({ name: "", email: "", password: "student123", department: "", year: "" });
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.post("/users/", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: "student",
        department: form.department || undefined,
        college_id: user?.college_id,
      });
      setMessage({ text: `✓ Student "${form.name}" created successfully!`, ok: true });
      setForm({ name: "", email: "", password: "student123", department: "", year: "" });
    } catch (err: any) {
      setMessage({ text: err.response?.data?.detail || "Failed to create student.", ok: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen active" style={{ padding: "40px", maxWidth: "560px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)", marginBottom: "6px" }}>Add Student</h2>
        <p style={{ color: "var(--muted)" }}>Create a single student account for your institution.</p>
      </div>

      <div className="card" style={{ padding: "32px" }}>
        {message && (
          <div style={{ padding: "12px 16px", marginBottom: "20px", background: message.ok ? "#e6f4ea" : "#fee2e2", color: message.ok ? "#1e8e3e" : "#dc2626", borderRadius: "8px", fontSize: "14px", fontWeight: 500 }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "18px" }}>
            <label className="lbl">Full Name <span style={{ color: "var(--red)" }}>*</span></label>
            <input type="text" className="fi" placeholder="e.g. Adithyen Kumar" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>

          <div style={{ marginBottom: "18px" }}>
            <label className="lbl">Email Address <span style={{ color: "var(--red)" }}>*</span></label>
            <input type="email" className="fi" placeholder="student@college.edu" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "18px" }}>
            <div>
              <label className="lbl">Department</label>
              <input type="text" className="fi" placeholder="e.g. CSE" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
            </div>
            <div>
              <label className="lbl">Year</label>
              <select className="fi" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}>
                <option value="">Select</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label className="lbl">Initial Password <span style={{ color: "var(--red)" }}>*</span></label>
            <input type="text" className="fi" placeholder="e.g. Student123" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "6px" }}>The student will use this password to log in for the first time.</p>
          </div>

          <button type="submit" className="btn btn-p" style={{ width: "100%", padding: "14px", fontSize: "15px" }} disabled={loading}>
            {loading ? "Creating Account..." : "Create Student Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
