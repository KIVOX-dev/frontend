"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ShieldCheck, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";
import { Logo } from "@/components/shared/Logo";
import { Card } from "@/components/ui/Card";

type CertificateVerification = {
  id: string;
  type?: "skill" | "role";
  skill_name?: string | null;
  role_title?: string | null;
  issued_at: string;
  student_name: string;
};

/**
 * Public certificate verification page — the certUrl/"Show credential" link
 * on a TalentSnaps skill certificate (see studentSkill.service.js's
 * linkedinAddUrl/certUrl and SkillsSection.tsx's "View credential" button).
 * No auth, no app shell: anyone with the link — a recruiter clicking through
 * from LinkedIn, most likely — needs to be able to load this directly.
 */
export default function VerifyCertificatePage() {
  const params = useParams<{ id: string }>();
  const [certificate, setCertificate] = useState<CertificateVerification | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<CertificateVerification>(`/certificates/${params.id}/verify`)
      .then((res) => setCertificate(res.data))
      .catch((err: unknown) => setError(extractErrorMessage(err, "This certificate could not be found.")))
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-paper-tint p-6">
      <div className="mb-8">
        <Logo variant="brand" height={40} />
      </div>

      <Card className="max-w-md w-full text-center py-10">
        {loading ? (
          <p className="text-small">Verifying…</p>
        ) : error || !certificate ? (
          <>
            <div className="flex items-center justify-center size-14 mx-auto mb-4 rounded-full bg-[color-mix(in_srgb,var(--color-danger)_12%,white)] text-danger">
              <XCircle className="size-7" />
            </div>
            <h1 className="text-section-title mb-2">Certificate not found</h1>
            <p className="text-small">{error}</p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center size-14 mx-auto mb-4 rounded-full bg-[color-mix(in_srgb,var(--color-success)_15%,white)] text-success">
              <ShieldCheck className="size-7" />
            </div>
            <p className="text-caption mb-1">Verified TalentSnaps Certificate</p>
            <h1 className="text-heading-l mb-4">{certificate.type === "role" ? certificate.role_title : certificate.skill_name}</h1>
            <p className="text-small mb-1">
              Awarded to <span className="font-semibold text-ink">{certificate.student_name}</span>
            </p>
            <p className="text-small mb-6">
              {certificate.type === "role"
                ? `For earning every skill badge in the ${certificate.role_title} roadmap on TalentSnaps, issued `
                : `For passing 5 lesson assessments in ${certificate.skill_name} on TalentSnaps, issued `}
              {new Date(certificate.issued_at).toLocaleDateString()}.
            </p>
            <p className="text-caption">Credential ID: {certificate.id}</p>
          </>
        )}
      </Card>
    </div>
  );
}
