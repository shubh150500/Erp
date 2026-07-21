import { requireRole } from "@/lib/rbac";
import { xlsxResponse } from "@/lib/excel";
import { ledgerEntries, resolvePeriod, type LedgerKind } from "@/lib/ledger";

export const runtime = "nodejs";

const fmt = (d: Date) =>
  d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const kindLabel: Record<LedgerKind, string> = {
  INCOME_FEE: "Fee income",
  INCOME_OTHER: "Other income",
  EXPENSE: "Expense",
  SALARY: "Salary",
};

/** GET — export the accounting ledger + summary for the selected period as .xlsx. */
export async function GET(req: Request) {
  await requireRole(["ADMIN"]);

  const url = new URL(req.url);
  const sp = Object.fromEntries(url.searchParams.entries());
  const period = resolvePeriod(sp, new Date());
  const { entries, totals } = await ledgerEntries(period.range);

  return xlsxResponse(`ledger-${period.view}-${period.dateStr}.xlsx`, [
    {
      name: "Summary",
      rows: [
        { Metric: "Period", Value: period.label },
        { Metric: "Fee income", Value: totals.feeIncome },
        { Metric: "Other income", Value: totals.otherIncome },
        { Metric: "Total income", Value: totals.income },
        { Metric: "Expenses", Value: totals.expenses },
        { Metric: "Salaries", Value: totals.salaries },
        { Metric: "Total outflow", Value: totals.outflow },
        { Metric: "Net profit / loss", Value: totals.net },
      ],
    },
    {
      name: "Ledger",
      rows: entries.map((e) => ({
        Date: fmt(e.date),
        Type: kindLabel[e.kind],
        Reference: e.ref,
        Particulars: e.party,
        Description: e.description,
        Credit: e.credit || "",
        Debit: e.debit || "",
        Balance: e.balance,
      })),
    },
  ]);
}
