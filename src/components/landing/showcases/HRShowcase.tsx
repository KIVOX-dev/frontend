import { LayoutDashboard, Briefcase, Users, Trophy, LineChart } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { ShowcaseFrame, ShowcaseStatCard } from "./ShowcaseFrame";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Briefcase, label: "Post a Vacancy" },
  { icon: Users, label: "Applicants" },
  { icon: Trophy, label: "Talent Board" },
  { icon: LineChart, label: "Candidate Analytics" },
];

const applicants = [
  { name: "Ananya Rao", job: "Full Stack Developer", status: "Shortlisted" as const },
  { name: "Vikram Shah", job: "Data Analyst", status: "Under Review" as const },
  { name: "Deepa Nair", job: "Full Stack Developer", status: "Under Review" as const },
];

const statusTone = { Shortlisted: "success", "Under Review": "info" } as const;

const vacancies = [
  { title: "Full Stack Developer", meta: "TCS · Full-time" },
  { title: "Data Analyst", meta: "TCS · Internship" },
];

const talentBoard = [
  { rank: 1, name: "Priya Menon", department: "Computer Science", tests: 12, score: "94.2" },
  { rank: 2, name: "Arjun Kumar", department: "Electronics", tests: 9, score: "91.5" },
  { rank: 3, name: "Sneha Iyer", department: "Computer Science", tests: 11, score: "89.8" },
];

export function HRShowcase() {
  return (
    <ShowcaseFrame
      path="/hr"
      navItems={navItems}
      searchPlaceholder="Search by name, college, or role…"
      userInitials="HR"
    >
      <div className="grid grid-cols-4 gap-2.5 mb-3">
        <ShowcaseStatCard label="Active Vacancies" value="6" />
        <ShowcaseStatCard label="Total Applicants" value="148" />
        <ShowcaseStatCard label="Shortlisted" value="22" />
        <ShowcaseStatCard label="Top Score (Avg)" value="88.4" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="rounded-md border border-line p-3">
          <p className="text-caption font-semibold mb-2.5">Recent Applicants</p>
          <div className="space-y-2">
            {applicants.map((a) => (
              <div key={a.name} className="flex items-center justify-between gap-2 text-caption">
                <span className="text-ink truncate">{a.name} · {a.job}</span>
                <Badge tone={statusTone[a.status]} className="shrink-0">{a.status}</Badge>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-line p-3">
          <p className="text-caption font-semibold mb-2.5">Your Vacancies</p>
          <div className="space-y-2">
            {vacancies.map((v) => (
              <div key={v.title} className="flex items-center justify-between text-caption">
                <span className="font-semibold text-ink truncate">{v.title}</span>
                <span className="text-ink-faint shrink-0">{v.meta}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-caption font-semibold mb-2">Global Talent Board</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rank</TableHead>
            <TableHead>Candidate</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Tests</TableHead>
            <TableHead>Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {talentBoard.map((t) => (
            <TableRow key={t.rank}>
              <TableCell>#{t.rank}</TableCell>
              <TableCell className="font-semibold">{t.name}</TableCell>
              <TableCell>{t.department}</TableCell>
              <TableCell>{t.tests} completed</TableCell>
              <TableCell>{t.score}/100</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ShowcaseFrame>
  );
}
