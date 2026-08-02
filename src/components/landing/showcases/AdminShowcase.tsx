import { LayoutDashboard, UserPlus, Users, GraduationCap, Building2, Wallet, FileBarChart } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ShowcaseFrame, ShowcaseStatCard, ShowcaseBarChart } from "./ShowcaseFrame";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", active: true },
  { icon: UserPlus, label: "Admissions" },
  { icon: Users, label: "Students" },
  { icon: GraduationCap, label: "Faculty" },
  { icon: Building2, label: "Departments" },
  { icon: Wallet, label: "Finance" },
  { icon: FileBarChart, label: "Reports" },
];

const departments = [
  { name: "Computer Science", performance: "94%" },
  { name: "Mechanical Engg.", performance: "87%" },
  { name: "Electronics", performance: "91%" },
];

const approvals = [
  { title: "Faculty leave request — Priya Menon", tone: "warning" as const },
  { title: "Budget approval — Library Wing", tone: "info" as const },
  { title: "New admission batch — CSE 2026", tone: "success" as const },
];

export function AdminShowcase() {
  return (
    <ShowcaseFrame
      path="/institutional"
      navItems={navItems}
      searchPlaceholder="Search departments, staff…"
      userInitials="SA"
    >
      <div className="grid grid-cols-4 gap-2.5 mb-3">
        <ShowcaseStatCard label="Total Students" value="4,820" delta="+6%" />
        <ShowcaseStatCard label="Faculty" value="312" />
        <ShowcaseStatCard label="Departments" value="12" />
        <ShowcaseStatCard label="Revenue (Q2)" value="₹2.4Cr" delta="+11%" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <ShowcaseBarChart
          title="Admissions Trend"
          bars={[
            { label: "Q1", value: 62 },
            { label: "Q2", value: 78 },
            { label: "Q3", value: 71 },
            { label: "Q4", value: 88 },
          ]}
        />
        <div className="rounded-md border border-line p-3">
          <p className="text-caption font-semibold mb-2.5">Department Performance</p>
          <div className="space-y-2">
            {departments.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-caption">
                <span className="font-semibold text-ink truncate">{d.name}</span>
                <span className="text-primary font-semibold shrink-0">{d.performance}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-md border border-line p-3">
        <p className="text-caption font-semibold mb-2.5">Approval Workflow</p>
        <div className="space-y-2">
          {approvals.map((a) => (
            <div key={a.title} className="flex items-center justify-between gap-2 text-caption">
              <span className="text-ink truncate">{a.title}</span>
              <Badge tone={a.tone} className="shrink-0">Pending</Badge>
            </div>
          ))}
        </div>
      </div>
    </ShowcaseFrame>
  );
}
