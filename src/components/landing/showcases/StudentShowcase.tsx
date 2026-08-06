import { SquaresFour, Target, Microphone, FileText } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/Badge";
import { ShowcaseFrame, ShowcaseStatCard } from "./ShowcaseFrame";

const navItems = [
  { icon: SquaresFour, label: "Dashboard", active: true },
  { icon: Target, label: "Practice" },
  { icon: Microphone, label: "Mock Interview" },
  { icon: FileText, label: "Resume Builder" },
];

const recentActivity = [
  { title: "Quantitative Aptitude Test", date: "May 12", pct: 82 },
  { title: "Logical Reasoning Test", date: "May 9", pct: 65 },
];

const challenges = [
  { subject: "Quantitative", topic: "Time & Work", status: "Due", tone: "info" as const },
  { subject: "Logical Reasoning", topic: "Arrangements", status: "Due", tone: "info" as const },
  { subject: "Data Interpretation", topic: "Bar Charts", status: "Weak area", tone: "danger" as const },
  { subject: "Verbal / English", topic: "Reading Comp.", status: "New", tone: "neutral" as const },
];

export function StudentShowcase() {
  return (
    <ShowcaseFrame
      path="/learner"
      navItems={navItems}
      searchPlaceholder="Search practice topics…"
      userInitials="AR"
      showFilter={false}
    >
      <div className="grid grid-cols-4 gap-2.5 mb-3">
        <ShowcaseStatCard label="Tests Completed" value="24" />
        <ShowcaseStatCard label="Avg Accuracy" value="78%" />
        <ShowcaseStatCard label="Day Streak" value="9" />
        <ShowcaseStatCard label="National Rank" value="#142" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="rounded-md border border-line p-3">
          <p className="text-caption font-semibold mb-2.5">Recent Activity</p>
          <div className="space-y-2.5">
            {recentActivity.map((a) => (
              <div key={a.title} className="flex items-center justify-between text-caption">
                <div className="min-w-0">
                  <p className="font-semibold text-ink truncate">{a.title}</p>
                  <p className="text-ink-faint text-[11px]">{a.date}</p>
                </div>
                <span className="text-primary font-semibold shrink-0">{a.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-line p-3">
          <p className="text-caption font-semibold mb-2.5">Today&apos;s Challenges</p>
          <div className="space-y-2">
            {challenges.map((c) => (
              <div key={c.subject} className="flex items-center justify-between gap-2 text-caption">
                <div className="min-w-0">
                  <p className="font-semibold text-ink truncate">{c.subject}</p>
                  <p className="text-ink-faint text-[11px] truncate">{c.topic}</p>
                </div>
                <Badge tone={c.tone} className="shrink-0">{c.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-md border border-line p-3" style={{ background: "linear-gradient(135deg,rgba(27,111,230,.07),rgba(108,92,231,.06))" }}>
        <p className="text-caption font-semibold mb-1.5 text-primary">AI Recommendation</p>
        <p className="text-caption text-ink">
          Your Data Interpretation accuracy dropped 12% this week. Practise bar chart questions today to recover.
        </p>
      </div>
    </ShowcaseFrame>
  );
}
