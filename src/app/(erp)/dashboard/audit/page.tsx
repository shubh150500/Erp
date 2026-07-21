import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageTitle, Panel, EmptyState } from "@/components/erp/ui";

export const metadata = { title: "Audit Log" };

const ACTIONS = [
  "FEE_VERIFIED",
  "FEE_REJECTED",
  "EXPENSE_ADDED",
  "EXPENSE_DELETED",
  "SALARY_PAID",
  "SALARY_DELETED",
  "SALARY_SET",
] as const;

const actionTone: Record<string, string> = {
  FEE_VERIFIED: "bg-emerald-100 text-emerald-700",
  FEE_REJECTED: "bg-red-100 text-red-700",
  EXPENSE_ADDED: "bg-amber-100 text-amber-700",
  EXPENSE_DELETED: "bg-red-100 text-red-700",
  SALARY_PAID: "bg-purple-100 text-purple-700",
  SALARY_DELETED: "bg-red-100 text-red-700",
  SALARY_SET: "bg-blue-100 text-blue-700",
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  await requireRole(["ADMIN"]);
  const sp = await searchParams;
  const action = sp.action && ACTIONS.includes(sp.action as (typeof ACTIONS)[number]) ? sp.action : undefined;

  const logs = await prisma.auditLog.findMany({
    where: action ? { action } : {},
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return (
    <>
      <PageTitle title="Audit Log" subtitle="Every sensitive finance action, with who did it and when." />

      <form className="mb-7 flex flex-wrap items-center gap-3">
        <select
          name="action"
          defaultValue={action ?? ""}
          className="rounded-xl border border-navy-200/70 bg-white px-3 py-2 text-sm text-navy-700"
        >
          <option value="">All actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-navy-700 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
        >
          Filter
        </button>
      </form>

      <Panel>
        {logs.length === 0 ? (
          <EmptyState message="No audit entries yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-navy-400 border-b border-navy-100">
                  <th className="px-5 py-3 font-semibold">When</th>
                  <th className="px-5 py-3 font-semibold">Actor</th>
                  <th className="px-5 py-3 font-semibold">Action</th>
                  <th className="px-5 py-3 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-ivory/40">
                    <td className="px-5 py-3.5 text-navy-500 whitespace-nowrap">
                      {l.createdAt.toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-navy-700">{l.actorName}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          actionTone[l.action] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {l.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-navy-600">{l.summary}</td>
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
