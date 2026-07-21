import { TrendingUp, TrendingDown, Scale, Sheet, FileDown, Paperclip } from "lucide-react";
import { requireRole } from "@/lib/rbac";
import { prisma, safeQuery } from "@/lib/prisma";
import { financeStats } from "@/lib/finance-stats";
import { PageTitle, Panel, EmptyState, StatCard } from "@/components/erp/ui";
import { AddExpenseButton } from "./AddExpenseButton";
import { DeleteExpenseButton } from "./DeleteExpenseButton";

export const metadata = { title: "Finance — Income & Expenses" };

const inr = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const catTone: Record<string, string> = {
  RENT: "bg-blue-100 text-blue-700",
  SALARY: "bg-purple-100 text-purple-700",
  UTILITIES: "bg-amber-100 text-amber-700",
  ELECTRICITY: "bg-yellow-100 text-yellow-700",
  INTERNET: "bg-sky-100 text-sky-700",
  SUPPLIES: "bg-teal-100 text-teal-700",
  STATIONERY: "bg-lime-100 text-lime-700",
  BOOKS: "bg-indigo-100 text-indigo-700",
  FURNITURE: "bg-rose-100 text-rose-700",
  MARKETING: "bg-pink-100 text-pink-700",
  MAINTENANCE: "bg-orange-100 text-orange-700",
  OTHER: "bg-gray-100 text-gray-600",
};

function range(year: number, month: number | null) {
  if (month === null) {
    return { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) };
  }
  return { gte: new Date(year, month, 1), lt: new Date(year, month + 1, 1) };
}

