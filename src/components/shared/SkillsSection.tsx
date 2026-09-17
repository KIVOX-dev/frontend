"use client";

import { useEffect, useState } from "react";
import { Award, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type SkillBadge = {
  skill_name: string;
  badge_count: number;
  certificate_issued: boolean;
  badges_remaining: number;
};

type Certificate = {
  id: string;
  skill_name: string;
  issued_at: string;
  verify_url: string;
  linkedin_add_url: string;
};

const BADGES_PER_CERTIFICATE = 5;

/**
 * Skill badges + certificates earned from passing YouTube-to-Course lesson
 * assessments — see course.service.js#_awardSkillProgress. A skill's badge
 * comes from the same title used to generate that lesson's quiz
 * (config/skillCatalog.js), so a lesson with no recognizable skill just
 * doesn't contribute one, rather than guessing. 5 distinct passed lessons of
 * the same skill issue a real certificate — a genuine credential with its
 * own public verification page (verify_url) and a working LinkedIn
 * "Add to Profile" link (linkedin_add_url), not a decorative badge.
 */
export function SkillsSection() {
  const [badges, setBadges] = useState<SkillBadge[] | null>(null);
  const [certificates, setCertificates] = useState<Certificate[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    Promise.all([api.get<SkillBadge[]>("/students/profile/skill-badges"), api.get<Certificate[]>("/students/profile/certificates")])
      .then(([badgesRes, certificatesRes]) => {
        setBadges(badgesRes.data);
        setCertificates(certificatesRes.data);
      })
      .catch((err: unknown) => setError(extractErrorMessage(err, "Couldn't load skills")));
  }, []);

  if (error) return <p className="text-small text-danger">{error}</p>;
  if (badges === null || certificates === null) return <p className="text-small">Loading…</p>;

  const inProgressBadges = badges.filter((b) => !b.certificate_issued);

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-section-title mb-1">Certificates</h2>
        <p className="text-small mb-5">
          Pass {BADGES_PER_CERTIFICATE} different lesson assessments in the same skill to earn a real, verifiable certificate you can add to
          LinkedIn.
        </p>
        {certificates.length === 0 ? (
          <p className="text-small">No certificates yet — keep passing lesson assessments to earn one.</p>
        ) : (
          <div className="space-y-3">
            {certificates.map((certificate) => (
              <div key={certificate.id} className="flex items-center justify-between gap-4 rounded-md border border-line p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center size-10 shrink-0 rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] text-primary">
                    <Award className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{certificate.skill_name} — TalentSnaps Certified</p>
                    <p className="text-small">Issued {new Date(certificate.issued_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="secondary" size="sm" asChild>
                    <a href={certificate.verify_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-3.5" /> View credential
                    </a>
                  </Button>
                  <Button size="sm" asChild>
                    <a href={certificate.linkedin_add_url} target="_blank" rel="noopener noreferrer">
                      Add to LinkedIn
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-section-title mb-1">Skill Badges</h2>
        <p className="text-small mb-5">Earned automatically each time you pass a lesson assessment tagged with a skill.</p>
        {badges.length === 0 ? (
          <p className="text-small">No skill badges yet — pass a lesson assessment under Learnings to earn your first one.</p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {badges.map((badge) => (
              <div
                key={badge.skill_name}
                className={cn(
                  "flex items-center gap-2 rounded-full border pl-1.5 pr-3.5 py-1.5",
                  badge.certificate_issued ? "border-success/40" : "border-line"
                )}
                title={
                  badge.certificate_issued
                    ? `Certified — ${badge.badge_count} lessons passed`
                    : `${badge.badge_count}/${BADGES_PER_CERTIFICATE} lessons passed`
                }
              >
                <span className="flex items-center justify-center size-7 shrink-0 rounded-full bg-[color-mix(in_srgb,var(--color-success)_18%,white)] text-success">
                  <Award className="size-4" />
                </span>
                <span className="text-small font-medium text-ink">{badge.skill_name}</span>
              </div>
            ))}
          </div>
        )}
        {inProgressBadges.length > 0 && (
          <p className="text-caption mt-4">
            {inProgressBadges
              .map((b) => `${b.skill_name} (${b.badges_remaining} more to certify)`)
              .join(" · ")}
          </p>
        )}
      </Card>
    </div>
  );
}
