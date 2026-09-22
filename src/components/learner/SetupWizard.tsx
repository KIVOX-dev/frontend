"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Briefcase, GraduationCap, FileText, Target, Award, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";
import { useUiStore } from "@/stores/uiStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type StudentSetupProfile = {
  education?: unknown[] | null;
  work_experience?: unknown[] | null;
  target_job_role?: string | null;
};

type JobRole = {
  id: string;
  title: string;
  description: string;
  skill_count: number;
};

type BadgeProgress = {
  skill_name: string;
  badge_count: number;
  certificate_issued: boolean;
  badges_remaining: number;
};

type RoadmapStep = { skill: string; badge_progress: BadgeProgress };

type Roadmap = {
  role: { id: string; title: string; description: string };
  steps: RoadmapStep[];
  role_certificate: { id: string; role_title: string; issued_at: string } | null;
};

type StepId = "profile" | "education" | "experience" | "job-role" | "roadmap";

/**
 * "Complete Setup" checklist — Profile/Education/Work Experience read real
 * completion off GET /students/profile; "Choose Your Job Role" and
 * "Complete Your Role Roadmap" are new, backed by /roadmap/* (see
 * roadmap.service.js). The roadmap step's own certificate check
 * (role_certificate !== null) mirrors the same skill-badge system already
 * shown on Profile > Skills (SkillsSection.tsx).
 */
