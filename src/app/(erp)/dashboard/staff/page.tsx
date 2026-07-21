import { requireRole } from "@/lib/rbac";
import { prisma, safeQuery } from "@/lib/prisma";
import { PageTitle, Panel, EmptyState } from "@/components/erp/ui";
import { AddTeacherButton } from "./AddTeacherButton";

export const metadata = { title: "Staff" };

export default async function StaffPage() {
  await requireRole(["ADMIN"]);

  const teachers = await safeQuery(
    () =>
      prisma.teacher.findMany({
        include: {
          user: true,
          _count: { select: { batches: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    []
  );

  const teachingCount = teachers.filter((t) => t.staffType !== "NON_TEACHING").length;
  const nonTeachingCount = teachers.length - teachingCount;

  return (
    <>
      <PageTitle
        title="Staff"
        subtitle={`${teachingCount} teaching · ${nonTeachingCount} non-teaching`}
        action={<AddTeacherButton />}
      />
      <Panel>
        {teachers.length === 0 ? (
          <EmptyState message="No staff yet. Add your teachers and support staff here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-navy-400 border-b border-navy-100">
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Subject / Designation</th>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Phone</th>
                  <th className="px-5 py-3 font-semibold">Batches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {teachers.map((t) => {
                  const nonTeaching = t.staffType === "NON_TEACHING";
                  return (
                    <tr key={t.id} className="hover:bg-ivory/40">
                      <td className="px-5 py-3.5 font-medium text-navy-700">{t.user?.name ?? "Teacher"}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            nonTeaching ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {nonTeaching ? "Non-teaching" : "Teaching"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-navy-600">{t.subject ?? t.designation ?? "—"}</td>
                      <td className="px-5 py-3.5 text-navy-500">{t.user?.email ?? "—"}</td>
                      <td className="px-5 py-3.5 text-navy-500">{t.user?.phone ?? "—"}</td>
                      <td className="px-5 py-3.5 text-navy-500">{t._count?.batches ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
