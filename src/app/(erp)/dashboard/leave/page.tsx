import { CalendarDays } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { prisma, safeQuery } from "@/lib/prisma";
import { studentByUser, childrenByParentUser } from "@/lib/dal";
import { PageTitle, Panel, EmptyState, StatCard, StatusPill } from "@/components/erp/ui";
import { ApplyLeaveButton } from "./ApplyLeaveButton";
import { DecideLeaveButtons } from "./DecideLeaveButtons";

export const metadata = { title: "Leave" };

type Row = {
  id: string;
  fromDate: Date;
  toDate: Date;
  reason: string;
  status: string;
  createdAt: Date;
  student: { user: { name: string } };
};

const include = { student: { include: { user: true } } } as const;
const fmt = (d: Date) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default async function LeavePage() {
  const user = await requireUser();

  if (user.role === "STUDENT") {
    const student = await safeQuery(() => studentByUser(user.id), null);
    if (!student) return <EmptyState message="Student profile not found." />;
    const rows = await safeQuery(
      () =>
        prisma.leaveApplication.findMany({
          where: { studentId: student.id },
          include,
          orderBy: { createdAt: "desc" },
        }),
      []
    );
    return (
      <>
        <PageTitle
          title="Leave Applications"
          subtitle="Apply for leave and track approval status."
          action={<ApplyLeaveButton students={[{ id: student.id, label: student.user?.name ?? "Student" }]} />}
        />
        <LeaveList rows={rows} />
      </>
    );
  }

  if (user.role === "PARENT") {
    const children = await safeQuery(() => childrenByParentUser(user.id), []);
    const rows = await safeQuery(
      () =>
        prisma.leaveApplication.findMany({
          where: { studentId: { in: children.map((c) => c.id) } },
          include,
          orderBy: { createdAt: "desc" },
        }),
      []
    );
    return (
      <>
        <PageTitle
          title="Leave Applications"
          subtitle="Apply for your children's leave and track approvals."
          action={<ApplyLeaveButton students={children.map((c) => ({ id: c.id, label: `${c.user?.name ?? "Student"} (${c.rollNo})` }))} />}
        />
        <LeaveList rows={rows} showStudent />
      </>
    );
  }

  const where =
    user.role === "TEACHER"
      ? { student: { enrollments: { some: { batch: { teacher: { userId: user.id } } } } } }
      : {};
  const rows = await safeQuery(
    () =>
      prisma.leaveApplication.findMany({
        where,
        include,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      }),
    []
  );
  const pending = rows.filter((r) => r.status === "PENDING").length;

  return (
    <>
      <PageTitle title="Leave Applications" subtitle="Review and decide leave requests." />
      <div className="grid gap-5 sm:grid-cols-3 mb-7">
        <StatCard label="Total" value={rows.length} />
        <StatCard label="Pending" value={pending} tone={pending > 0 ? "gold" : "green"} />
        <StatCard label="Decided" value={rows.length - pending} tone="green" />
      </div>
      <LeaveList rows={rows} showStudent canDecide />
    </>
  );
}

function LeaveList({
  rows,
  showStudent,
  canDecide,
}: {
  rows: Row[];
  showStudent?: boolean;
  canDecide?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <Panel>
        <EmptyState message="No leave applications yet." />
      </Panel>
    );
  }
  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <Panel key={r.id} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-gold-600">
                <CalendarDays size={18} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-navy-700">
                    {fmt(r.fromDate)} → {fmt(r.toDate)}
                  </p>
                  <StatusPill status={r.status} />
                </div>
                {showStudent && <p className="text-xs font-medium text-navy-500">{r.student?.user?.name ?? "Student"}</p>}
                <p className="mt-1.5 text-sm text-navy-600">{r.reason}</p>
              </div>
            </div>
            {canDecide && r.status === "PENDING" && <DecideLeaveButtons id={r.id} />}
          </div>
        </Panel>
      ))}
    </div>
  );
}
