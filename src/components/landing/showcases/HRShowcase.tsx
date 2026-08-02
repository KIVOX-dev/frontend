import { LayoutDashboard, Users, CalendarCheck, FileClock, Wallet, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { ShowcaseFrame, ShowcaseStatCard, ShowcaseBarChart } from "./ShowcaseFrame";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Users, label: "Employees" },
  { icon: CalendarCheck, label: "Attendance" },
  { icon: FileClock, label: "Leave" },
  { icon: Wallet, label: "Payroll" },
  { icon: UserPlus, label: "Recruitment" },
];

const employees = [
  { name: "Ananya Rao", dept: "Academics", status: "Active" as const },
  { name: "Vikram Shah", dept: "Admissions", status: "On Leave" as const },
  { name: "Deepa Nair", dept: "Finance", status: "Active" as const },
  { name: "Rohit Malhotra", dept: "IT Services", status: "Active" as const },
];

const statusTone = { Active: "success", "On Leave": "warning" } as const;

const leaveRequests = [
  { name: "Vikram Shah", type: "Sick Leave", days: "2 days" },
  { name: "Priya Menon", type: "Casual Leave", days: "1 day" },
  { name: "Suresh Kumar", type: "Earned Leave", days: "5 days" },
];

export function HRShowcase() {
  return (
    <ShowcaseFrame
      path="/hr"
      navItems={navItems}
      searchPlaceholder="Search employees…"
      userInitials="HR"
    >
      <div className="grid grid-cols-4 gap-2.5 mb-3">
        <ShowcaseStatCard label="Total Staff" value="312" delta="+8" />
        <ShowcaseStatCard label="Present Today" value="298" />
        <ShowcaseStatCard label="On Leave" value="14" />
        <ShowcaseStatCard label="Open Roles" value="6" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <ShowcaseBarChart
          title="Attendance This Week"
          bars={[
            { label: "M", value: 92 },
            { label: "T", value: 95 },
            { label: "W", value: 88 },
            { label: "T", value: 96 },
            { label: "F", value: 90 },
          ]}
        />
        <div className="rounded-md border border-line p-3">
          <p className="text-caption font-semibold mb-2.5">Leave Requests</p>
          <div className="space-y-2">
            {leaveRequests.map((r) => (
              <div key={r.name} className="flex items-center justify-between text-caption">
                <span className="font-semibold text-ink truncate">{r.name}</span>
                <span className="text-ink-faint shrink-0">{r.type} · {r.days}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-caption font-semibold mb-2">Employee Directory</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((e) => (
            <TableRow key={e.name}>
              <TableCell className="font-semibold">{e.name}</TableCell>
              <TableCell>{e.dept}</TableCell>
              <TableCell>
                <Badge tone={statusTone[e.status]}>{e.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ShowcaseFrame>
  );
}
