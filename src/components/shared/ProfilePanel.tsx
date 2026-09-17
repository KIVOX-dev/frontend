"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil, Camera, Plus, Trash2, Briefcase, GraduationCap as GradCapIcon } from "lucide-react";
import { api, type ApiRequestConfig } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";
import { useAuthStore } from "@/stores/authStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Field, Label, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PerformanceSummarySection } from "@/components/shared/PerformanceSummarySection";
import { IntegrationsSection } from "@/components/shared/IntegrationsSection";
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
  avatar_url?: string | null;
  cover_image_url?: string | null;
  work_experience?: WorkExperienceEntry[] | null;
  education?: EducationEntry[] | null;
};

type Department = { id: string; name: string };

type Tab = "profile" | "career" | "student" | "integrations";

type WorkExperienceEntry = {
  id: string;
  jobTitle: string;
  companyName: string;
  workMode: "remote" | "onsite" | "hybrid";
  workType: "internship" | "full_time" | "part_time" | "freelance" | "contract";
  location?: string | null;
  startMonth: number;
  startYear: number;
  endMonth?: number | null;
  endYear?: number | null;
  isCurrent: boolean;
  description?: string | null;
};

type EducationEntry = {
  id: string;
  schoolName: string;
  rollNumber?: string | null;
  degreeType: string;
  fieldOfStudy: string;
  grade?: string | null;
  location?: string | null;
  startMonth: number;
  startYear: number;
  endMonth?: number | null;
  endYear?: number | null;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// A generous range covering both past graduation/work dates and near-future
// "expected" graduation dates — this is a plain <select>, not a date picker,
// so the list just needs to be long enough to never clip a real answer.
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR + 10 - 1970 + 1 }, (_, i) => CURRENT_YEAR + 10 - i);

const WORK_MODE_LABELS: Record<WorkExperienceEntry["workMode"], string> = {
  remote: "Remote",
  onsite: "Onsite",
  hybrid: "Hybrid",
};
const WORK_TYPE_LABELS: Record<WorkExperienceEntry["workType"], string> = {
  internship: "Internship",
  full_time: "Full-time",
  part_time: "Part-time",
  freelance: "Freelance",
  contract: "Contract",
};

function formatDateRange(startMonth: number, startYear: number, endMonth?: number | null, endYear?: number | null, isCurrent?: boolean) {
  const start = `${MONTH_NAMES[startMonth - 1]?.slice(0, 3)} ${startYear}`;
  if (isCurrent) return `${start} - Present`;
  if (endMonth && endYear) return `${start} - ${MONTH_NAMES[endMonth - 1]?.slice(0, 3)} ${endYear}`;
  return start;
}

