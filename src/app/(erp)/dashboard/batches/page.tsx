import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageTitle, Panel, EmptyState } from "@/components/erp/ui";
import { AddBatchButton } from "./AddBatchButton";

export const metadata = { title: "Batches" };

export default async function BatchesPage() {
  await requireRole(["ADMIN"]);

  const [batches, courses, teachers] = await Promise.all([
    prisma.batch.findMany({
      include: {
        course: true,
        teacher: { include: { user: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.findMany({ select: { id: true, name: true } }),
    prisma.teacher.findMany({ include: { user: true } }),
  ]);

  const teacherOpts = teachers.map((t) => ({ id: t.id, name: t.user.name }));

  return (
    <>
      <PageTitle
        title="Batches"
        subtitle="Class groups, assigned teachers and fee structure."
        action={<AddBatchButton courses={courses} teachers={teacherOpts} />}
      />
      <Panel>
        {batches.length === 0 ? (
          <EmptyState message="No batches yet. Create one to begin enrolling students." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-navy-400 border-b border-navy-100">
                  <th className="px-5 py-3 font-semibold">Batch</th>
                  <th className="px-5 py-3 font-semibold">Course</th>
                  <th className="px-5 py-3 font-semibold">Year</th>
                  <th className="px-5 py-3 font-semibold">Teacher</th>
                  <th className="px-5 py-3 font-semibold">Students</th>
                  <th className="px-5 py-3 font-semibold">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-ivory/40">
                    <td className="px-5 py-3.5 font-medium text-navy-700">{b.name}</td>
                    <td className="px-5 py-3.5 text-navy-600">{b.course.name}</td>
                    <td className="px-5 py-3.5 text-navy-500">{b.year}</td>
                    <td className="px-5 py-3.5 text-navy-500">
                      {b.teacher?.user.name ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-navy-500">{b._count.enrollments}</td>
                    <td className="px-5 py-3.5 font-medium text-navy-700">
                      ₹{b.feeAmount.toLocaleString("en-IN")}
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