function lastMonths(count: number) {
  const now = new Date();
  const out: { year: number; month: number; label: string }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ year: d.getFullYear(), month: d.getMonth(), label: MONTHS[d.getMonth()] });
  }
  return out;
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  await requireRole(["ADMIN"]);
  const sp = await searchParams;

  const now = new Date();
  const year = Number(sp.year) || now.getFullYear();
  const month = sp.month === "all" ? null : sp.month != null ? Number(sp.month) : now.getMonth();
  const r = range(year, month);

  const trend = lastMonths(12);
  const trendSince = new Date(trend[0].year, trend[0].month, 1);

  const payments = await safeQuery(() => prisma.payment.findMany({ where: { paidAt: r }, select: { amount: true } }), []);
  const expenses = await safeQuery(() => prisma.expense.findMany({ where: { spentAt: r }, orderBy: { spentAt: "desc" } }), []);
  const salaryPayments = await safeQuery(() => prisma.salaryPayment.findMany({ where: { paidAt: r }, select: { amount: true } }), []);
  const stats = await safeQuery(() => financeStats(), { today: 0, week: 0, month: 0, year: 0, revenue: 0, expenses: 0, salaries: 0, net: 0, dues: 0, pendingCount: 0, pendingAmount: 0 });
  const trendPayments = await safeQuery(() => prisma.payment.findMany({ where: { paidAt: { gte: trendSince } }, select: { amount: true, paidAt: true } }), []);
  const trendExpenses = await safeQuery(() => prisma.expense.findMany({ where: { spentAt: { gte: trendSince } }, select: { amount: true, spentAt: true } }), []);
  const trendSalaries = await safeQuery(() => prisma.salaryPayment.findMany({ where: { paidAt: { gte: trendSince } }, select: { amount: true, paidAt: true } }), []);

  const series = trend.map((m) => {
    const inMonth = (d: Date) => d && new Date(d).getFullYear() === m.year && new Date(d).getMonth() === m.month;
    const income = trendPayments.filter((p) => inMonth(p.paidAt)).reduce((s, p) => s + p.amount, 0);
    const outflow =
      trendExpenses.filter((e) => inMonth(e.spentAt)).reduce((s, e) => s + e.amount, 0) +
      trendSalaries.filter((x) => inMonth(x.paidAt)).reduce((s, x) => s + x.amount, 0);
    return { label: m.label, income, outflow };
  });
  const trendPeak = Math.max(1, ...series.map((s) => Math.max(s.income, s.outflow)));
  const trendIncome = series.reduce((s, x) => s + x.income, 0);
  const trendOutflow = series.reduce((s, x) => s + x.outflow, 0);

  const income = payments.reduce((s, p) => s + p.amount, 0);
  const expense = expenses.reduce((s, e) => s + e.amount, 0);
  const salaries = salaryPayments.reduce((s, e) => s + e.amount, 0);
  const net = income - expense - salaries;

  const byCat = new Map<string, number>();
  for (const e of expenses) byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
  const cats = [...byCat.entries()].sort((a, b) => b[1] - a[1]);

  const periodLabel = month === null ? `${year}` : `${MONTHS[month]} ${year}`;
  const years = Array.from({ length: 4 }, (_, i) => now.getFullYear() - i);

  return (
    <>
      <PageTitle
        title="Finance — Profit & Loss"
        subtitle={`Income, expenses and net position · ${periodLabel}`}
        action={
          <div className="flex items-center gap-2">
            <a
              href={`/dashboard/finance/export?year=${year}&month=${month === null ? "all" : month}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-navy-200 bg-white px-4 py-2 text-sm font-semibold text-navy-700 hover:border-gold-500 hover:text-gold-600"
            >
              <Sheet size={16} /> Export Excel
            </a>
            <a
              href={
                month === null
                  ? `/dashboard/accounting/report?view=year&year=${year}`
                  : `/dashboard/accounting/report?view=month&year=${year}&month=${month}`
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-navy-200 bg-white px-4 py-2 text-sm font-semibold text-navy-700 hover:border-gold-500 hover:text-gold-600"
            >
              <FileDown size={16} /> PDF report
            </a>
            <AddExpenseButton />
          </div>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-5">
        <StatCard label="Today's collection" value={inr(stats.today)} tone="green" />
        <StatCard label="This week" value={inr(stats.week)} tone="green" />
        <StatCard label="This month" value={inr(stats.month)} tone="green" />
        <StatCard label="This year" value={inr(stats.year)} tone="green" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-7">
        <StatCard label="Total revenue" value={inr(stats.revenue)} tone="gold" />
        <StatCard label="Total expenses" value={inr(stats.expenses + stats.salaries)} tone="red" hint={`incl. ${inr(stats.salaries)} salaries`} />
        <StatCard
          label={stats.net >= 0 ? "Net profit" : "Net loss"}
          value={inr(Math.abs(stats.net))}
          tone={stats.net >= 0 ? "gold" : "red"}
        />
        <StatCard
          label="Outstanding dues"
          value={inr(stats.dues)}
          tone={stats.dues > 0 ? "red" : "green"}
          hint={`${stats.pendingCount} pending slips · ${inr(stats.pendingAmount)}`}
        />
      </div>

      <Panel title="Income vs outflow · last 12 months" className="mb-7">
        <div className="p-5">
          <div className="flex items-end justify-between gap-2 h-56">
            {series.map((s) => (
              <div key={s.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full items-end justify-center gap-1 flex-1">
                  <div
                    className="w-1/2 max-w-[18px] rounded-t bg-emerald-400"
                    style={{ height: `${(s.income / trendPeak) * 100}%` }}
                    title={`Income ${inr(s.income)}`}
                  />
                  <div
                    className="w-1/2 max-w-[18px] rounded-t bg-red-300"
                    style={{ height: `${(s.outflow / trendPeak) * 100}%` }}
                    title={`Outflow ${inr(s.outflow)}`}
                  />
                </div>
                <span className="text-xs text-navy-400">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center gap-5 text-xs text-navy-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Income {inr(trendIncome)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-red-300" /> Outflow {inr(trendOutflow)}
            </span>
          </div>
        </div>
      </Panel>

      <form className="mb-7 flex flex-wrap items-center gap-3">
        <select
          name="month"
          defaultValue={month === null ? "all" : String(month)}
          className="rounded-xl border border-navy-200/70 bg-white px-3 py-2 text-sm text-navy-700"
        >
          <option value="all">Whole year</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i}>
              {m}
            </option>
          ))}
        </select>
        <select
          name="year"
          defaultValue={String(year)}
          className="rounded-xl border border-navy-200/70 bg-white px-3 py-2 text-sm text-navy-700"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-navy-700 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
        >
          Apply
        </button>
      </form>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-7">
        <StatCard label="Income (fees collected)" value={inr(income)} tone="green" hint={`${payments.length} payments`} />
        <StatCard label="Expenses" value={inr(expense)} tone="red" hint={`${expenses.length} entries`} />
        <StatCard label="Salaries paid" value={inr(salaries)} tone="red" hint={`${salaryPayments.length} payments`} />
        <StatCard
          label={net >= 0 ? "Net profit" : "Net loss"}
          value={inr(Math.abs(net))}
          tone={net >= 0 ? "gold" : "red"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Expenses">
          {expenses.length === 0 ? (
            <EmptyState message="No expenses recorded for this period." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-navy-400 border-b border-navy-100">
                    <th className="px-5 py-3 font-semibold">Title</th>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th className="px-5 py-3 font-semibold">Amount</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-ivory/40">
                      <td className="px-5 py-3.5 font-medium text-navy-700">
                        {e.title}
                        {e.note && <span className="block text-xs text-navy-400">{e.note}</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            catTone[e.category] ?? catTone.OTHER
                          }`}
                        >
                          {e.category.charAt(0) + e.category.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-navy-700">{inr(e.amount)}</td>
                      <td className="px-5 py-3.5 text-navy-500 whitespace-nowrap">
                        {e.spentAt ? new Date(e.spentAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-3">
                          {e.invoiceImage && (
                            <a
                              href={e.invoiceImage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-navy-500 hover:text-gold-600"
                              title="View invoice"
                            >
                              <Paperclip size={13} /> Invoice
                            </a>
                          )}
                          <DeleteExpenseButton id={e.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Breakdown">
          <div className="p-5 space-y-4">
            <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 p-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <TrendingUp size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Income</span>
              </div>
              <p className="mt-1.5 font-serif text-2xl font-bold text-emerald-700">{inr(income)}</p>
            </div>

            <div className="rounded-xl bg-red-50/70 border border-red-100 p-4">
              <div className="flex items-center gap-2 text-red-600">
                <TrendingDown size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Expenses by category</span>
              </div>
              {cats.length === 0 && salaries === 0 ? (
                <p className="mt-2 text-sm text-navy-400">No expenses.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {cats.map(([c, amt]) => (
                    <li key={c} className="flex items-center justify-between text-sm">
                      <span className="text-navy-600">{c.charAt(0) + c.slice(1).toLowerCase()}</span>
                      <span className="font-medium text-navy-700">{inr(amt)}</span>
                    </li>
                  ))}
                  {salaries > 0 && (
                    <li className="flex items-center justify-between text-sm border-t border-red-100 pt-1.5">
                      <span className="text-navy-600">Salaries</span>
                      <span className="font-medium text-navy-700">{inr(salaries)}</span>
                    </li>
                  )}
                </ul>
              )}
            </div>

            <div
              className={`rounded-xl border p-4 ${
                net >= 0 ? "bg-gold-50/60 border-gold-200" : "bg-red-50/70 border-red-100"
              }`}
            >
              <div className={`flex items-center gap-2 ${net >= 0 ? "text-gold-700" : "text-red-600"}`}>
                <Scale size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {net >= 0 ? "Net profit" : "Net loss"}
                </span>
              </div>
              <p className={`mt-1.5 font-serif text-2xl font-bold ${net >= 0 ? "text-gold-700" : "text-red-600"}`}>
                {inr(Math.abs(net))}
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}
