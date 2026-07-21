import { prisma } from "@/lib/prisma";

/** Start of today (local). */
function startOfToday() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

/** Start of the current week (Monday, local). */
function startOfWeek() {
  const t = startOfToday();
  const day = (t.getDay() + 6) % 7; // 0 = Monday … 6 = Sunday
  return new Date(t.getFullYear(), t.getMonth(), t.getDate() - day);
}

/**
 * Aggregate finance figures for the admin dashboard:
 * collection by period, all-time totals, salaries, net profit, dues, pending fees.
 */
export async function financeStats() {
  const now = new Date();
  const today = startOfToday();
  const weekStart = startOfWeek();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const sumPayments = (gte?: Date) =>
    prisma.payment.aggregate({
      _sum: { amount: true },
      ...(gte ? { where: { paidAt: { gte } } } : {}),
    });

  const [
    todayAgg,
    weekAgg,
    monthAgg,
    yearAgg,
    totalAgg,
    expenseAgg,
    salaryAgg,
    enrollments,
    pendingAgg,
  ] = await Promise.all([
    sumPayments(today),
    sumPayments(weekStart),
    sumPayments(monthStart),
    sumPayments(yearStart),
    sumPayments(),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.salaryPayment.aggregate({ _sum: { amount: true } }),
    prisma.enrollment.findMany({ select: { batch: { select: { feeAmount: true } } } }),
    prisma.feeSlip.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { status: "PENDING" },
    }),
  ]);

  const revenue = totalAgg._sum.amount ?? 0;
  const expenses = expenseAgg._sum.amount ?? 0;
  const salaries = salaryAgg._sum.amount ?? 0;
  const billed = enrollments.reduce((s, e) => s + e.batch.feeAmount, 0);
  const dues = Math.max(0, billed - revenue);

  return {
    today: todayAgg._sum.amount ?? 0,
    week: weekAgg._sum.amount ?? 0,
    month: monthAgg._sum.amount ?? 0,
    year: yearAgg._sum.amount ?? 0,
    revenue,
    expenses,
    salaries,
    net: revenue - expenses - salaries,
    dues,
    pendingAmount: pendingAgg._sum.amount ?? 0,
    pendingCount: pendingAgg._count,
  };
}
