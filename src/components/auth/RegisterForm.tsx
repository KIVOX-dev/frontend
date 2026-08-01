"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";

type Role = "student" | "hr" | "college_admin";

const ROLE_TABS: { role: Role; label: string }[] = [
  { role: "student", label: "Student" },
  { role: "hr", label: "Recruiter" },
  { role: "college_admin", label: "College Admin" },
];

// Faculty and institutional-student accounts are provisioned by a college
// admin from inside the portal, not self-registered — so only these three
// roles get a signup path here. Each has a different shape:
// college_admin registration is a request that waits for super-admin
// approval (see CollegeAdminLogin), so unlike student/hr it never logs
// the caller straight in.
const ROLE_COPY: Record<Role, { heading: string; sub: string; nameLabel: string; namePlaceholder: string; submitLabel: string }> = {
  student: {
    heading: "Create Your Account",
    sub: "Start your AI-powered placement journey today",
    nameLabel: "Full Name",
    namePlaceholder: "Your name",
    submitLabel: "Get Started Now",
  },
  hr: {
    heading: "Create HR Account",
    sub: "Register your company on BUDDIES",
    nameLabel: "Full Name",
    namePlaceholder: "John Doe",
    submitLabel: "Register Company",
  },
  college_admin: {
    heading: "Register Your Institution",
    sub: "Submit a request for super admin approval",
    nameLabel: "Institution Name",
    namePlaceholder: "Your College Name",
    submitLabel: "Submit Registration Request",
  },
};

export function RegisterForm({ initialRole = "student" }: { initialRole?: Role }) {
  const [role, setRole] = useState<Role>(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);
  const router = useRouter();
  const copy = ROLE_COPY[role];

  const handleRoleChange = (nextRole: Role) => {
    setRole(nextRole);
    setError("");
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    setError("");
    if (!name.trim()) return setError(`Please enter ${role === "college_admin" ? "your institution name" : "your name"}.`);
    if (!email.trim()) return setError("Please enter your email.");
    if (!password.trim()) return setError("Please choose a password.");
    if (role === "hr" && !companyName.trim()) return setError("Please enter your company name.");

    setLoading(true);
    try {
      const payload: Record<string, unknown> = { name, email, password, role };
      if (phone.trim()) payload.phone = phone.trim();
      if (role === "hr") payload.company_name = companyName;

      const res = await api.post("/auth/register", payload);
      const { user, access_token } = res.data;

      if (role === "college_admin") {
        setSubmitted(true);
        return;
      }

      if (access_token && user) {
        login(
          {
            id: user._id || user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            college_id: user.college_id || user.collegeId,
            college_name: user.college_name,
            company_name: user.company_name,
          },
          access_token
        );
        router.push(role === "hr" ? "/hr" : "/learner");
      } else {
        setSubmitted(true);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: unknown; message?: string } } };
      const detail = error?.response?.data?.detail;
      let message = "Registration failed. Please try again.";
      if (Array.isArray(detail)) {
        message = detail.map((e: { msg: string }) => e.msg).join(", ");
      } else if (typeof detail === "string") {
        message = detail;
      } else if (error?.response?.data?.message) {
        message = error.response.data.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout>
      <div className="lp-card">
        <div className="l-tabs">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab.role}
              className={`l-tab ${role === tab.role ? "active" : ""}`}
              onClick={() => handleRoleChange(tab.role)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {submitted ? (
          <div className="l-panel active">
            <div className="lp-heading">
              <h2>{role === "college_admin" ? "Request Submitted" : "Check Your Email"}</h2>
              <p>
                {role === "college_admin"
                  ? "We've received your institution's registration request. A super admin will review it, and you'll be notified once your account is approved."
                  : "Your account was created. Please sign in to continue."}
              </p>
            </div>
            <a href={role === "college_admin" ? "/institutional" : role === "hr" ? "/hr" : "/learner"} className="l-submit l-submit-blue" style={{ textDecoration: "none" }}>
              Back to Sign In
            </a>
          </div>
        ) : (
          <div className="l-panel active">
            <div className="lp-heading">
              <h2>{copy.heading}</h2>
              <p>{copy.sub}</p>
            </div>

            <label className="lbl">{copy.nameLabel}</label>
            <input
              type="text"
              className="fi"
              placeholder={copy.namePlaceholder}
              style={{ marginBottom: "12px" }}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            {role === "hr" && (
              <>
                <label className="lbl">Company Name</label>
                <input
                  type="text"
                  className="fi"
                  placeholder="BUDDIES Global"
                  style={{ marginBottom: "12px" }}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </>
            )}

            <label className="lbl">{role === "college_admin" ? "Admin Email" : "Email Address"}</label>
            <input
              type="email"
              className="fi"
              placeholder={role === "college_admin" ? "admin@college.edu" : "name@gmail.com"}
              style={{ marginBottom: "12px" }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label className="lbl">Phone Number (optional)</label>
            <input
              type="tel"
              className="fi"
              placeholder="+91 98765 43210"
              style={{ marginBottom: "12px" }}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <label className="lbl">{role === "college_admin" ? "Create Password" : "Password"}</label>
            <input
              type="password"
              className="fi"
              placeholder="••••••••"
              style={{ marginBottom: "14px" }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />

            {error && (
              <div className="auth-warn" style={{ display: "block", marginBottom: "12px" }}>
                {error}
              </div>
            )}

            <button className="l-submit l-submit-blue" style={{ width: "100%" }} onClick={handleSubmit} disabled={loading}>
              {loading ? "Submitting..." : copy.submitLabel}
            </button>

            {role !== "college_admin" && (
              <>
                <div className="or-div" style={{ marginTop: "16px" }}>
                  OR
                </div>
                <GoogleLoginButton onError={setError} />
              </>
            )}

            <div className="l-footer" style={{ marginTop: "16px" }}>
              Already have an account?{" "}
              <a
                href={role === "college_admin" ? "/institutional" : role === "hr" ? "/hr" : "/learner"}
              >
                Sign in
              </a>
            </div>
          </div>
        )}
      </div>
    </AuthSplitLayout>
  );
}
