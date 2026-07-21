import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { attendancePct, studentByUser, childrenByParentUser } from "@/lib/dal";
import { PageTitle, Panel, EmptyState, StatCard, StatusPill } from "@/components/erp/ui";
import { AttendanceMarker } from "./AttendanceMarker";

export const metadata = { title: "Attendance" };

export default async function AttendancePage() {
  const user = await requireUser();

  if (user.role === "ADMIN" || user.role === "TEACHER")
    return <MarkView role={user.role} userId={user.id} />;
  if (user.role === "STUDENT") return <StudentView userId={user.id} />;
  if (user.role === "PARENT") return <ParentView userId={user.id} />;
  return <EmptyState message="Attendance not available." />;
}

async function MarkView({ role, userId }: { role: string; userId: string }) {
  const batches = await prisma.batch.findMany({
    where:
      role === "TEACHER"
        ? { teacher: { userId } }
        : {},
    include: {
      enrollments: { include: { student: { include: { user: true } } } },
    },
    orderBy: { name: "asc" },
  });

  const data = batches.map((b) => ({
    id: b.id,
    name: b.name,
    students: b.enrollments.map((e) => ({
      id: e.student.id,
      name: e.student.user.name,
      rollNo: e.student.rollNo,
    })),
  }));

  return (
    <>
      <PageTitle title="Attendance" subtitle="Mark and update daily attendance per batch." />
      <Panel className="p-5">
        <AttendanceMarker batches={data} />
      </Panel>
    </>
  );
}

async function StudentView({ userId }: { userId: string }) {
  const student = await studentByUser(userId);
  if (!student) return <EmptyState message="Student profile not found." />;
  const [pct, records] = await Promise.all([
    attendancePct(student.id),
    prisma.attendance.findMany({
      where: { studentId: student.id },
      include: { batch: true },
      orderBy: { date: "desc" },
      take: 30,
    }),
  ]);

  return (
    <>
      <PageTitle title="My Attendance" subtitle="Your recent attendance record." />
      <div className="grid gap-5 sm:grid-cols-3 mb-7">
        <StatCard label="Overall" value={pct === null ? "—" : `${pct}%`} tone={pct !== null && pct < 75 ? "red" : "green"} hint="Present + late" />
        <StatCard label="Records" value={records.length} />
        <StatCard label="Status" value={pct === null ? "—" : pct >= 75 ? "Good" : "Low"} tone={pct !== null && pct < 75 ? "red" : "green"} />
      </div>
      <AttendanceLog records={records} />
    </>
  );
}

async function ParentView({ userId }: { userId: string }) {
  const children = await childrenByParentUser(userId);
  const data = await Promise.all(
    children.map(async (c) => ({
      child: c,
      pct: await attendancePct(c.id),
      records: await prisma.attendance.findMany({
        where: { studentId: c.id },
        include: { batch: true },
        orderBy: { date: "desc" },
        take: 15,
      }),
    }))
  );

  return (
    <>
      <PageTitle title="Attendance" subtitle="Attendance record for your children." />
      {data.length === 0 ? (
        <EmptyState message="No linked children found." />
      ) : (
        <div className="space-y-7">
          {data.map(({ child, pct, records }) => (
            <div key={child.id}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="font-semibold text-navy-700">{child.user.name}</h2>
                <StatCard label="" value={pct === null ? "—" : `${pct}%`} />
              </div>
              <AttendanceLog records={records} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function AttendanceLog({
  records,
}: {
  records: { id: string; date: Date; status: string; batch: { name: string } }[];
}) {
  return (
    <Panel title="Recent record">
      {records.length === 0 ? (
        <EmptyState message="No attendance recorded yet." />
      ) : (
        <ul className="divide-y divide-navy-100">
          {records.map((r) => (
            <li key={r.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="font-medium text-navy-700">
                  {r.date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                <p className="text-xs text-navy-400">{r.batch.name}</p>
              </div>
              <StatusPill status={r.status} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
