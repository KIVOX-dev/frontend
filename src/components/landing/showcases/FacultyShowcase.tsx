import { CalendarDays, Users, CalendarCheck, ClipboardList, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { ShowcaseFrame, ShowcaseStatCard, ShowcaseBarChart } from "./ShowcaseFrame";

const navItems = [
  { icon: CalendarDays, label: "Classes", active: true },
  { icon: Users, label: "Students" },
  { icon: CalendarCheck, label: "Attendance" },
  { icon: ClipboardList, label: "Assignments" },
  { icon: GraduationCap, label: "Grades" },
];

const schedule = [
  { time: "9:00 AM", cls: "CSE-3A · Data Structures" },
  { time: "11:00 AM", cls: "CSE-3B · Data Structures" },
  { time: "2:00 PM", cls: "CSE-4A · Algorithms" },
];

const students = [
  { name: "Rahul Verma", assignment: "Submitted", grade: "A" },
  { name: "Sneha Iyer", assignment: "Submitted", grade: "A-" },
  { name: "Karan Mehta", assignment: "Pending", grade: "—" },
];

const gradeTone = { A: "success", "A-": "success", "—": "neutral" } as const;

export function FacultyShowcase() {
  return (
    <ShowcaseFrame
      path="/faculty"
      navItems={navItems}
      searchPlaceholder="Search students…"
      userInitials="PS"
    >
      <div className="grid grid-cols-4 gap-2.5 mb-3">
        <ShowcaseStatCard label="Classes Today" value="3" />
        <ShowcaseStatCard label="Students" value="126" />
        <ShowcaseStatCard label="Assignments Due" value="2" />
        <ShowcaseStatCard label="Avg. Grade" value="B+" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="rounded-md border border-line p-3">
          <p className="text-caption font-semibold mb-2.5">Today&apos;s Schedule</p>
          <div className="space-y-2">
            {schedule.map((s) => (
              <div key={s.cls} className="flex items-center justify-between text-caption">
                <span className="font-semibold text-ink truncate">{s.cls}</span>
                <span className="text-ink-faint shrink-0">{s.time}</span>
              </div>
            ))}
          </div>
        </div>

        <ShowcaseBarChart
          title="Class Performance"
          bars={[
            { label: "3A", value: 84 },
            { label: "3B", value: 76 },
            { label: "4A", value: 90 },
          ]}
        />
      </div>

      <p className="text-caption font-semibold mb-2">Assignment Review — CSE-3A</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Assignment</TableHead>
            <TableHead>Grade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((s) => (
            <TableRow key={s.name}>
              <TableCell className="font-semibold">{s.name}</TableCell>
              <TableCell>{s.assignment}</TableCell>
              <TableCell>
                <Badge tone={gradeTone[s.grade as keyof typeof gradeTone]}>{s.grade}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ShowcaseFrame>
  );
}
