/* The paid plan is set only by a verified payment on the server (see node-api payment.service.js).
   It lives in the user's preferences as plan, plan_id and plan_expires_at. */

type PlanUser = {
  role?: string;
  college_id?: string;
  preferences?: unknown;
} | null | undefined;

export type PlanStatus = {
  /** Can this account buy a plan online? Independent learners and recruiters only. */
  eligible: boolean;
  /** Pro and not past its end date. */
  isPro: boolean;
  expiresAt: Date | null;
};

export function planStatus(user: PlanUser, now: Date = new Date()): PlanStatus {
  const prefs = (user?.preferences ?? {}) as Record<string, unknown>;
  const raw = typeof prefs["plan_expires_at"] === "string" ? new Date(prefs["plan_expires_at"] as string) : null;
  const expiresAt = raw && !Number.isNaN(raw.getTime()) ? raw : null;
  const eligible =
    user?.role === "hr" || user?.role === "recruiter" || (user?.role === "student" && !user?.college_id);
  const isPro = prefs["plan"] === "pro" && (!expiresAt || expiresAt > now);
  return { eligible, isPro, expiresAt };
}

export function formatPlanDate(date: Date): string {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
