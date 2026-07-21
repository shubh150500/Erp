import { prisma } from "@/lib/prisma";

/** A single money movement. Income credits the books; expense/salary debits them. */
export type LedgerKind = "INCOME_FEE" | "INCOME_OTHER" | "EXPENSE" | "SALARY";

export type LedgerEntry = {
  id: string;
  date: Date;
  kind: LedgerKind;
  ref: string; // receipt no / slip no / category / pay-month
  party: string; // student name / payee / vendor / income title
  description: string;
  credit: number; // money in
  debit: number; // money out
};

export type LedgerTotals = {
  feeIncome: number;
  otherIncome: number;
  income: number;
  expenses: number;
  salaries: number;
  outflow: number;
  net: number;
};

export type LedgerResult = {
  entries: (LedgerEntry & { balance: number })[];
  totals: LedgerTotals;
};

/**
 * Unified accounting ledger for a [gte, lt) date range: merges fee income
 * (Payment), other income (OtherIncome), expenses (Expense) and salaries
 * (SalaryPayment) into one chronological list with a running balance.
 * Totals mirror the figures used by the Finance P&L dashboard.
 */
export async function ledgerEntries(range: { gte: Date; lt: Date }): Promise<LedgerResult> {
  const [payments, otherIncomes, expenses, salaries] = await Promise.all([
    prisma.payment.findMany({
      where: { paidAt: range },
      include: { student: { include: { user: true } } },
    }),
    prisma.otherIncome.findMany({ where: { receivedAt: range } }),
    prisma.expense.findMany({ where: { spentAt: range } }),
    prisma.salaryPayment.findMany({
      where: { paidAt: range },
      include: { teacher: { include: { user: true } } },
    }),
  ]);

  const entries: LedgerEntry[] = [];

  for (const p of payments) {
    entries.push({
      id: p.id,
      date: p.paidAt,
      kind: "INCOME_FEE",
      ref: p.receiptNo,
      party: p.student.user.name,
      description: ["Fee", p.forMonth, p.note].filter(Boolean).join(" · "),
      credit: p.amount,
      debit: 0,
    });
  }
  for (const o of otherIncomes) {
    entries.push({
      id: o.id,
      date: o.receivedAt,
      kind: "INCOME_OTHER",
      ref: o.category,
      party: o.title,
      description: o.note ?? "",
      credit: o.amount,
      debit: 0,
    });
  }
  for (const e of expenses) {
    entries.push({
      id: e.id,
      date: e.spentAt,
      kind: "EXPENSE",
      ref: e.category,
      party: e.title,
      description: e.note ?? "",
      credit: 0,
      debit: e.amount,
    });
  }
  for (const s of salaries) {
    entries.push({
      id: s.id,
      date: s.paidAt,
      kind: "SALARY",
      ref: s.forMonth,
      party: s.teacher.user.name,
      description: ["Salary", s.status !== "PAID" ? s.status : null].filter(Boolean).join(" · "),
      credit: 0,
      debit: s.amount,
    });
  }

  entries.sort((a, b) => a.date.getTime() - b.date.getTime());

  let balance = 0;
  const withBalance = entries.map((e) => {
    balance += e.credit - e.debit;
    return { ...e, balance };
  });

  const feeIncome = payments.reduce((s, p) => s + p.amount, 0);
  const otherIncome = otherIncomes.reduce((s, o) => s + o.amount, 0);
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const salaryTotal = salaries.reduce((s, x) => s + x.amount, 0);
  const income = feeIncome + otherIncome;
  const outflow = expenseTotal + salaryTotal;

  return {
    entries: withBalance,
    totals: {
      feeIncome,
      otherIncome,
      income,
      expenses: expenseTotal,
      salaries: salaryTotal,
      outflow,
      net: income - outflow,
    },
  };
}

export type PeriodView = "day" | "month" | "year";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export type ResolvedPeriod = {
  view: PeriodView;
  range: { gte: Date; lt: Date };
  label: string; // human label e.g. "June 2026"
  scope: string; // "Daily statement" | "Monthly statement" | "Annual statement"
  year: number;
  month: number; // 0-indexed
  dateStr: string; // YYYY-MM-DD of the selected day (or today)
};

/**
 * Resolve the Day / Month / Year period filter from search params into a date
 * range + display labels. Shared by the accounting page and its export routes
 * so they always agree on the window.
 */
export function resolvePeriod(
  sp: { view?: string; date?: string; year?: string; month?: string },
  now: Date
): ResolvedPeriod {
  const view: PeriodView = sp.view === "day" || sp.view === "year" ? sp.view : "month";

  if (view === "day") {
    const base = sp.date ? new Date(`${sp.date}T00:00:00`) : now;
    const day = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    return {
      view,
      range: { gte: day, lt: new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1) },
      label: day.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      scope: "Daily statement",
      year: day.getFullYear(),
      month: day.getMonth(),
      dateStr: ymd(day),
    };
  }

  if (view === "year") {
    const year = Number(sp.year) || now.getFullYear();
    return {
      view,
      range: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
      label: String(year),
      scope: "Annual statement",
      year,
      month: now.getMonth(),
      dateStr: ymd(now),
    };
  }

  const year = Number(sp.year) || now.getFullYear();
  const month = sp.month != null && sp.month !== "" ? Number(sp.month) : now.getMonth();
  return {
    view,
    range: { gte: new Date(year, month, 1), lt: new Date(year, month + 1, 1) },
    label: `${MONTH_NAMES[month]} ${year}`,
    scope: "Monthly statement",
    year,
    month,
    dateStr: ymd(now),
  };
}

/** Expense totals grouped by category, sorted desc. */
export function groupByCategory(
  rows: { category: string; amount: number }[]
): [string, number][] {
  const m = new Map<string, number>();
  for (const r of rows) m.set(r.category, (m.get(r.category) ?? 0) + r.amount);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}