export function SetupWizard() {
  const router = useRouter();
  const setActiveScreen = useUiStore((s) => s.setActiveScreen);

  const [profile, setProfile] = useState<StudentSetupProfile | null>(null);
  const [roles, setRoles] = useState<JobRole[] | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [openStep, setOpenStep] = useState<StepId | null>(null);

  const loadRoadmap = (roleId: string) => {
    api
      .get<Roadmap>(`/roadmap/roles/${roleId}`)
      .then((res) => setRoadmap(res.data))
      .catch(() => setRoadmap(null));
  };

  useEffect(() => {
    setError("");
    Promise.all([api.get<StudentSetupProfile>("/students/profile"), api.get<JobRole[]>("/roadmap/roles")])
      .then(([profileRes, rolesRes]) => {
        setProfile(profileRes.data);
        setRoles(rolesRes.data);
        if (profileRes.data.target_job_role) loadRoadmap(profileRes.data.target_job_role);
      })
      .catch((err: unknown) => setError(extractErrorMessage(err, "Couldn't load your setup progress")))
      .finally(() => setLoading(false));
  }, []);

  const handleChooseRole = async (roleId: string) => {
    setSavingRoleId(roleId);
    setError("");
    try {
      await api.put("/roadmap/target-role", { roleId });
      setProfile((prev) => (prev ? { ...prev, target_job_role: roleId } : prev));
      loadRoadmap(roleId);
      setOpenStep("roadmap");
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Couldn't save that job role"));
    } finally {
      setSavingRoleId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-ink-muted" />
      </div>
    );
  }

  const educationDone = (profile?.education?.length ?? 0) > 0;
  const experienceDone = (profile?.work_experience?.length ?? 0) > 0;
  const jobRoleDone = Boolean(profile?.target_job_role);
  const roadmapDone = Boolean(roadmap?.role_certificate);

  const steps: {
    id: StepId;
    title: string;
    time: string;
    description: string;
    complete: boolean;
  }[] = [
    { id: "profile", title: "Create Your Profile", time: "2 minutes", description: "Your basic profile is already set up from sign-up.", complete: true },
    { id: "education", title: "Add Educational Background", time: "4 minutes", description: "Add your schools, degrees, and fields of study.", complete: educationDone },
    { id: "experience", title: "Include Work Experience", time: "4 minutes", description: "Add internships or jobs you've held.", complete: experienceDone },
    { id: "job-role", title: "Choose Your Job Role", time: "1 minute", description: "Pick the role you're aiming for — it drives your video roadmap.", complete: jobRoleDone },
    {
      id: "roadmap",
      title: roadmap ? `Complete Your ${roadmap.role.title} Roadmap` : "Complete Your Role Roadmap",
      time: roadmap ? `${roadmap.steps.length} skill badges` : "a few minutes",
      description: "Earn every skill badge in your roadmap to unlock a role certificate.",
      complete: roadmapDone,
    },
  ];

  const completedCount = steps.filter((s) => s.complete).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);
  const currentStep = openStep ?? steps.find((s) => !s.complete)?.id ?? steps[steps.length - 1].id;

  const goToProfileTab = (tab: "career") => {
    router.push(`/learner?screen=profile-info&tab=${tab}`);
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-heading-l mb-1">Complete Setup</h1>
        <p className="text-body text-ink-muted">Build your profile in minutes. Get noticed by recruiters and unlock verified opportunities.</p>
      </div>

      <div className="flex gap-1.5 mb-8">
        {steps.map((s) => (
          <div key={s.id} className={cn("h-1.5 flex-1 rounded-full", s.complete ? "bg-success" : "bg-paper-tint")} />
        ))}
      </div>

      {error && <p className="text-small text-danger mb-4">{error}</p>}

      <div className="space-y-3">
        {steps.map((step, index) => {
          const isOpen = currentStep === step.id;
          return (
            <Card key={step.id} className={cn("p-0 overflow-hidden", isOpen && "border-primary")}>
              <button
                type="button"
                className="w-full flex items-center gap-3 p-4 text-left"
                onClick={() => setOpenStep(isOpen ? null : step.id)}
              >
                {step.complete ? (
                  <CheckCircle2 className="size-6 text-success shrink-0" />
                ) : (
                  <span className="size-6 rounded-full border-2 border-line flex items-center justify-center text-caption font-semibold text-ink-muted shrink-0">
                    {index + 1}
                  </span>
                )}
                <span className={cn("flex-1 font-semibold", step.complete && "line-through text-ink-muted")}>{step.title}</span>
                <span className="text-caption text-ink-muted whitespace-nowrap">{step.time}</span>
              </button>

              {isOpen && (
                <div className="border-t border-line p-4 pt-3">
                  <p className="text-small mb-4">{step.description}</p>

                  {step.id === "education" && !educationDone && (
                    <Button size="sm" onClick={() => goToProfileTab("career")}>
                      <GraduationCap className="size-4" /> Add Education
                    </Button>
                  )}
                  {step.id === "experience" && !experienceDone && (
                    <Button size="sm" onClick={() => goToProfileTab("career")}>
                      <Briefcase className="size-4" /> Add Work Experience
                    </Button>
                  )}

                  {step.id === "job-role" && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {(roles || []).map((role) => (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => handleChooseRole(role.id)}
                          disabled={savingRoleId !== null}
                          className={cn(
                            "text-left rounded-md border p-3.5 transition-colors",
                            profile?.target_job_role === role.id
                              ? "border-primary bg-[color-mix(in_srgb,var(--color-primary)_6%,white)]"
                              : "border-line hover:border-line-strong"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="size-4 text-primary shrink-0" />
                            <span className="font-semibold text-ink">{role.title}</span>
                            {savingRoleId === role.id && <Loader2 className="size-3.5 animate-spin text-ink-muted" />}
                          </div>
                          <p className="text-caption">{role.description}</p>
                          <p className="text-caption text-ink-muted mt-1">{role.skill_count} skills</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {step.id === "roadmap" && (
                    <>
                      {!jobRoleDone && <p className="text-small text-ink-muted">Choose a job role first to see its roadmap.</p>}
                      {jobRoleDone && !roadmap && <p className="text-small text-ink-muted">Loading roadmap…</p>}
                      {jobRoleDone && roadmap && (
                        <div className="space-y-2">
                          {roadmap.steps.map((s) => (
                            <div key={s.skill} className="flex items-center gap-2 text-small">
                              {s.badge_progress.certificate_issued ? (
                                <CheckCircle2 className="size-4 text-success shrink-0" />
                              ) : (
                                <Circle className="size-4 text-ink-faint shrink-0" />
                              )}
                              <span className="font-medium text-ink">{s.skill}</span>
                              <span className="text-caption text-ink-muted">
                                {s.badge_progress.badge_count}/5 lessons passed
                              </span>
                            </div>
                          ))}
                          {roadmap.role_certificate ? (
                            <div className="flex items-center gap-2 mt-3 text-small text-success font-semibold">
                              <Award className="size-4" /> {roadmap.role.title} certificate earned!
                            </div>
                          ) : (
                            <Button size="sm" className="mt-3" onClick={() => setActiveScreen("youtube-course-import")}>
                              <FileText className="size-4" /> Watch suggested videos
                            </Button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <p className="text-caption text-ink-muted text-center mt-6">{progressPct}% complete</p>
    </div>
  );
}
