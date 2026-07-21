import type { InquiryStatus } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageTitle, Panel, EmptyState, StatCard } from "@/components/erp/ui";

export const metadata = { title: "Analytics" };

const inr = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Last `count` months as {year, month, label}, oldest first. */
function lastMonths(count: number) {
  const now = new Date();
  const out: { year: number; month: number; label: string }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ year: d.getFullYear(), month: d.getMonth(), label: MONTHS[d.getMonth()] });
  }
  return out;
}

export default async function AnalyticsPage() {
  await requireRole(["ADMIN"]);

  const months = lastMonths(6);
  const since = new Date(months[0].year, months[0].month, 1);

  const [
    payments,
    expenses,
    attnTotal,
    attnPresent,
    enrolByBatch,
    inquiries,
    studentCount,
    teacherCount,
  ] = await Promise.all([
    prisma.payment.findMany({ where: { paidAt: { gte: since } }, select: { amount: true, paidAt: true } }),
    prisma.expense.findMany({ where: { spentAt: { gte: since } }, select: { amount: true, spentAt: true } }),
    prisma.attendance.count(),
    prisma.attendance.count({ where: { status: { in: ["PRESENT", "LATE"] } } }),
    prisma.batch.findMany({
      select: { id: true, name: true, _count: { select: { enrollments: true } } },
      orderBy: { enrollments: { _count: "desc" } },
      take: 8,
    }),
    prisma.inquiry.groupBy({ by: ["status"], _count: true }),
    prisma.student.count(),
    prisma.teacher.count(),
  ]);

  // Monthly income vs expense series.
  const series = months.map((m) => {
    const income = payments
      .filter((p) => p.paidAt.getFullYear() === m.year && p.paidAt.getMonth() === m.month)
      .reduce((s, p) => s + p.amount, 0);
    const expense = expenses
      .filter((e) => e.spentAt.getFullYear() === m.year && e.spentAt.getMonth() === m.month)
      .reduce((s, e) => s + e.amount, 0);
    return { label: m.label, income, expense };
  });
  const peak = Math.max(1, ...series.map((s) => Math.max(s.income, s.expense)));
  const totalIncome = series.reduce((s, x) => s + x.income, 0);
  const totalExpense = series.reduce((s, x) => s + x.expense, 0);

  const attnRate = attnTotal === 0 ? null : Math.round((attnPresent / attnTotal) * 100);

  const maxEnrol = Math.max(1, ...enrolByBatch.map((b) => b._count.enrollments));

  const funnelOrder: InquiryStatus[] = ["NEW", "CONTACTED", "ENROLLED", "CLOSED"];
  const inqMap = new Map(inquiries.map((i) => [i.status, i._count]));
  const inqTotal = inquiries.reduce((s, i) => s + i._count, 0);

  return (
    <>
      <PageTitle title="Analytics" subtitle="Institute trends across fees, attendance and enrolment." />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-7">
        <StatCard label="Students" value={studentCount} />
        <StatCard label="Teachers" value={teacherCount} />
        <StatCard label="Attendance rate" value={attnRate === null ? "—" : `${attnRate}%`} tone={attnRate !== null && attnRate < 75 ? "red" : "green"} />
        <StatCard label="Net (6 mo)" value={inr(totalIncome - totalExpense)} tone={totalIncome - totalExpense >= 0 ? "gold" : "red"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Income vs Expense · last 6 months">
          <div className="p-5">
            <div className="flex items-end justify-between gap-3 h-56">
              {series.map((s) => (
                <div key={s.label} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full items-end justify-center gap-1 flex-1">
                    <div
                      className="w-1/2 max-w-[22px] rounded-t bg-emerald-400"
                      style={{ height: `${(s.income / peak) * 100}%` }}
                      title={`Income ${inr(s.income)}`}
                    />
                    <div
                      className="w-1/2 max-w-[22px] rounded-t bg-red-300"
                      style={{ height: `${(s.expense / peak) * 100}%` }}
                      title={`Expense ${inr(s.expense)}`}
                    />
                  </div>
                  <span className="text-xs text-navy-400">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center gap-5 text-xs text-navy-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Income {inr(totalIncome)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-red-300" /> Expense {inr(totalExpense)}
              </span>
            </div>
          </div>
        </Panel>

        <Panel title="Enrolment by batch">
          {enrolByBatch.length === 0 ? (
            <EmptyState message="No batches yet." />
          ) : (
            <ul className="p-5 space-y-3">
              {enrolByBatch.map((b) => (
                <li key={b.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-navy-600">{b.name}</span>
                    <span className="font-medium text-navy-700">{b._count.enrollments}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-navy-100">
                    <div
                      className="h-full rounded-full bg-navy-600"
                      style={{ width: `${(b._count.enrollments / maxEnrol) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Admission funnel">
          {inqTotal === 0 ? (
            <EmptyState message="No enquiries yet." />
          ) : (
            <ul className="p-5 space-y-3">
              {funnelOrder.map((status) => {
                const n = inqMap.get(status) ?? 0;
                return (
                  <li key={status}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-navy-600">{status.charAt(0) + status.slice(1).toLowerCase()}</span>
                      <span className="font-medium text-navy-700">
                        {n} · {Math.round((n / inqTotal) * 100)}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-navy-100">
                      <div className="h-full rounded-full bg-gold-500" style={{ width: `${(n / inqTotal) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Fee collection · last 6 months">
          <div className="p-5">
            <div className="flex items-end justify-between gap-3 h-56">
              {series.map((s) => (
                <div key={s.label} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end justify-center">
                    <div
                      className="w-2/3 max-w-[30px] rounded-t bg-gold-500"
                      style={{ height: `${(s.income / peak) * 100}%` }}
                      title={inr(s.income)}
                    />
                  </div>
                  <span className="text-xs text-navy-400">{s.label}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-navy-500">
              Collected {inr(totalIncome)} over 6 months
            </p>
          </div>
        </Panel>
      </div>
    </>
  );
}
