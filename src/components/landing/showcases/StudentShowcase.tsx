import { LayoutDashboard, BookOpen, CalendarCheck, ClipboardList, FileText, Award } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ShowcaseFrame, ShowcaseStatCard } from "./ShowcaseFrame";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: BookOpen, label: "Courses" },
  { icon: CalendarCheck, label: "Attendance" },
  { icon: ClipboardList, label: "Assignments" },
  { icon: FileText, label: "Exams" },
  { icon: Award, label: "Results" },
];

const courses = [
  { name: "Data Structures", progress: 82 },
  { name: "Operating Systems", progress: 64 },
  { name: "Database Systems", progress: 91 },
];

const exams = [
  { subject: "Data Structures", date: "May 12" },
  { subject: "Operating Systems", date: "May 15" },
  { subject: "Database Systems", date: "May 19" },
];

export function StudentShowcase() {
  return (
    <ShowcaseFrame
      path="/learner"
      navItems={navItems}
      searchPlaceholder="Search courses…"
      userInitials="AR"
      showFilter={false}
    >
      <div className="grid grid-cols-4 gap-2.5 mb-3">
        <ShowcaseStatCard label="CGPA" value="8.6" />
        <ShowcaseStatCard label="Attendance" value="91%" />
        <ShowcaseStatCard label="Pending Tasks" value="3" />
        <ShowcaseStatCard label="Upcoming Exams" value="3" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="rounded-md border border-line p-3">
          <p className="text-caption font-semibold mb-2.5">My Courses</p>
          <div className="space-y-2.5">
            {courses.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-caption mb-1">
                  <span className="font-semibold text-ink truncate">{c.name}</span>
                  <span className="text-ink-faint">{c.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--color-sidebar)] overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${c.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-line p-3">
          <p className="text-caption font-semibold mb-2.5">Exam Schedule</p>
          <div className="space-y-2">
            {exams.map((e) => (
              <div key={e.subject} className="flex items-center justify-between text-caption">
                <span className="font-semibold text-ink truncate">{e.subject}</span>
                <Badge tone="info">{e.date}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-md border border-line p-3">
        <p className="text-caption font-semibold mb-2.5">Announcements</p>
        <div className="space-y-2 text-caption">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary shrink-0" />
            <span className="text-ink">Semester results published — check your Results tab.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary shrink-0" />
            <span className="text-ink">Database Systems assignment due Friday.</span>
          </div>
        </div>
      </div>
    </ShowcaseFrame>
  );
}
