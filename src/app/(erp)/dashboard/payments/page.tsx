import Link from "next/link";
import { FileText, Sheet } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { studentByUser, childrenByParentUser } from "@/lib/dal";
import { PageTitle, Panel, EmptyState, StatCard } from "@/components/erp/ui";

export const metadata = { title: "Payment History" };

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

type PayRow = {
  id: string;
  amount: number;
  mode: string;
  receiptNo: string;
  forMonth: string | null;
  note: string | null;
  paidAt: Date;
  student: { user: { name: string } };
  feeSlip: { id: string } | null;
};

const include = {
  student: { include: { user: true } },
  feeSlip: { select: { id: true } },
} as const;

export default async function PaymentsPage() {
  const user = await requireUser();
  if (user.role === "STUDENT") {
    const student = await studentByUser(user.id);
    if (!student) return <EmptyState message="Student profile not found." />;
    const rows = await prisma.payment.findMany({
      where: { studentId: student.id },
      include,
      orderBy: { paidAt: "desc" },
    });
    return <View title="Payment History" subtitle="All your fee payments and receipts." rows={rows} />;
  }
  if (user.role === "PARENT") {
    const children = await childrenByParentUser(user.id);
    const rows = await prisma.payment.findMany({
      where: { studentId: { in: children.map((c) => c.id) } },
      include,
      orderBy: { paidAt: "desc" },
    });
    return <View title="Payment History" subtitle="Fee payments for your children." rows={rows} showStudent />;
  }
  if (user.role === "ADMIN") {
    const rows = await prisma.payment.findMany({ include, orderBy: { paidAt: "desc" } });
    return <View title="Fee Collection" subtitle="All fee payments collected." rows={rows} showStudent />;
  }
  return <EmptyState message="Payment history is not available for this role." />;
}

function View({
  title,
  subtitle,
  rows,
  showStudent,
}: {
  title: string;
  subtitle: string;
  rows: PayRow[];
  showStudent?: boolean;
}) {
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const thisMonth = rows
    .filter((r) => {
      const now = new Date();
      return r.paidAt.getMonth() === now.getMonth() && r.paidAt.getFullYear() === now.getFullYear();
    })
    .reduce((s, r) => s + r.amount, 0);

  return (
    <>
      <PageTitle
        title={title}
        subtitle={subtitle}
        action={
          rows.length > 0 ? (
            <a
              href="/dashboard/payments/export"
              className="inline-flex items-center gap-1.5 rounded-xl border border-navy-200 bg-white px-4 py-2 text-sm font-semibold text-navy-700 hover:border-gold-500 hover:text-gold-600"
            >
              <Sheet size={16} /> Export Excel
            </a>
          ) : undefined
        }
      />
      <div className="grid gap-5 sm:grid-cols-3 mb-7">
        <StatCard label="Total collected" value={inr(total)} tone="green" />
        <StatCard label="This month" value={inr(thisMonth)} tone="gold" />
        <StatCard label="Payments" value={rows.length} />
      </div>
      <Panel>
        {rows.length === 0 ? (
          <EmptyState message="No payments recorded yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-navy-400 border-b border-navy-100">
                  <th className="px-5 py-3 font-semibold">Receipt</th>
                  {showStudent && <th className="px-5 py-3 font-semibold">Student</th>}
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Mode</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-ivory/40">
                    <td className="px-5 py-3.5 font-mono text-xs text-navy-600">{r.receiptNo}</td>
                    {showStudent && (
                      <td className="px-5 py-3.5 font-medium text-navy-700">{r.student.user.name}</td>
                    )}
                    <td className="px-5 py-3.5 font-medium text-navy-700">{inr(r.amount)}</td>
                    <td className="px-5 py-3.5 text-navy-500">
                      {r.mode}
                      {r.forMonth ? ` · ${r.forMonth}` : ""}
                    </td>
                    <td className="px-5 py-3.5 text-navy-500 whitespace-nowrap">
                      {r.paidAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {r.feeSlip ? (
                        <Link
                          href={`/dashboard/fees/slips/${r.feeSlip.id}`}
                          className="inline-flex items-center gap-1.5 font-semibold text-navy-700 hover:text-gold-600"
                        >
                          <FileText size={15} /> View
                        </Link>
                      ) : (
                        <span className="text-navy-300">—</span>
                      )}
                    </td>
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
