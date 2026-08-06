import { SquaresFour, UserPlus, CloudArrowUp, Pulse, ChatCircle } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { ShowcaseFrame } from "./ShowcaseFrame";

const navItems = [
  { icon: SquaresFour, label: "Dashboard", active: true },
  { icon: UserPlus, label: "Add Student" },
  { icon: CloudArrowUp, label: "Upload Students" },
  { icon: Pulse, label: "Student Tracking" },
  { icon: ChatCircle, label: "Messages" },
];

const quickActions = [
  { label: "Add Student", desc: "Create a new student account" },
  { label: "Upload Students", desc: "Bulk import via CSV" },
  { label: "Student Tracking", desc: "View student performance" },
];

const students = [
  { name: "Rahul Verma", department: "Computer Science", status: "Approved" as const },
  { name: "Sneha Iyer", department: "Electronics", status: "Approved" as const },
  { name: "Karan Mehta", department: "Mechanical", status: "Pending" as const },
];

const statusTone = { Approved: "success", Pending: "warning" } as const;

export function FacultyShowcase() {
  return (
    <ShowcaseFrame
      path="/faculty"
      navItems={navItems}
      searchPlaceholder="Search students…"
      userInitials="PS"
    >
      <div className="grid grid-cols-3 gap-2.5 mb-3">
        {quickActions.map((a) => (
          <div key={a.label} className="rounded-md border border-line bg-[var(--color-sidebar)] px-3 py-2.5">
            <p className="text-caption font-bold text-ink mb-0.5">{a.label}</p>
            <p className="text-[11px] text-ink-faint">{a.desc}</p>
          </div>
        ))}
      </div>

      <p className="text-caption font-semibold mb-2">Student Tracking</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((s) => (
            <TableRow key={s.name}>
              <TableCell className="font-semibold">{s.name}</TableCell>
              <TableCell>{s.department}</TableCell>
              <TableCell>
                <Badge tone={statusTone[s.status]}>{s.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <p className="text-caption font-semibold mb-2 mt-3">Rahul Verma: Profile Insights</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Accuracy</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>May 12</TableCell>
            <TableCell>17 / 20</TableCell>
            <TableCell>85%</TableCell>
            <TableCell><Badge tone="success">Passed</Badge></TableCell>
          </TableRow>
          <TableRow>
            <TableCell>May 9</TableCell>
            <TableCell>12 / 20</TableCell>
            <TableCell>60%</TableCell>
            <TableCell><Badge tone="success">Passed</Badge></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </ShowcaseFrame>
  );
}
