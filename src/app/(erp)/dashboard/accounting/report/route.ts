import { requireRole } from "@/lib/rbac";
import { ledgerEntries, resolvePeriod } from "@/lib/ledger";
import { buildFinancialReportPdf, type ReportLine } from "@/lib/report-pdf";

export const runtime = "nodejs";

const catLabel = (c: string) =>
  c
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

/** Sum a category map into sorted report lines. */
function lines(map: Map<string, number>): ReportLine[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, amount]) => ({ label, amount }));
}

/** GET — download the period's P&L statement as a branded PDF. */
export async function GET(req: Request) {
  await requireRole(["ADMIN"]);

  const url = new URL(req.url);
  const sp = Object.fromEntries(url.searchParams.entries());
  const period = resolvePeriod(sp, new Date());
  const { entries, totals } = await ledgerEntries(period.range);

  // Income breakdown: fee collections + other income by category.
  const incomeMap = new Map<string, number>();
  if (totals.feeIncome > 0) incomeMap.set("Tuition / fee collections", totals.feeIncome);
  const otherMap = new Map<string, number>();
  for (const e of entries) {
    if (e.kind === "INCOME_OTHER") otherMap.set(catLabel(e.ref), (otherMap.get(catLabel(e.ref)) ?? 0) + e.credit);
  }
  for (const [k, v] of otherMap) incomeMap.set(k, v);

  // Expense breakdown: expenses by category + salaries.
  const expenseMap = new Map<string, number>();
  for (const e of entries) {
    if (e.kind === "EXPENSE") expenseMap.set(catLabel(e.ref), (expenseMap.get(catLabel(e.ref)) ?? 0) + e.debit);
  }
  if (totals.salaries > 0) expenseMap.set("Staff salaries", totals.salaries);

  const pdf = await buildFinancialReportPdf({
    periodLabel: period.label,
    scope: period.scope,
    generatedAt: new Date(),
    income: lines(incomeMap),
    expenses: lines(expenseMap),
    totalIncome: totals.income,
    totalExpense: totals.outflow,
    net: totals.net,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="statement-${period.view}-${period.dateStr}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
