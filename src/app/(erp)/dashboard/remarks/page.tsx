import { NotebookPen } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { studentByUser, childrenByParentUser } from "@/lib/dal";
import { PageTitle, Panel, EmptyState } from "@/components/erp/ui";
import { AddRemarkButton } from "./AddRemarkButton";

export const metadata = { title: "Remarks" };

type RemarkRow = {
  id: string;
  body: string;
  teacherId: string;
  createdAt: Date;
  student: { user: { name: string } };
};

/** Attach the author's name to each remark. */
async function withTeacherNames(rows: RemarkRow[]) {
  const ids = [...new Set(rows.map((r) => r.teacherId))];
  const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
  const map = new Map(users.map((u) => [u.id, u.name]));
  return rows.map((r) => ({ ...r, teacherName: map.get(r.teacherId) ?? "Teacher" }));
}

export default async function RemarksPage() {
  const user = await requireUser();
  if (user.role === "ADMIN" || user.role === "TEACHER")
    return <ManageView role={user.role} userId={user.id} />;
  if (user.role === "STUDENT") return <StudentView userId={user.id} />;
  if (user.role === "PARENT") return <ParentView userId={user.id} />;
  return <EmptyState message="Remarks are not available for this role." />;
}

async function ManageView({ role, userId }: { role: string; userId: string }) {
  const studentWhere =
    role === "TEACHER"
      ? { enrollments: { some: { batch: { teacher: { userId } } } } }
      : {};
  const [students, remarks] = await Promise.all([
    prisma.student.findMany({
      where: studentWhere,
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.remark.findMany({
      where: role === "TEACHER" ? { teacherId: userId } : {},
      include: { student: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const opts = students.map((s) => ({ id: s.id, label: `${s.user.name} (${s.rollNo})` }));
  const list = await withTeacherNames(remarks);

  return (
    <>
      <PageTitle
        title="Remarks"
        subtitle="Record remarks about students' progress and behaviour."
        action={<AddRemarkButton students={opts} />}
      />
      <RemarkList rows={list} showStudent />
    </>
  );
}

async function StudentView({ userId }: { userId: string }) {
  const student = await studentByUser(userId);
  if (!student) return <EmptyState message="Student profile not found." />;
  const remarks = await prisma.remark.findMany({
    where: { studentId: student.id },
    include: { student: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });
  const list = await withTeacherNames(remarks);
  return (
    <>
      <PageTitle title="Teacher Remarks" subtitle="Feedback your teachers have shared." />
      <RemarkList rows={list} />
    </>
  );
}

async function ParentView({ userId }: { userId: string }) {
  const children = await childrenByParentUser(userId);
  if (children.length === 0) return <EmptyState message="No linked children found." />;
  const remarks = await prisma.remark.findMany({
    where: { studentId: { in: children.map((c) => c.id) } },
    include: { student: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });
  const list = await withTeacherNames(remarks);
  return (
    <>
      <PageTitle title="Teacher Remarks" subtitle="Feedback teachers have shared about your children." />
      <RemarkList rows={list} showStudent />
    </>
  );
}

function RemarkList({
  rows,
  showStudent,
}: {
  rows: (RemarkRow & { teacherName: string })[];
  showStudent?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <Panel>
        <EmptyState message="No remarks yet." />
      </Panel>
    );
  }
  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <Panel key={r.id} className="p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-gold-600">
              <NotebookPen size={18} />
            </span>
            <div className="flex-1">
              <p className="text-sm text-navy-700 whitespace-pre-line">{r.body}</p>
              <p className="mt-2 text-xs text-navy-400">
                {showStudent && <span className="font-medium text-navy-500">{r.student.user.name} · </span>}
                {r.teacherName} ·{" "}
                {r.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
        </Panel>
      ))}
    </div>
  );
}
