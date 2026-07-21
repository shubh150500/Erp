import { Sheet, FileDown } from "lucide-react";
import { requireRole } from "@/lib/rbac";
import { ledgerEntries, resolvePeriod, type LedgerKind } from "@/lib/ledger";
import { PageTitle, Panel, EmptyState, StatCard } from "@/components/erp/ui";
import { AddIncomeButton } from "./AddIncomeButton";
import { DeleteIncomeButton } from "./DeleteIncomeButton";

export const metadata = { title: "Accounting — Ledger" };

const inr = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const kindMeta: Record<LedgerKind, { label: string; tone: string }> = {
  INCOME_FEE: { label: "Fee", tone: "bg-emerald-100 text-emerald-700" },
  INCOME_OTHER: { label: "Income", tone: "bg-teal-100 text-teal-700" },
  EXPENSE: { label: "Expense", tone: "bg-red-100 text-red-700" },
  SALARY: { label: "Salary", tone: "bg-purple-100 text-purple-700" },
};

export default async function AccountingPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string; year?: string; month?: string }>;
}) {
  await requireRole(["ADMIN"]);
  const sp = await searchParams;
  const now = new Date();
  const period = resolvePeriod(sp, now);
  const { entries, totals } = await ledgerEntries(period.range);

  const years = Array.from({ length: 4 }, (_, i) => now.getFullYear() - i);
  const qs = new URLSearchParams({
    view: period.view,
    year: String(period.year),
    month: String(period.month),
    date: period.dateStr,
  }).toString();

  return (
    <>
      <PageTitle
        title="Accounting — Ledger"
        subtitle={`${period.scope} · ${period.label}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/dashboard/accounting/export?${qs}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-navy-200 bg-white px-4 py-2 text-sm font-semibold text-navy-700 hover:border-gold-500 hover:text-gold-600"
            >
              <Sheet size={16} /> Excel
            </a>
            <a
              href={`/dashboard/accounting/report?${qs}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-navy-200 bg-white px-4 py-2 text-sm font-semibold text-navy-700 hover:border-gold-500 hover:text-gold-600"
            >
              <FileDown size={16} /> PDF report
            </a>
            <AddIncomeButton />
          </div>
        }
      />

      {/* Period summary */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-5">
        <StatCard label="Total income" value={inr(totals.income)} tone="green" hint={`Fees ${inr(totals.feeIncome)} · Other ${inr(totals.otherIncome)}`} />
        <StatCard label="Total outflow" value={inr(totals.outflow)} tone="red" hint={`Expenses ${inr(totals.expenses)} · Salaries ${inr(totals.salaries)}`} />
        <StatCard
          label={totals.net >= 0 ? "Net profit" : "Net loss"}
          value={inr(Math.abs(totals.net))}
          tone={totals.net >= 0 ? "gold" : "red"}
        />
      </div>

      {/* Period filter */}
      <form className="mb-7 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wider text-navy-400 mb-1">View</span>
          <select name="view" defaultValue={period.view} className="rounded-xl border border-navy-200/70 bg-white px-3 py-2 text-sm text-navy-700">
            <option value="day">Day</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </label>
        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wider text-navy-400 mb-1">Day</span>
          <input type="date" name="date" defaultValue={period.dateStr} className="rounded-xl border border-navy-200/70 bg-white px-3 py-2 text-sm text-navy-700" />
        </label>
        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wider text-navy-400 mb-1">Month</span>
          <select name="month" defaultValue={String(period.month)} className="rounded-xl border border-navy-200/70 bg-white px-3 py-2 text-sm text-navy-700">
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wider text-navy-400 mb-1">Year</span>
          <select name="year" defaultValue={String(period.year)} className="rounded-xl border border-navy-200/70 bg-white px-3 py-2 text-sm text-navy-700">
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-xl bg-navy-700 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800">
          Apply
        </button>
      </form>

      <Panel title={`Ledger · ${entries.length} ${entries.length === 1 ? "entry" : "entries"}`}>
        {entries.length === 0 ? (
          <EmptyState message="No transactions in this period." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-navy-400 border-b border-navy-100">
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Particulars</th>
                  <th className="px-5 py-3 font-semibold text-right">Credit (in)</th>
                  <th className="px-5 py-3 font-semibold text-right">Debit (out)</th>
                  <th className="px-5 py-3 font-semibold text-right">Balance</th>
                  <th className="px-5 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {entries.map((e) => {
                  const meta = kindMeta[e.kind];
                  return (
                    <tr key={`${e.kind}-${e.id}`} className="hover:bg-ivory/40">
                      <td className="px-5 py-3 text-navy-500 whitespace-nowrap">
                        {e.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.tone}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-medium text-navy-700">{e.party}</span>
                        <span className="block text-xs text-navy-400">
                          {e.ref}
                          {e.description ? ` · ${e.description}` : ""}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-emerald-600">
                        {e.credit ? inr(e.credit) : "—"}
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-red-600">
                        {e.debit ? inr(e.debit) : "—"}
                      </td>
                      <td className={`px-5 py-3 text-right font-semibold ${e.balance >= 0 ? "text-navy-700" : "text-red-600"}`}>
                        {inr(e.balance)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {e.kind === "INCOME_OTHER" ? <DeleteIncomeButton id={e.id} /> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-navy-200 bg-ivory/40 font-semibold text-navy-700">
                  <td className="px-5 py-3" colSpan={3}>Period totals</td>
                  <td className="px-5 py-3 text-right text-emerald-700">{inr(totals.income)}</td>
                  <td className="px-5 py-3 text-right text-red-700">{inr(totals.outflow)}</td>
                  <td className={`px-5 py-3 text-right ${totals.net >= 0 ? "text-navy-700" : "text-red-600"}`}>{inr(totals.net)}</td>
                  <td className="px-5 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
