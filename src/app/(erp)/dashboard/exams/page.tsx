import Link from "next/link";
import { Printer } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { marksByStudent, studentByUser, childrenByParentUser } from "@/lib/dal";
import { PageTitle, Panel, EmptyState, StatCard } from "@/components/erp/ui";
import { NewExamButton, MarksEditor } from "./ExamsClient";

export const metadata = { title: "Exams & Results" };

export default async function ExamsPage() {
  const user = await requireUser();
  if (user.role === "ADMIN" || user.role === "TEACHER")
    return <ManageView role={user.role} userId={user.id} />;
  if (user.role === "STUDENT") return <StudentReport userId={user.id} />;
  if (user.role === "PARENT") return <ParentReport userId={user.id} />;
  return <EmptyState message="Not available." />;
}

async function ManageView({ role, userId }: { role: string; userId: string }) {
  const where = role === "TEACHER" ? { teacher: { userId } } : {};
  const [batches, exams] = await Promise.all([
    prisma.batch.findMany({ where, select: { id: true, name: true } }),
    prisma.exam.findMany({
      where: { batch: where },
      include: {
        batch: {
          include: {
            enrollments: { include: { student: { include: { user: true } } } },
          },
        },
        marks: true,
      },
      orderBy: { date: "desc" },
    }),
  ]);

  const examData = exams.map((e) => ({
    id: e.id,
    title: e.title,
    subject: e.subject,
    maxMarks: e.maxMarks,
    batchName: e.batch.name,
    students: e.batch.enrollments.map((en) => ({
      id: en.student.id,
      name: en.student.user.name,
      rollNo: en.student.rollNo,
    })),
    scores: Object.fromEntries(e.marks.map((m) => [m.studentId, m.score])),
  }));

  return (
    <>
      <PageTitle
        title="Exams & Results"
        subtitle="Create exams and enter marks for your batches."
        action={<NewExamButton batches={batches} />}
      />
      <Panel>
        {examData.length === 0 ? (
          <EmptyState message="No exams yet. Create one to start entering marks." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-navy-400 border-b border-navy-100">
                  <th className="px-5 py-3 font-semibold">Exam</th>
                  <th className="px-5 py-3 font-semibold">Subject</th>
                  <th className="px-5 py-3 font-semibold">Batch</th>
                  <th className="px-5 py-3 font-semibold">Max</th>
                  <th className="px-5 py-3 font-semibold">Entered</th>
                  <th className="px-5 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {examData.map((e) => (
                  <tr key={e.id} className="hover:bg-ivory/40">
                    <td className="px-5 py-3.5 font-medium text-navy-700">{e.title}</td>
                    <td className="px-5 py-3.5 text-navy-600">{e.subject}</td>
                    <td className="px-5 py-3.5 text-navy-500">{e.batchName}</td>
                    <td className="px-5 py-3.5 text-navy-500">{e.maxMarks}</td>
                    <td className="px-5 py-3.5 text-navy-500">
                      {Object.keys(e.scores).length}/{e.students.length}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <MarksEditor exam={e} />
                    </td>
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

function grade(pct: number) {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 40) return "D";
  return "E";
}

async function ReportCard({ studentId, title }: { studentId: string; title: string }) {
  const marks = await marksByStudent(studentId);

  const totals = marks.reduce(
    (t, m) => ({ score: t.score + m.score, max: t.max + m.exam.maxMarks }),
    { score: 0, max: 0 }
  );
  const overallPct = totals.max ? Math.round((totals.score / totals.max) * 100) : null;

  return (
    <div className="mb-8">
      <h2 className="font-semibold text-navy-700 mb-3">{title}</h2>
      <div className="grid gap-5 sm:grid-cols-3 mb-5">
        <StatCard label="Exams" value={marks.length} />
        <StatCard label="Overall" value={overallPct === null ? "—" : `${overallPct}%`} tone="gold" />
        <StatCard label="Grade" value={overallPct === null ? "—" : grade(overallPct)} tone="green" />
      </div>
      <Panel
        title="Report card"
        action={
          marks.length > 0 ? (
            <Link
              href={`/dashboard/exams/report/${studentId}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-600 hover:text-gold-700"
            >
              <Printer size={14} /> Print report card
            </Link>
          ) : undefined
        }
      >
        {marks.length === 0 ? (
          <EmptyState message="No marks published yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-navy-400 border-b border-navy-100">
                  <th className="px-5 py-3 font-semibold">Exam</th>
                  <th className="px-5 py-3 font-semibold">Subject</th>
                  <th className="px-5 py-3 font-semibold">Score</th>
                  <th className="px-5 py-3 font-semibold">%</th>
                  <th className="px-5 py-3 font-semibold">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {marks.map((m) => {
                  const pct = Math.round((m.score / m.exam.maxMarks) * 100);
                  return (
                    <tr key={m.id} className="hover:bg-ivory/40">
                      <td className="px-5 py-3.5 font-medium text-navy-700">{m.exam.title}</td>
                      <td className="px-5 py-3.5 text-navy-600">{m.exam.subject}</td>
                      <td className="px-5 py-3.5 text-navy-600">{m.score} / {m.exam.maxMarks}</td>
                      <td className="px-5 py-3.5 text-navy-600">{pct}%</td>
                      <td className="px-5 py-3.5 font-semibold text-navy-700">{grade(pct)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

async function StudentReport({ userId }: { userId: string }) {
  const student = await studentByUser(userId);
  if (!student) return <EmptyState message="Student profile not found." />;
  return (
    <>
      <PageTitle title="My Results" subtitle="Your exam performance and report card." />
      <ReportCard studentId={student.id} title={`${student.user.name} · ${student.className}`} />
    </>
  );
}

async function ParentReport({ userId }: { userId: string }) {
  const children = await childrenByParentUser(userId);
  return (
    <>
      <PageTitle title="Results" subtitle="Report cards for your children." />
      {children.length === 0 ? (
        <EmptyState message="No linked children found." />
      ) : (
        children.map((c) => (
          <ReportCard key={c.id} studentId={c.id} title={`${c.user.name} · ${c.className}`} />
        ))
      )}
    </>
  );
}
