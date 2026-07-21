import Link from "next/link";
import { IdCard } from "lucide-react";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageTitle, Panel, EmptyState } from "@/components/erp/ui";
import { AddStudentButton } from "./AddStudentButton";
import { TransferBatchButton } from "./TransferBatchButton";

export const metadata = { title: "Students" };

export default async function StudentsPage() {
  const user = await requireRole(["ADMIN", "TEACHER"]);

  const [students, batches] = await Promise.all([
    prisma.student.findMany({
      include: {
        user: true,
        enrollments: { include: { batch: true } },
        _count: { select: { payments: true } },
      },
      orderBy: { rollNo: "asc" },
    }),
    prisma.batch.findMany({ select: { id: true, name: true } }),
  ]);

  return (
    <>
      <PageTitle
        title="Students"
        subtitle={`${students.length} enrolled student${students.length === 1 ? "" : "s"}`}
        action={user.role === "ADMIN" ? <AddStudentButton batches={batches} /> : undefined}
      />
      <Panel>
        {students.length === 0 ? (
          <EmptyState message="No students yet. Add your first student to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-navy-400 border-b border-navy-100">
                  <th className="px-5 py-3 font-semibold">Roll</th>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Class</th>
                  <th className="px-5 py-3 font-semibold">Batch</th>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  {user.role === "ADMIN" && <th className="px-5 py-3 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-ivory/40">
                    <td className="px-5 py-3.5 font-mono text-xs text-navy-600">{s.rollNo}</td>
                    <td className="px-5 py-3.5 font-medium text-navy-700">{s.user.name}</td>
                    <td className="px-5 py-3.5 text-navy-600">{s.className}</td>
                    <td className="px-5 py-3.5 text-navy-500">
                      {s.enrollments.map((e) => e.batch.name).join(", ") || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-navy-500">{s.user.email}</td>
                    {user.role === "ADMIN" && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-4">
                          <Link
                            href={`/dashboard/students/${s.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-navy-600 hover:text-gold-600"
                          >
                            <IdCard size={13} /> ID card
                          </Link>
                          <TransferBatchButton
                            studentId={s.id}
                            studentName={s.user.name}
                            currentBatches={s.enrollments.map((e) => ({ id: e.batch.id, name: e.batch.name }))}
                            allBatches={batches}
                          />
                        </div>
                      </td>
                    )}
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
