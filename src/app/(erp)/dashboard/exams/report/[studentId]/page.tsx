import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import { marksByStudent, attendancePct, rankInBatch, childrenByParentUser, studentByUser } from "@/lib/dal";
import { PageTitle } from "@/components/erp/ui";
import { PrintButton } from "../../../students/[id]/PrintButton";

export const metadata = { title: "Report Card" };

function grade(pct: number) {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 40) return "D";
  return "E";
}

/** Whether `user` may view this student's report card. */
async function canView(user: { id: string; role: string }, studentId: string) {
  if (user.role === "ADMIN" || user.role === "TEACHER") return true;
  if (user.role === "STUDENT") {
    const s = await studentByUser(user.id);
    return s?.id === studentId;
  }
  if (user.role === "PARENT") {
    const children = await childrenByParentUser(user.id);
    return children.some((c) => c.id === studentId);
  }
  return false;
}

export default async function ReportCardPrintPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const user = await requireUser();
  const { studentId } = await params;

  if (!(await canView({ id: user.id, role: user.role }, studentId))) notFound();

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true, enrollments: { include: { batch: true } } },
  });
  if (!student) notFound();

  const [marks, att, rank] = await Promise.all([
    marksByStudent(studentId),
    attendancePct(studentId),
    rankInBatch(studentId),
  ]);

  const totals = marks.reduce(
    (t, m) => ({ score: t.score + m.score, max: t.max + m.exam.maxMarks }),
    { score: 0, max: 0 }
  );
  const overallPct = totals.max ? Math.round((totals.score / totals.max) * 100) : null;
  const batchNames = student.enrollments.map((e) => e.batch.name).join(", ") || "—";
  const issued = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <div className="print:hidden">
        <PageTitle title="Report Card" subtitle={student.user.name} action={<PrintButton />} />
        <Link
          href="/dashboard/exams"
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-500 hover:text-gold-600"
        >
          <ArrowLeft size={15} /> Back to results
        </Link>
      </div>

      <div className="mx-auto max-w-3xl rounded-2xl border border-navy-100 bg-white p-8 shadow-[var(--shadow-card)] print:border-0 print:shadow-none">
        {/* Letterhead */}
        <div className="flex items-center justify-between border-b border-navy-100 pb-5">
          <div>
            <p className="font-serif text-2xl font-bold text-navy-700">{site.name}</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-600">{site.tagline}</p>
            <p className="mt-1 text-xs text-navy-400">{site.address.full} · {site.phoneDisplay}</p>
          </div>
          <span className="grid h-14 w-14 place-items-center rounded-xl bg-navy-700 font-serif text-xl font-bold text-gold-400">
            TE
          </span>
        </div>

        <h1 className="mt-5 text-center font-serif text-lg font-bold uppercase tracking-wide text-navy-700">
          Student Report Card
        </h1>

        {/* Student meta */}
        <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
          <Meta label="Name" value={student.user.name} />
          <Meta label="Roll No" value={student.rollNo} />
          <Meta label="Class" value={student.className} />
          <Meta label="Batch" value={batchNames} />
          <Meta label="Attendance" value={att === null ? "—" : `${att}%`} />
          <Meta label="Rank" value={rank ? `${rank.rank} of ${rank.total}` : "—"} />
        </div>

        {/* Marks */}
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-y border-navy-100 text-left text-xs uppercase tracking-wider text-navy-400">
              <th className="py-2.5 font-semibold">Exam</th>
              <th className="py-2.5 font-semibold">Subject</th>
              <th className="py-2.5 font-semibold text-right">Score</th>
              <th className="py-2.5 font-semibold text-right">%</th>
              <th className="py-2.5 font-semibold text-right">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {marks.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-navy-400">
                  No marks published yet.
                </td>
              </tr>
            ) : (
              marks.map((m) => {
                const pct = Math.round((m.score / m.exam.maxMarks) * 100);
                return (
                  <tr key={m.id}>
                    <td className="py-2.5 font-medium text-navy-700">{m.exam.title}</td>
                    <td className="py-2.5 text-navy-600">{m.exam.subject}</td>
                    <td className="py-2.5 text-right text-navy-600">
                      {m.score} / {m.exam.maxMarks}
                    </td>
                    <td className="py-2.5 text-right text-navy-600">{pct}%</td>
                    <td className="py-2.5 text-right font-semibold text-navy-700">{grade(pct)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Summary */}
        {overallPct !== null && (
          <div className="mt-5 flex items-center justify-end gap-6 border-t border-navy-100 pt-4 text-sm">
            <span className="text-navy-500">
              Overall: <span className="font-bold text-navy-700">{overallPct}%</span>
            </span>
            <span className="text-navy-500">
              Grade: <span className="font-bold text-gold-700">{grade(overallPct)}</span>
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 flex items-end justify-between text-xs text-navy-400">
          <span>Issued {issued}</span>
          <div className="text-center">
            <div className="h-10 w-40 border-b border-navy-300" />
            <span className="mt-1 block">Authorised signature</span>
          </div>
        </div>
      </div>
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-navy-400">{label}</dt>
      <dd className="font-semibold text-navy-700">{value}</dd>
    </div>
  );
}
