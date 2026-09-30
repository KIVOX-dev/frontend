// Higher-study admissions and competitive-exam results — what the backend's
// /outcomes endpoints return and accept. Shared by the student's Placements
// screen (reporting their own) and the admin's Reports & Compliance screen
// (entering on someone's behalf, verifying, reviewing).

export const EXAMS = ["GATE", "NET", "SET", "CAT", "GRE", "GMAT", "TOEFL", "IELTS", "UPSC", "Other"] as const;

export type VerificationStatus = "pending" | "verified" | "rejected";

export type StudentOutcome = {
  id: string;
  student_id: string;
  type: "higher_study" | "competitive_exam";
  course?: string;
  institution_name?: string;
  admission_year?: number;
  exam?: string;
  exam_year?: number;
  score?: string;
  rank_or_percentile?: string;
  qualified?: boolean;
  proof_url?: string;
  verification_status: VerificationStatus;
  created_at?: string;
};

export const STATUS_LABEL: Record<VerificationStatus, string> = {
  pending: "Awaiting verification",
  verified: "Verified",
  rejected: "Rejected",
};

export const STATUS_BADGE: Record<VerificationStatus, string> = { pending: "ba", verified: "bg", rejected: "br" };

/**
 * A multipart body for POST /outcomes. The shared `api` instance defaults to
 * Content-Type: application/json, which would make axios JSON.stringify a
 * FormData; callers pass MULTIPART to clear it so the browser sets the real
 * multipart header (with its boundary) itself.
 */
export const MULTIPART = { headers: { "Content-Type": undefined } } as const;

export function outcomeFormData(fields: Record<string, string | boolean | undefined>, file?: File | null): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === "") continue;
    form.append(key, String(value));
  }
  if (file) form.append("proof_file", file);
  return form;
}
