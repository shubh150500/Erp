import type { Role } from "@prisma/client";

export type NavItem = {
  href: string;
  label: string;
  icon: string; // lucide icon name resolved in the client component
  roles: Role[];
};

export const dashboardNav: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: "LayoutDashboard", roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
  { href: "/dashboard/analytics", label: "Analytics", icon: "PieChart", roles: ["ADMIN"] },
  { href: "/dashboard/admissions", label: "Admissions", icon: "Inbox", roles: ["ADMIN"] },
  { href: "/dashboard/students", label: "Students", icon: "Users", roles: ["ADMIN", "TEACHER"] },
  { href: "/dashboard/batches", label: "Batches", icon: "Boxes", roles: ["ADMIN"] },
  { href: "/dashboard/staff", label: "Staff", icon: "GraduationCap", roles: ["ADMIN"] },
  { href: "/dashboard/salary", label: "Salary", icon: "Banknote", roles: ["ADMIN", "TEACHER"] },
  { href: "/dashboard/staff-attendance", label: "Staff Attendance", icon: "UserCog", roles: ["ADMIN", "TEACHER"] },
  { href: "/dashboard/fees", label: "Fees", icon: "Wallet", roles: ["ADMIN", "STUDENT", "PARENT"] },
  { href: "/dashboard/fees/slips", label: "Fee Slips", icon: "FileText", roles: ["ADMIN", "STUDENT", "PARENT"] },
  { href: "/dashboard/attendance", label: "Attendance", icon: "CalendarCheck", roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
  { href: "/dashboard/exams", label: "Exams & Results", icon: "ClipboardList", roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
  { href: "/dashboard/tests", label: "Test Schedule", icon: "CalendarClock", roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
  { href: "/dashboard/homework", label: "Homework", icon: "BookOpen", roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
  { href: "/dashboard/materials", label: "Study Material", icon: "FolderOpen", roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
  { href: "/dashboard/videos", label: "Video Lectures", icon: "PlaySquare", roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
  { href: "/dashboard/doubts", label: "Doubts", icon: "MessageSquare", roles: ["ADMIN", "TEACHER", "STUDENT"] },
  { href: "/dashboard/lessons", label: "Lesson Planning", icon: "CalendarRange", roles: ["ADMIN", "TEACHER"] },
  { href: "/dashboard/messages", label: "Bulk Message", icon: "Send", roles: ["ADMIN", "TEACHER"] },
  { href: "/dashboard/performance", label: "Performance", icon: "BarChart3", roles: ["STUDENT", "PARENT"] },
  { href: "/dashboard/remarks", label: "Remarks", icon: "NotebookPen", roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
  { href: "/dashboard/payments", label: "Payment History", icon: "History", roles: ["ADMIN", "STUDENT", "PARENT"] },
  { href: "/dashboard/finance", label: "Finance (P&L)", icon: "TrendingUp", roles: ["ADMIN"] },
  { href: "/dashboard/accounting", label: "Accounting", icon: "Landmark", roles: ["ADMIN"] },
  { href: "/dashboard/audit", label: "Audit Log", icon: "ScrollText", roles: ["ADMIN"] },
  { href: "/dashboard/leave", label: "Leave", icon: "CalendarDays", roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
  { href: "/dashboard/ptm", label: "PTM Booking", icon: "UserCheck", roles: ["ADMIN", "TEACHER", "PARENT"] },
  { href: "/dashboard/complaints", label: "Complaint Box", icon: "Flag", roles: ["ADMIN", "STUDENT", "PARENT"] },
  { href: "/dashboard/notices", label: "Notices", icon: "Megaphone", roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
];

export function navForRole(role: Role): NavItem[] {
  return dashboardNav.filter((item) => item.roles.includes(role));
}
