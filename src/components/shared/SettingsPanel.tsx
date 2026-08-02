"use client";

import React, { useState, useEffect } from "react";
import { User, ShieldCheck, GraduationCap, LogOut, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";
import { useAuthStore } from "@/stores/authStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Field, Label, Input, FieldError } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

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

type Tab = "profile" | "security" | "student";

function capitalize(value?: string | null) {
  if (!value) return undefined;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function ReadOnlyField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption mb-1">{label}</p>
      <p className="text-sm font-semibold text-ink">{value ?? "—"}</p>
    </div>
  );
}

function TabButton({
  active,
  icon: Icon,
  children,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-left transition-colors duration-150 w-full",
        active ? "bg-primary/10 text-primary" : "text-ink-muted hover:bg-paper-tint hover:text-ink"
      )}
    >
      <Icon className="size-4 shrink-0" />
      {children}
    </button>
  );
}

export function SettingsPanel() {
  const { user, logout } = useAuthStore();
  const isStudent = user?.role === "student";

  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const [pwdForm, setPwdForm] = useState({ current_password: "", new_password: "" });
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);

  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [profileLoading, setProfileLoading] = useState(isStudent);
  const [profileMissing, setProfileMissing] = useState(false);

  // Only fields PUT /students/profile actually accepts — batch_year, cgpa,
  // placement_status, and the stat fields below are admin/system-managed
  // and stay read-only display.
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    department_id: "",
    roll_number: "",
    year_of_study: "",
    semester: "",
    section: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    address: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  useEffect(() => {
    if (!isStudent) return;
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
  }, [isStudent]);

  const departmentName = departments.find((d) => d.id === studentProfile?.department_id)?.name;

  const startEditingProfile = () => {
    if (!studentProfile) return;
    setProfileForm({
      department_id: studentProfile.department_id || "",
      roll_number: studentProfile.roll_number || "",
      year_of_study: studentProfile.year_of_study?.toString() || "",
      semester: studentProfile.semester?.toString() || "",
      section: studentProfile.section || "",
      phone: studentProfile.phone || "",
      date_of_birth: studentProfile.date_of_birth ? studentProfile.date_of_birth.slice(0, 10) : "",
      gender: studentProfile.gender || "",
      address: studentProfile.address || "",
    });
    setProfileMsg("");
    setEditingProfile(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg("");
    try {
      const res = await api.put<StudentProfile>("/students/profile", {
        departmentId: profileForm.department_id || undefined,
        rollNumber: profileForm.roll_number || undefined,
        year: profileForm.year_of_study ? Number(profileForm.year_of_study) : undefined,
        semester: profileForm.semester ? Number(profileForm.semester) : undefined,
        section: profileForm.section || undefined,
        phone: profileForm.phone,
        dateOfBirth: profileForm.date_of_birth || null,
        gender: profileForm.gender,
        address: profileForm.address,
      });
      setStudentProfile(res.data);
      setEditingProfile(false);
    } catch (err: unknown) {
      setProfileMsg(extractErrorMessage(err, "Failed to update profile"));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg("");
    setPwdError("");
    setChangingPwd(true);
    try {
      await api.put("/auth/change-password", pwdForm);
      setPwdMsg("Password changed successfully.");
      setPwdForm({ current_password: "", new_password: "" });
    } catch (err: unknown) {
      setPwdError(extractErrorMessage(err, "Failed to change password"));
    } finally {
      setChangingPwd(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const initials = (user?.name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-heading-l mb-1">Settings</h1>
        <p className="text-body text-ink-muted">Manage your account and profile.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: identity + tabs */}
        <div className="md:w-64 shrink-0 space-y-4">
          <Card className="flex flex-col items-center text-center py-8">
            <Avatar fallback={initials} size="lg" className="mb-3" />
            <p className="font-semibold text-ink truncate max-w-full">{user?.name}</p>
            <p className="text-small truncate max-w-full">{user?.email}</p>
            <Badge tone="success" className="mt-3 capitalize">
              {user?.role?.replace("_", " ")}
            </Badge>
          </Card>

          <nav className="flex md:flex-col gap-1">
            <TabButton active={activeTab === "profile"} icon={User} onClick={() => setActiveTab("profile")}>
              Profile
            </TabButton>
            <TabButton active={activeTab === "security"} icon={ShieldCheck} onClick={() => setActiveTab("security")}>
              Security
            </TabButton>
            {isStudent && (
              <TabButton active={activeTab === "student"} icon={GraduationCap} onClick={() => setActiveTab("student")}>
                Student Details
              </TabButton>
            )}
          </nav>

          <Button variant="danger" className="w-full justify-center" onClick={handleLogout}>
            <LogOut className="size-4" />
            Log Out
          </Button>
        </div>

        {/* Right: content */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && (
            <Card>
              <h2 className="text-section-title mb-5">Profile</h2>
              <div className="grid sm:grid-cols-2 gap-5 max-w-lg">
                <ReadOnlyField label="Name" value={user?.name} />
                <ReadOnlyField label="Email" value={user?.email} />
                <ReadOnlyField label="Role" value={<span className="capitalize">{user?.role?.replace("_", " ")}</span>} />
              </div>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="max-w-md">
              <h2 className="text-section-title mb-5">Change Password</h2>
              {pwdMsg && <p className="text-small text-success mb-4">{pwdMsg}</p>}
              <form onSubmit={handleChangePassword} className="space-y-4">
                <Field>
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={pwdForm.current_password}
                    onChange={(e) => setPwdForm({ ...pwdForm, current_password: e.target.value })}
                    required
                  />
                </Field>
                <Field>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={pwdForm.new_password}
                    onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                    placeholder="Must contain letters and numbers"
                    required
                    error={pwdError}
                  />
                  <FieldError>{pwdError}</FieldError>
                </Field>
                <Button type="submit" className="w-full justify-center" loading={changingPwd}>
                  Update Password
                </Button>
              </form>
            </Card>
          )}

          {activeTab === "student" && isStudent && (
            <Card>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-section-title">Student Details</h2>
                {!profileLoading && !profileMissing && studentProfile && !editingProfile && (
                  <Button variant="secondary" size="sm" onClick={startEditingProfile}>
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                )}
              </div>

              {profileLoading ? (
                <p className="text-small">Loading…</p>
              ) : profileMissing || !studentProfile ? (
                <p className="text-small">
                  Your student profile hasn&apos;t been set up yet. Contact your institution admin.
                </p>
              ) : editingProfile ? (
                <form onSubmit={handleSaveProfile}>
                  {profileMsg && <p className="text-small text-danger mb-4">{profileMsg}</p>}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                    <Field>
                      <Label>Roll Number</Label>
                      <Input
                        value={profileForm.roll_number}
                        onChange={(e) => setProfileForm({ ...profileForm, roll_number: e.target.value })}
                      />
                    </Field>
                    <Field>
                      <Label>Department</Label>
                      <select
                        className="h-11 w-full rounded-md border border-line bg-white px-3.5 text-base text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors duration-150"
                        value={profileForm.department_id}
                        onChange={(e) => setProfileForm({ ...profileForm, department_id: e.target.value })}
                      >
                        <option value="">Select department</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field>
                      <Label>Year of Study</Label>
                      <Input
                        type="number"
                        min={1}
                        max={6}
                        value={profileForm.year_of_study}
                        onChange={(e) => setProfileForm({ ...profileForm, year_of_study: e.target.value })}
                      />
                    </Field>
                    <Field>
                      <Label>Semester</Label>
                      <Input
                        type="number"
                        min={1}
                        max={12}
                        value={profileForm.semester}
                        onChange={(e) => setProfileForm({ ...profileForm, semester: e.target.value })}
                      />
                    </Field>
                    <Field>
                      <Label>Section</Label>
                      <Input
                        value={profileForm.section}
                        onChange={(e) => setProfileForm({ ...profileForm, section: e.target.value })}
                      />
                    </Field>
                    <Field>
                      <Label>Phone</Label>
                      <Input
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      />
                    </Field>
                    <Field>
                      <Label>Gender</Label>
                      <Input
                        value={profileForm.gender}
                        onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                      />
                    </Field>
                    <Field>
                      <Label>Date of Birth</Label>
                      <Input
                        type="date"
                        value={profileForm.date_of_birth}
                        onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })}
                      />
                    </Field>
                    <Field className="sm:col-span-2 lg:col-span-4">
                      <Label>Address</Label>
                      <Input
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      />
                    </Field>
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" loading={savingProfile}>
                      Save
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setEditingProfile(false)} disabled={savingProfile}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-7">
                  <section>
                    <p className="text-caption font-semibold uppercase tracking-wide mb-4">Academic</p>
                    <div className="grid sm:grid-cols-3 gap-x-6 gap-y-5">
                      <ReadOnlyField label="Roll Number" value={studentProfile.roll_number} />
                      <ReadOnlyField label="Department" value={departmentName} />
                      <ReadOnlyField label="Batch Year" value={studentProfile.batch_year} />
                      <ReadOnlyField label="Year of Study" value={studentProfile.year_of_study} />
                      <ReadOnlyField label="Semester" value={studentProfile.semester} />
                      <ReadOnlyField label="Section" value={studentProfile.section?.toUpperCase()} />
                    </div>
                  </section>

                  <section className="border-t border-line pt-7">
                    <p className="text-caption font-semibold uppercase tracking-wide mb-4">Performance</p>
                    <div className="grid sm:grid-cols-3 gap-x-6 gap-y-5">
                      <ReadOnlyField label="CGPA" value={studentProfile.cgpa} />
                      <ReadOnlyField label="Placement Status" value={capitalize(studentProfile.placement_status)} />
                      <ReadOnlyField label="Tests Completed" value={studentProfile.tests_completed} />
                      <ReadOnlyField
                        label="Avg Accuracy"
                        value={studentProfile.avg_accuracy != null ? `${studentProfile.avg_accuracy}%` : undefined}
                      />
                      <ReadOnlyField label="Day Streak" value={studentProfile.streak_days} />
                      <ReadOnlyField label="Interviews Completed" value={studentProfile.interviews_completed} />
                    </div>
                  </section>

                  <section className="border-t border-line pt-7">
                    <p className="text-caption font-semibold uppercase tracking-wide mb-4">Personal</p>
                    <div className="grid sm:grid-cols-3 gap-x-6 gap-y-5 mb-5">
                      <ReadOnlyField label="Phone" value={studentProfile.phone} />
                      <ReadOnlyField label="Gender" value={capitalize(studentProfile.gender)} />
                      <ReadOnlyField
                        label="Date of Birth"
                        value={studentProfile.date_of_birth ? new Date(studentProfile.date_of_birth).toLocaleDateString() : undefined}
                      />
                    </div>
                    <ReadOnlyField label="Address" value={studentProfile.address} />
                  </section>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
