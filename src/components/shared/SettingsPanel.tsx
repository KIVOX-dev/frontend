"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

type StudentProfile = {
  id: string;
  department_id?: string | null;
  roll_number?: string | null;
  batch_year?: number | null;
  cgpa?: number | null;
  placement_status?: string | null;
  year_of_study?: number | null;
  semester?: number | null;
  section?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: string | null;
  tests_completed?: number | null;
  avg_accuracy?: number | null;
  streak_days?: number | null;
  interviews_completed?: number | null;
};

type Department = { id: string; name: string };

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span style={{ fontSize: "13px", color: "var(--muted)" }}>{label}</span>
      <div style={{ fontWeight: 600, color: "var(--text)" }}>{value ?? "—"}</div>
    </div>
  );
}

export function SettingsPanel() {
  const { user, logout } = useAuthStore();
  const [pwdForm, setPwdForm] = useState({ current_password: "", new_password: "" });
  const [msg, setMsg] = useState("");

  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [profileLoading, setProfileLoading] = useState(user?.role === "student");
  const [profileMissing, setProfileMissing] = useState(false);

  useEffect(() => {
    if (user?.role !== "student") return;
    Promise.all([
      api.get<StudentProfile>("/students/profile"),
      api.get<Department[]>("/departments").catch(() => ({ data: [] })),
    ])
      .then(([profileRes, deptRes]) => {
        setStudentProfile(profileRes.data);
        setDepartments(deptRes.data || []);
      })
      .catch(() => setProfileMissing(true))
      .finally(() => setProfileLoading(false));
  }, [user?.role]);

  const departmentName = departments.find((d) => d.id === studentProfile?.department_id)?.name;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    try {
      await api.put("/auth/change-password", pwdForm);
      setMsg("Password changed successfully!");
      setPwdForm({ current_password: "", new_password: "" });
    } catch (err: any) {
      setMsg(err.response?.data?.detail || "Failed to change password");
    }
  };

  return (
    <div className="screen active" style={{ padding: "40px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)", marginBottom: "8px" }}>Settings</h2>
        <p style={{ color: "var(--muted)", fontSize: "15px" }}>Manage your account settings.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", maxWidth: "800px" }}>
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px", color: "var(--text)" }}>Profile</h3>
          <div style={{ marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", color: "var(--muted)" }}>Name</span>
            <div style={{ fontWeight: 600, color: "var(--text)" }}>{user?.name}</div>
          </div>
          <div style={{ marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", color: "var(--muted)" }}>Email</span>
            <div style={{ fontWeight: 600, color: "var(--text)" }}>{user?.email}</div>
          </div>
          <div style={{ marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", color: "var(--muted)" }}>Role</span>
            <div style={{ fontWeight: 600, color: "var(--text)", textTransform: "capitalize" }}>{user?.role?.replace("_", " ")}</div>
          </div>
          <button className="btn" onClick={() => { logout(); window.location.href = "/"; }} style={{ marginTop: "12px", color: "#dc2626", borderColor: "#dc2626" }}>
            Log Out
          </button>
        </div>

        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px", color: "var(--text)" }}>Change Password</h3>
          {msg && <div style={{ padding: "10px", marginBottom: "12px", background: "var(--bg)", borderRadius: "8px", fontSize: "14px", color: "var(--accent)" }}>{msg}</div>}
          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: "14px" }}>
              <label className="lbl">Current Password</label>
              <input type="password" className="fi" value={pwdForm.current_password} onChange={e => setPwdForm({ ...pwdForm, current_password: e.target.value })} required />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label className="lbl">New Password</label>
              <input type="password" className="fi" value={pwdForm.new_password} onChange={e => setPwdForm({ ...pwdForm, new_password: e.target.value })} required placeholder="Must contain letters and numbers" />
            </div>
            <button type="submit" className="btn btn-p" style={{ width: "100%" }}>Update Password</button>
          </form>
        </div>

        {user?.role === "student" && (
          <div className="card" style={{ padding: "24px", gridColumn: "1 / -1" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px", color: "var(--text)" }}>Student Details</h3>
            {profileLoading ? (
              <p style={{ fontSize: "13px", color: "var(--muted)" }}>Loading...</p>
            ) : profileMissing || !studentProfile ? (
              <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                Your student profile hasn&apos;t been set up yet. Contact your institution admin.
              </p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "18px" }}>
                <Field label="Student ID" value={studentProfile.id} />
                <Field label="Roll Number" value={studentProfile.roll_number} />
                <Field label="Department" value={departmentName} />
                <Field label="Batch Year" value={studentProfile.batch_year} />
                <Field label="Year of Study" value={studentProfile.year_of_study} />
                <Field label="Semester" value={studentProfile.semester} />
                <Field label="Section" value={studentProfile.section} />
                <Field label="CGPA" value={studentProfile.cgpa} />
                <Field label="Phone" value={studentProfile.phone} />
                <Field label="Gender" value={studentProfile.gender} />
                <Field label="Date of Birth" value={studentProfile.date_of_birth ? new Date(studentProfile.date_of_birth).toLocaleDateString() : undefined} />
                <Field label="Placement Status" value={studentProfile.placement_status} />
                <Field label="Tests Completed" value={studentProfile.tests_completed} />
                <Field label="Avg Accuracy" value={studentProfile.avg_accuracy != null ? `${studentProfile.avg_accuracy}%` : undefined} />
                <Field label="Day Streak" value={studentProfile.streak_days} />
                <Field label="Interviews Completed" value={studentProfile.interviews_completed} />
                <div style={{ gridColumn: "1 / -1" }}>
                  <Field label="Address" value={studentProfile.address} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
