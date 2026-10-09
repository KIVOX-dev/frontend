import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export type FocusArea = {
  // "gap" = never attempted at all; "weak" = attempted but scoring low.
  severity: "gap" | "weak";
  text: string;
};

/** "Keep Leveling Up": the next steps that will move the readiness score. Shared by Profile and the learner Dashboard. */
export function KeepLevelingUpCard({ focusAreas, compact = false }: { focusAreas: FocusArea[]; compact?: boolean }) {
  // Compact (dashboard): only the top suggestion. The list is recomputed from real
  // activity, so finishing one drops it out and the next takes its place.
  if (compact) {
    const next = focusAreas[0];
    const more = focusAreas.length - 1;
    const isGap = next?.severity === "gap";
    return (
      <Card>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-semibold text-ink">Keep Leveling Up</h3>
          {more > 0 && <span className="text-caption">{more} more after this</span>}
        </div>
        {next ? (
          <div className={cn("flex gap-2.5 items-start rounded-md p-3 border", isGap ? "bg-[#FFFBEB] border-[#FDE68A]" : "bg-[#EFF6FF] border-[#BFDBFE]")}>
            <span
              className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0 mt-0.5 whitespace-nowrap"
              style={{ background: isGap ? "#FDE68A" : "#BFDBFE", color: isGap ? "#92400E" : "#1D4ED8" }}
            >
              {isGap ? "Try this next" : "Keep going"}
            </span>
            <p className="text-small text-ink">{next.text}</p>
          </div>
        ) : (
          <p className="text-small">You&apos;re all caught up — nothing outstanding right now.</p>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-section-title mb-1">Keep Leveling Up</h3>
      <p className="text-small mb-5">
        {focusAreas.length === 0
          ? "You're in great shape — here's the record backing that up."
          : "You're already putting in real practice — here's exactly what will move your readiness score next."}
      </p>
      {focusAreas.length === 0 ? (
        <p className="text-small">Nothing outstanding — every category is above 60% and your resume/interview activity is complete.</p>
      ) : (
        <div className="space-y-2.5">
          {focusAreas.map((f, i) => {
            const isGap = f.severity === "gap";
            return (
              <div
                key={i}
                className={cn("flex gap-3 items-start rounded-md p-3 border", isGap ? "bg-[#FFFBEB] border-[#FDE68A]" : "bg-[#EFF6FF] border-[#BFDBFE]")}
              >
                <span
                  className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                  style={{ background: isGap ? "#FDE68A" : "#BFDBFE", color: isGap ? "#92400E" : "#1D4ED8" }}
                >
                  {isGap ? "Try this next" : "Keep going"}
                </span>
                <p className="text-small text-ink">{f.text}</p>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
