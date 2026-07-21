import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageTitle, Panel, EmptyState, StatCard, StatusPill } from "@/components/erp/ui";
import { TeacherAttendanceMarker } from "./TeacherAttendanceMarker";

export const metadata = { title: "Staff Attendance" };

/** Present% from a list of attendance statuses (PRESENT/LATE count as present). */
function presentPct(statuses: string[]) {
  if (statuses.length === 0) return null;
  const present = statuses.filter((s) => s === "PRESENT" || s === "LATE").length;
  return Math.round((present / statuses.length) * 100);
}

export default async function StaffAttendancePage() {
  const user = await requireUser();
  if (user.role === "ADMIN") return <AdminView />;
  if (user.role === "TEACHER") return <TeacherView userId={user.id} />;
  return <EmptyState message="Staff attendance is not available for this role." />;
}

async function AdminView() {
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00");

  const teachers = await prisma.teacher.findMany({
    include: {
      user: true,
      attendance: true,
      _count: { select: { batches: true } },
      batches: { select: { _count: { select: { enrollments: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Derived productivity signals keyed by the teacher's user id.
  const userIds = teachers.map((t) => t.userId);
  const [lessonsDone, homeworkCounts] = await Promise.all([
    prisma.lessonPlan.groupBy({
      by: ["createdById"],
      where: { createdById: { in: userIds }, status: "DONE" },
      _count: true,
    }),
    prisma.homework.groupBy({
      by: ["createdById"],
      where: { createdById: { in: userIds } },
      _count: true,
    }),
  ]);
  const lessonMap = new Map(lessonsDone.map((l) => [l.createdById, l._count]));
  const hwMap = new Map(homeworkCounts.map((h) => [h.createdById, h._count]));

  const markedToday = teachers.filter((t) =>
    t.attendance.some((a) => a.date.getTime() === today.getTime())
  ).length;

  const rows = teachers.map((t) => {
    const todayRec = t.attendance.find((a) => a.date.getTime() === today.getTime());
    return {
      id: t.id,
      name: t.user.name,
      subject: t.subject,
      status: todayRec?.status,
      pct: presentPct(t.attendance.map((a) => a.status)),
      days: t.attendance.length,
      batches: t._count.batches,
      students: t.batches.reduce((s, b) => s + b._count.enrollments, 0),
      lessons: lessonMap.get(t.userId) ?? 0,
      homework: hwMap.get(t.userId) ?? 0,
    };
  });

  return (
    <>
      <PageTitle title="Staff Attendance & Performance" subtitle="Mark daily staff attendance and review productivity." />

      <div className="grid gap-5 sm:grid-cols-3 mb-7">
        <StatCard label="Teaching staff" value={teachers.length} />
        <StatCard label="Marked today" value={`${markedToday}/${teachers.length}`} tone={markedToday === teachers.length && teachers.length > 0 ? "green" : "gold"} />
        <StatCard label="Total batches" value={teachers.reduce((s, t) => s + t._count.batches, 0)} />
      </div>

      <Panel title="Mark attendance" className="mb-7">
        <TeacherAttendanceMarker
          teachers={teachers.map((t) => ({
            id: t.id,
            name: t.user.name,
            subject: t.subject,
            status: t.attendance.find((a) => a.date.getTime() === today.getTime())?.status,
          }))}
        />
      </Panel>

      <Panel title="Performance summary">
        {rows.length === 0 ? (
          <EmptyState message="No teaching staff yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-navy-400 border-b border-navy-100">
                  <th className="px-5 py-3 font-semibold">Teacher</th>
                  <th className="px-5 py-3 font-semibold">Today</th>
                  <th className="px-5 py-3 font-semibold">Attendance</th>
                  <th className="px-5 py-3 font-semibold">Batches</th>
                  <th className="px-5 py-3 font-semibold">Students</th>
                  <th className="px-5 py-3 font-semibold">Lessons taught</th>
                  <th className="px-5 py-3 font-semibold">Homework set</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-ivory/40">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-navy-700">{r.name}</p>
                      <p className="text-xs text-navy-400">{r.subject ?? "—"}</p>
                    </td>
                    <td className="px-5 py-3.5">{r.status ? <StatusPill status={r.status} /> : <span className="text-navy-300">—</span>}</td>
                    <td className="px-5 py-3.5">
                      {r.pct === null ? (
                        <span className="text-navy-300">—</span>
                      ) : (
                        <span className={r.pct < 75 ? "font-semibold text-red-600" : "font-semibold text-emerald-600"}>
                          {r.pct}% <span className="text-xs font-normal text-navy-400">({r.days}d)</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-navy-600">{r.batches}</td>
                    <td className="px-5 py-3.5 text-navy-600">{r.students}</td>
                    <td className="px-5 py-3.5 text-navy-600">{r.lessons}</td>
                    <td className="px-5 py-3.5 text-navy-600">{r.homework}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}

async function TeacherView({ userId }: { userId: string }) {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    include: { user: true, attendance: { orderBy: { date: "desc" } } },
  });
  if (!teacher) return <EmptyState message="Teacher profile not found." />;

  const pct = presentPct(teacher.attendance.map((a) => a.status));

  return (
    <>
      <PageTitle title="My Attendance" subtitle="Your attendance record marked by the office." />
      <div className="grid gap-5 sm:grid-cols-3 mb-7">
        <StatCard label="Attendance" value={pct === null ? "—" : `${pct}%`} tone={pct !== null && pct < 75 ? "red" : "green"} />
        <StatCard label="Days recorded" value={teacher.attendance.length} />
        <StatCard label="Present days" value={teacher.attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length} tone="green" />
      </div>
      <Panel title="Recent records">
        {teacher.attendance.length === 0 ? (
          <EmptyState message="No attendance recorded yet." />
        ) : (
          <ul className="divide-y divide-navy-100">
            {teacher.attendance.slice(0, 30).map((a) => (
              <li key={a.id} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-navy-600">
                  {a.date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                </span>
                <StatusPill status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
