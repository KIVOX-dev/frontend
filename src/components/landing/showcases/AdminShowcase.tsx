import { LayoutDashboard, Users, Briefcase, ClipboardList, Building2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ShowcaseFrame, ShowcaseStatCard, ShowcaseBarChart } from "./ShowcaseFrame";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Users, label: "Manage Users" },
  { icon: Briefcase, label: "Placement Drives" },
  { icon: ClipboardList, label: "Assessments" },
  { icon: Building2, label: "Departments" },
  { icon: ShieldCheck, label: "Security & Approvals" },
];

const topRecruiters = [
  { name: "TCS", count: "18 placed" },
  { name: "Infosys", count: "14 placed" },
  { name: "Wipro", count: "9 placed" },
];

const recentPlacements = [
  { title: "Ananya Rao — TCS · Software Engineer", tone: "success" as const, badge: "6.5 LPA" },
  { title: "Karthik S — Infosys · Analyst", tone: "success" as const, badge: "5.2 LPA" },
  { title: "Divya M — Wipro · SDE", tone: "success" as const, badge: "7.0 LPA" },
];

export function AdminShowcase() {
  return (
    <ShowcaseFrame
      path="/institutional"
      navItems={navItems}
      searchPlaceholder="Search users, placements, or drives…"
      userInitials="SA"
    >
      <div className="grid grid-cols-4 gap-2.5 mb-3">
        <ShowcaseStatCard label="Total Students" value="4,820" />
        <ShowcaseStatCard label="Faculty" value="186" />
        <ShowcaseStatCard label="Departments" value="42" />
        <ShowcaseStatCard label="Active Drives" value="9" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <ShowcaseBarChart
          title="Placement Trend"
          bars={[
            { label: "Q1", value: 58 },
            { label: "Q2", value: 74 },
            { label: "Q3", value: 69 },
            { label: "Q4", value: 91 },
          ]}
        />
        <div className="rounded-md border border-line p-3">
          <p className="text-caption font-semibold mb-2.5">Top Recruiters</p>
          <div className="space-y-2">
            {topRecruiters.map((r) => (
              <div key={r.name} className="flex items-center justify-between text-caption">
                <span className="font-semibold text-ink truncate">{r.name}</span>
                <span className="text-primary font-semibold shrink-0">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-md border border-line p-3">
        <p className="text-caption font-semibold mb-2.5">Recent Placements</p>
        <div className="space-y-2">
          {recentPlacements.map((p) => (
            <div key={p.title} className="flex items-center justify-between gap-2 text-caption">
              <span className="text-ink truncate">{p.title}</span>
              <Badge tone={p.tone} className="shrink-0">{p.badge}</Badge>
            </div>
          ))}
        </div>
      </div>
    </ShowcaseFrame>
  );
}
