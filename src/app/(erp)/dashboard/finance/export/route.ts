import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { xlsxResponse } from "@/lib/excel";

export const runtime = "nodejs";

const fmt = (d: Date) =>
  d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

/** Inclusive [start, end) range for a year-month, or the whole year. */
function range(year: number, month: number | null) {
  if (month === null) return { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) };
  return { gte: new Date(year, month, 1), lt: new Date(year, month + 1, 1) };
}

/** GET — export the finance P&L (payments, expenses, salaries, summary) as .xlsx. */
export async function GET(req: Request) {
  await requireRole(["ADMIN"]);

  const url = new URL(req.url);
  const now = new Date();
  const year = Number(url.searchParams.get("year")) || now.getFullYear();
  const monthParam = url.searchParams.get("month");
  const month = monthParam === "all" ? null : monthParam != null ? Number(monthParam) : now.getMonth();
  const r = range(year, month);

  const [payments, expenses, salaries] = await Promise.all([
    prisma.payment.findMany({
      where: { paidAt: r },
      include: { student: { include: { user: true } } },
      orderBy: { paidAt: "desc" },
    }),
    prisma.expense.findMany({ where: { spentAt: r }, orderBy: { spentAt: "desc" } }),
    prisma.salaryPayment.findMany({
      where: { paidAt: r },
      include: { teacher: { include: { user: true } } },
      orderBy: { paidAt: "desc" },
    }),
  ]);

  const income = payments.reduce((s, p) => s + p.amount, 0);
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const salaryTotal = salaries.reduce((s, e) => s + e.amount, 0);

  const periodLabel = month === null ? `${year}` : `${year}-${String(month + 1).padStart(2, "0")}`;

  return xlsxResponse(`finance-${periodLabel}.xlsx`, [
    {
      name: "Summary",
      rows: [
        { Metric: "Period", Value: periodLabel },
        { Metric: "Revenue (fees collected)", Value: income },
        { Metric: "Expenses", Value: expenseTotal },
        { Metric: "Salaries", Value: salaryTotal },
        { Metric: "Net profit", Value: income - expenseTotal - salaryTotal },
      ],
    },
    {
      name: "Payments",
      rows: payments.map((p) => ({
        Receipt: p.receiptNo,
        Student: p.student.user.name,
        Amount: p.amount,
        Mode: p.mode,
        ForMonth: p.forMonth ?? "",
        Date: fmt(p.paidAt),
        Note: p.note ?? "",
      })),
    },
    {
      name: "Expenses",
      rows: expenses.map((e) => ({
        Title: e.title,
        Category: e.category,
        Amount: e.amount,
        Date: fmt(e.spentAt),
        Note: e.note ?? "",
      })),
    },
    {
      name: "Salaries",
      rows: salaries.map((s) => ({
        Teacher: s.teacher.user.name,
        Amount: s.amount,
        ForMonth: s.forMonth,
        Mode: s.mode,
        Date: fmt(s.paidAt),
        Note: s.note ?? "",
      })),
    },
  ]);
}