function MonthYearSelect({
  month,
  year,
  onMonthChange,
  onYearChange,
  disabled,
}: {
  month: number | "";
  year: number | "";
  onMonthChange: (v: number | "") => void;
  onYearChange: (v: number | "") => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <select
        className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        value={month}
        disabled={disabled}
        onChange={(e) => onMonthChange(e.target.value ? Number(e.target.value) : "")}
      >
        <option value="">Month</option>
        {MONTH_NAMES.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>
      <select
        className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        value={year}
        disabled={disabled}
        onChange={(e) => onYearChange(e.target.value ? Number(e.target.value) : "")}
      >
        <option value="">Year</option>
        {YEAR_OPTIONS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

function WorkExperienceModal({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: WorkExperienceEntry | null;
  onSave: (entry: WorkExperienceEntry) => Promise<void>;
}) {
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [workMode, setWorkMode] = useState<WorkExperienceEntry["workMode"] | "">("");
  const [workType, setWorkType] = useState<WorkExperienceEntry["workType"] | "">("");
  const [location, setLocation] = useState("");
  const [startMonth, setStartMonth] = useState<number | "">("");
  const [startYear, setStartYear] = useState<number | "">("");
  const [endMonth, setEndMonth] = useState<number | "">("");
  const [endYear, setEndYear] = useState<number | "">("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Reset (or pre-fill for edit) every time the modal actually opens —
  // not on every render, so typing doesn't get wiped mid-edit.
  useEffect(() => {
    if (!open) return;
    setJobTitle(initial?.jobTitle || "");
    setCompanyName(initial?.companyName || "");
    setWorkMode(initial?.workMode || "");
    setWorkType(initial?.workType || "");
    setLocation(initial?.location || "");
    setStartMonth(initial?.startMonth || "");
    setStartYear(initial?.startYear || "");
    setEndMonth(initial?.endMonth || "");
    setEndYear(initial?.endYear || "");
    setIsCurrent(initial?.isCurrent || false);
    setDescription(initial?.description || "");
    setError("");
  }, [open, initial]);

  const canSave = jobTitle.trim() && companyName.trim() && workMode && workType && startMonth && startYear && (isCurrent || (endMonth && endYear));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave || !workMode || !workType || !startMonth || !startYear) return;
    setSaving(true);
    setError("");
    try {
      await onSave({
        id: initial?.id ?? crypto.randomUUID(),
        jobTitle: jobTitle.trim(),
        companyName: companyName.trim(),
        workMode,
        workType,
        location: location.trim() || null,
        startMonth,
        startYear,
        endMonth: isCurrent ? null : endMonth || null,
        endYear: isCurrent ? null : endYear || null,
        isCurrent,
        description: description.trim() || null,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Couldn't save this entry"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={initial ? "Edit Work Experience" : "Add Work Experience"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-small text-danger">{error}</p>}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field>
            <Label>Job Title *</Label>
            <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Eg. UI/UX Designer" required />
          </Field>
          <Field>
            <Label>Company Name *</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Eg. Microsoft" required />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field>
            <Label>Work Mode *</Label>
            <select
              className="h-11 w-full rounded-md border border-line bg-white px-3.5 text-base text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors duration-150"
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value as WorkExperienceEntry["workMode"])}
              required
            >
              <option value="">Select mode</option>
              {Object.entries(WORK_MODE_LABELS).map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <Label>Work Type *</Label>
            <select
              className="h-11 w-full rounded-md border border-line bg-white px-3.5 text-base text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors duration-150"
              value={workType}
              onChange={(e) => setWorkType(e.target.value as WorkExperienceEntry["workType"])}
              required
            >
              <option value="">Select type</option>
              {Object.entries(WORK_TYPE_LABELS).map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field>
          <Label>Location</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Eg. Bengaluru, India" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field>
            <Label>Start Date *</Label>
            <MonthYearSelect month={startMonth} year={startYear} onMonthChange={setStartMonth} onYearChange={setStartYear} />
          </Field>
          <Field>
            <Label>End Date *</Label>
            <MonthYearSelect month={endMonth} year={endYear} onMonthChange={setEndMonth} onYearChange={setEndYear} disabled={isCurrent} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-small text-ink cursor-pointer">
          <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} className="size-4" />
          I&apos;m currently working here
        </label>
        <Field>
          <Label>About your role</Label>
          <textarea
            className="w-full rounded-md border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors duration-150"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did you work on?"
          />
        </Field>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={!canSave}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function EducationModal({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: EducationEntry | null;
  onSave: (entry: EducationEntry) => Promise<void>;
}) {
  const [schoolName, setSchoolName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [degreeType, setDegreeType] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [grade, setGrade] = useState("");
  const [location, setLocation] = useState("");
  const [startMonth, setStartMonth] = useState<number | "">("");
  const [startYear, setStartYear] = useState<number | "">("");
  const [endMonth, setEndMonth] = useState<number | "">("");
  const [endYear, setEndYear] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setSchoolName(initial?.schoolName || "");
    setRollNumber(initial?.rollNumber || "");
    setDegreeType(initial?.degreeType || "");
    setFieldOfStudy(initial?.fieldOfStudy || "");
    setGrade(initial?.grade || "");
    setLocation(initial?.location || "");
    setStartMonth(initial?.startMonth || "");
    setStartYear(initial?.startYear || "");
    setEndMonth(initial?.endMonth || "");
    setEndYear(initial?.endYear || "");
    setError("");
  }, [open, initial]);

  const canSave = schoolName.trim() && degreeType.trim() && fieldOfStudy.trim() && startMonth && startYear && endMonth && endYear;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave || !startMonth || !startYear || !endMonth || !endYear) return;
    setSaving(true);
    setError("");
    try {
      await onSave({
        id: initial?.id ?? crypto.randomUUID(),
        schoolName: schoolName.trim(),
        rollNumber: rollNumber.trim() || null,
        degreeType: degreeType.trim(),
        fieldOfStudy: fieldOfStudy.trim(),
        grade: grade.trim() || null,
        location: location.trim() || null,
        startMonth,
        startYear,
        endMonth,
        endYear,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Couldn't save this entry"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={initial ? "Edit Education" : "Add Education"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-small text-danger">{error}</p>}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field>
            <Label>School / College name *</Label>
            <Input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="Eg. Anna University" required />
          </Field>
          <Field>
            <Label>Roll number</Label>
            <Input value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} placeholder="Eg. 21CS123" />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field>
            <Label>Degree type *</Label>
            <Input value={degreeType} onChange={(e) => setDegreeType(e.target.value)} placeholder="Eg. B.E / B.Tech" required />
          </Field>
          <Field>
            <Label>Major / Field of study *</Label>
            <Input value={fieldOfStudy} onChange={(e) => setFieldOfStudy(e.target.value)} placeholder="Eg. Computer Science" required />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field>
            <Label>Grade</Label>
            <Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Eg. 8.2 CGPA" />
          </Field>
          <Field>
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Eg. Chennai, India" />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field>
            <Label>Start Date *</Label>
            <MonthYearSelect month={startMonth} year={startYear} onMonthChange={setStartMonth} onYearChange={setStartYear} />
          </Field>
          <Field>
            <Label>End Date (or Expected) *</Label>
            <MonthYearSelect month={endMonth} year={endYear} onMonthChange={setEndMonth} onYearChange={setEndYear} />
          </Field>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={!canSave}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

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

// Horizontal, underline-style tab — matches the reference profile page's tab
// row (About / Career / Projects & Activities / ...), unlike SettingsPanel's
// vertical sidebar tabs.
function ProfileTabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3.5 py-2 text-sm font-medium rounded-t-md -mb-px border-b-2 transition-colors duration-150 whitespace-nowrap",
        active ? "border-primary text-primary" : "border-transparent text-ink-muted hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}

/**
 * The student's own profile — basic info, Student Details (academic record),
 * and Integrations (GitHub/LinkedIn/Stack Overflow real OAuth connections,
 * plus LeetCode/HackerRank/Dribbble username-based ones). Separate from
 * SettingsPanel.tsx (account security only) — this is "who you are",
 * that's "how you log in."
 */
export function ProfilePanel() {
  const { user, updateUser } = useAuthStore();
  const isStudent = user?.role === "student";
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [coverError, setCoverError] = useState("");
  const [workExpModalOpen, setWorkExpModalOpen] = useState(false);
  const [editingWorkExp, setEditingWorkExp] = useState<WorkExperienceEntry | null>(null);
  const [eduModalOpen, setEduModalOpen] = useState(false);
  const [editingEdu, setEditingEdu] = useState<EducationEntry | null>(null);
  const [careerError, setCareerError] = useState("");

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

  // Lands here once, right after an OAuth callback redirect (GitHub/
  // LinkedIn/Stack Overflow — see their respective *AuthService.js on the
  // backend) sends the browser back with `?tab=integrations&...`. Only the
  // tab-routing lives here — IntegrationsSection.tsx reads and strips the
  // provider-specific `<provider>=connected|error&reason=...` params itself,
  // since it's the thing that actually owns that connect/disconnect state
  // (and is also reachable directly from Settings, which never sees this
  // redirect at all).
  useEffect(() => {
    if (searchParams.get("tab") === "integrations") setActiveTab("integrations");
  }, [searchParams]);

  const departmentName = departments.find((d) => d.id === studentProfile?.department_id)?.name;

  const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // mirrors the backend's own cap (upload.js) — fail fast client-side too

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be re-selected later (e.g. after fixing an error)
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setAvatarError("Image must be under 5MB.");
      return;
    }
    setUploadingAvatar(true);
    setAvatarError("");
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      // Content-Type: undefined drops the axios instance's default
      // application/json header so the browser sets the correct
      // multipart/form-data boundary itself — explicitly setting
      // "multipart/form-data" here would omit that boundary and break the upload.
      const res = await api.post<StudentProfile>("/students/profile/avatar", formData, {
        headers: { "Content-Type": undefined },
      } as ApiRequestConfig);
      setStudentProfile(res.data);
      // Keeps the top-right profile chip (ProfileMenu.tsx) in sync instantly —
      // it reads avatar_url off the shared auth store, not this component's
      // own state.
      if (res.data.avatar_url) updateUser({ avatar_url: res.data.avatar_url });
    } catch (err: unknown) {
      setAvatarError(extractErrorMessage(err, "Couldn't upload photo"));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setCoverError("Image must be under 5MB.");
      return;
    }
    setUploadingCover(true);
    setCoverError("");
    try {
      const formData = new FormData();
      formData.append("cover", file);
      const res = await api.post<StudentProfile>("/students/profile/cover", formData, {
        headers: { "Content-Type": undefined },
      } as ApiRequestConfig);
      setStudentProfile(res.data);
    } catch (err: unknown) {
      setCoverError(extractErrorMessage(err, "Couldn't upload cover image"));
    } finally {
      setUploadingCover(false);
    }
  };

  // Full-array save, not a per-entry endpoint — matches
  // studentProfile.service.js#updateOwn's "replace the whole array" design.
  // Left un-caught here on purpose: WorkExperienceModal/EducationModal's own
  // onSave wraps this in try/catch and shows the error inline in the modal.
  const handleSaveWorkExperience = async (entry: WorkExperienceEntry) => {
    const current = studentProfile?.work_experience || [];
    const next = current.some((e) => e.id === entry.id) ? current.map((e) => (e.id === entry.id ? entry : e)) : [...current, entry];
    const res = await api.put<StudentProfile>("/students/profile", { workExperience: next });
    setStudentProfile(res.data);
  };

  const handleDeleteWorkExperience = async (id: string) => {
    if (!window.confirm("Delete this work experience entry?")) return;
    setCareerError("");
    try {
      const next = (studentProfile?.work_experience || []).filter((e) => e.id !== id);
      const res = await api.put<StudentProfile>("/students/profile", { workExperience: next });
      setStudentProfile(res.data);
    } catch (err: unknown) {
      setCareerError(extractErrorMessage(err, "Couldn't delete this entry"));
    }
  };

  const handleSaveEducation = async (entry: EducationEntry) => {
    const current = studentProfile?.education || [];
    const next = current.some((e) => e.id === entry.id) ? current.map((e) => (e.id === entry.id ? entry : e)) : [...current, entry];
    const res = await api.put<StudentProfile>("/students/profile", { education: next });
    setStudentProfile(res.data);
  };

  const handleDeleteEducation = async (id: string) => {
    if (!window.confirm("Delete this education entry?")) return;
    setCareerError("");
    try {
      const next = (studentProfile?.education || []).filter((e) => e.id !== id);
      const res = await api.put<StudentProfile>("/students/profile", { education: next });
      setStudentProfile(res.data);
    } catch (err: unknown) {
      setCareerError(extractErrorMessage(err, "Couldn't delete this entry"));
    }
  };

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

  const initials = (user?.name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      {/* Cover banner */}
      <div className="relative h-32 md:h-40 rounded-xl overflow-hidden">
        {studentProfile?.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- externally hosted (GCS), not a static/imported asset next/image expects
          <img src={studentProfile.cover_image_url} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, color-mix(in srgb, var(--color-primary) 55%, white) 100%)" }}
          />
        )}
        {isStudent && (
          <label className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md bg-black/50 hover:bg-black/65 text-white text-xs font-medium px-2.5 py-1.5 cursor-pointer transition-colors">
            <Camera className="size-3.5" />
            {uploadingCover ? "Uploading…" : "Edit banner"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleUploadCover}
              disabled={uploadingCover}
            />
          </label>
        )}
      </div>
      {coverError && <p className="text-small text-danger mt-1 px-2">{coverError}</p>}

      {/* Avatar + identity, overlapping the banner */}
      <div className="flex flex-wrap items-end justify-between gap-4 px-2 -mt-12 md:-mt-14 mb-6">
        <div className="flex items-end gap-4 min-w-0">
          <div className="relative shrink-0">
            <Avatar
              src={studentProfile?.avatar_url}
              fallback={initials}
              size="lg"
              className="size-24 md:size-28 text-3xl ring-4 ring-white shadow-md"
            />
            {isStudent && (
              <label className="absolute bottom-0 right-0 flex items-center justify-center size-8 rounded-full bg-ink text-white cursor-pointer shadow-md hover:bg-ink/90 transition-colors">
                <Camera className="size-4" />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleUploadAvatar}
                  disabled={uploadingAvatar}
                />
              </label>
            )}
          </div>
          <div className="pb-1 min-w-0">
            <h1 className="text-heading-l text-ink leading-tight truncate">{user?.name}</h1>
            <p className="text-small text-ink-muted truncate">{user?.email}</p>
          </div>
        </div>
        <Badge tone="success" className="capitalize mb-2 shrink-0">
          {user?.role?.replace("_", " ")}
        </Badge>
      </div>

      {/* Kept out of the identity row above on purpose — that row uses
          items-end (bottom-aligns the fixed-height avatar against the
          name/email text), so any extra line rendered inside it shifts the
          alignment math and can visually collide with the name heading. */}
      {(avatarError || uploadingAvatar) && (
        <p className={cn("text-small px-2 mb-4 -mt-2", avatarError ? "text-danger" : "text-ink-muted")}>
          {avatarError || "Uploading photo…"}
        </p>
      )}

      {/* Horizontal tabs */}
      <div className="flex gap-1 border-b border-line mb-6 overflow-x-auto">
        <ProfileTabButton active={activeTab === "profile"} onClick={() => setActiveTab("profile")}>
          About
        </ProfileTabButton>
        {isStudent && (
          <ProfileTabButton active={activeTab === "career"} onClick={() => setActiveTab("career")}>
            Career
          </ProfileTabButton>
        )}
        {isStudent && (
          <ProfileTabButton active={activeTab === "student"} onClick={() => setActiveTab("student")}>
            Student Details
          </ProfileTabButton>
        )}
        {isStudent && (
          <ProfileTabButton active={activeTab === "integrations"} onClick={() => setActiveTab("integrations")}>
            Integrations
          </ProfileTabButton>
        )}
      </div>

      {/* Content */}
      <div>
        {activeTab === "profile" && (
            <div className="space-y-4">
              <Card>
                <h2 className="text-section-title mb-5">About</h2>
                <div className="grid sm:grid-cols-2 gap-5 max-w-lg">
                  <ReadOnlyField label="Name" value={user?.name} />
                  <ReadOnlyField label="Email" value={user?.email} />
                  <ReadOnlyField label="Role" value={<span className="capitalize">{user?.role?.replace("_", " ")}</span>} />
                </div>
              </Card>

              {/* Formerly the separate "Profile Summarizer" screen — folded
                  in here since it's the same subject (this student's own
                  activity), not a separate destination. Student-only: it
                  reads from studentProfile.service.js#getSummary, which
                  requires a students row. */}
              {isStudent && <PerformanceSummarySection />}
            </div>
          )}

          {activeTab === "career" && isStudent && (
            <div className="space-y-6">
              {careerError && <p className="text-small text-danger">{careerError}</p>}

              <Card>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-section-title">Work Experience</h2>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditingWorkExp(null);
                      setWorkExpModalOpen(true);
                    }}
                  >
                    <Plus className="size-3.5" />
                    Add Experience
                  </Button>
                </div>
                {!studentProfile?.work_experience || studentProfile.work_experience.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-line rounded-lg">
                    <Briefcase className="size-6 mx-auto mb-2 text-ink-muted" />
                    <p className="font-medium text-ink mb-1">No Experience Added Yet</p>
                    <p className="text-small mb-4">Add your internships, part-time roles, or professional experience.</p>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingWorkExp(null);
                        setWorkExpModalOpen(true);
                      }}
                    >
                      <Plus className="size-3.5" />
                      Add Experience
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {studentProfile.work_experience.map((entry) => (
                      <div key={entry.id} className="flex items-start justify-between gap-4 rounded-md border border-line p-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">{entry.jobTitle}</p>
                          <p className="text-small">
                            {entry.companyName} · {WORK_TYPE_LABELS[entry.workType]} · {WORK_MODE_LABELS[entry.workMode]}
                          </p>
                          <p className="text-caption mt-1">
                            {formatDateRange(entry.startMonth, entry.startYear, entry.endMonth, entry.endYear, entry.isCurrent)}
                            {entry.location ? ` · ${entry.location}` : ""}
                          </p>
                          {entry.description && <p className="text-small text-ink mt-2">{entry.description}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            className="p-1.5 rounded text-ink-muted hover:text-ink hover:bg-paper-tint"
                            aria-label="Edit"
                            onClick={() => {
                              setEditingWorkExp(entry);
                              setWorkExpModalOpen(true);
                            }}
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            className="p-1.5 rounded text-ink-muted hover:text-danger hover:bg-paper-tint"
                            aria-label="Delete"
                            onClick={() => handleDeleteWorkExperience(entry.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-section-title">Education</h2>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditingEdu(null);
                      setEduModalOpen(true);
                    }}
                  >
                    <Plus className="size-3.5" />
                    Add Education
                  </Button>
                </div>
                {!studentProfile?.education || studentProfile.education.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-line rounded-lg">
                    <GradCapIcon className="size-6 mx-auto mb-2 text-ink-muted" />
                    <p className="font-medium text-ink mb-1">No Education Added Yet</p>
                    <p className="text-small mb-4">Add your schools, colleges, and degrees.</p>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingEdu(null);
                        setEduModalOpen(true);
                      }}
                    >
                      <Plus className="size-3.5" />
                      Add Education
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {studentProfile.education.map((entry) => (
                      <div key={entry.id} className="flex items-start justify-between gap-4 rounded-md border border-line p-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">{entry.schoolName}</p>
                          <p className="text-small">
                            {entry.degreeType} in {entry.fieldOfStudy}
                            {entry.grade ? ` · ${entry.grade}` : ""}
                          </p>
                          <p className="text-caption mt-1">
                            {formatDateRange(entry.startMonth, entry.startYear, entry.endMonth, entry.endYear)}
                            {entry.location ? ` · ${entry.location}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            className="p-1.5 rounded text-ink-muted hover:text-ink hover:bg-paper-tint"
                            aria-label="Edit"
                            onClick={() => {
                              setEditingEdu(entry);
                              setEduModalOpen(true);
                            }}
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            className="p-1.5 rounded text-ink-muted hover:text-danger hover:bg-paper-tint"
                            aria-label="Delete"
                            onClick={() => handleDeleteEducation(entry.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <WorkExperienceModal
                open={workExpModalOpen}
                onOpenChange={setWorkExpModalOpen}
                initial={editingWorkExp}
                onSave={handleSaveWorkExperience}
              />
              <EducationModal open={eduModalOpen} onOpenChange={setEduModalOpen} initial={editingEdu} onSave={handleSaveEducation} />
            </div>
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

          {activeTab === "integrations" && isStudent && <IntegrationsSection />}
      </div>
    </div>
  );
}
