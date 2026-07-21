import { requireUser } from "@/lib/rbac";
import { prisma, safeQuery } from "@/lib/prisma";
import { feeSummary, studentByUser, childrenByParentUser } from "@/lib/dal";
import { PageTitle, Panel, EmptyState, StatCard } from "@/components/erp/ui";
import { RecordPaymentButton } from "./RecordPaymentButton";

export const metadata = { title: "Fees" };

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export default async function FeesPage() {
  const user = await requireUser();

  if (user.role === "ADMIN") return <AdminFees />;
  if (user.role === "STUDENT") return <StudentFees userId={user.id} />;
  if (user.role === "PARENT") return <ParentFees userId={user.id} />;
  return <EmptyState message="Fees are not available for this role." />;
}

async function AdminFees() {
  const students = await safeQuery(
    () =>
      prisma.student.findMany({
        include: {
          user: true,
          enrollments: { include: { batch: true } },
          payments: true,
        },
        orderBy: { rollNo: "asc" },
      }),
    []
  );

  const payments = await safeQuery(
    () =>
      prisma.payment.findMany({
        include: { student: { include: { user: true } } },
        orderBy: { paidAt: "desc" },
        take: 10,
      }),
    []
  );

  const rows = students.map((s) => {
    const billed = s.enrollments?.reduce((sum, e) => sum + (e.batch?.feeAmount ?? 0), 0) ?? 0;
    const paid = s.payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
    return { s, billed, paid, due: Math.max(0, billed - paid) };
  });

  const totals = rows.reduce(
    (t, r) => ({
      billed: t.billed + r.billed,
      paid: t.paid + r.paid,
      due: t.due + r.due,
    }),
    { billed: 0, paid: 0, due: 0 }
  );

  const studentOpts = students.map((s) => ({
    id: s.id,
    label: `${s.user?.name ?? "Student"} (${s.rollNo})`,
  }));

  return (
    <>
      <PageTitle
        title="Fees"
        subtitle="Billing, collections and dues."
        action={<RecordPaymentButton students={studentOpts} />}
      />
      <div className="grid gap-5 sm:grid-cols-3 mb-7">
        <StatCard label="Total billed" value={inr(totals.billed)} />
        <StatCard label="Collected" value={inr(totals.paid)} tone="green" />
        <StatCard label="Outstanding" value={inr(totals.due)} tone="red" />
      </div>

      <Panel title="Student-wise dues" className="mb-7">
        {rows.length === 0 ? (
          <EmptyState message="No students yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-navy-400 border-b border-navy-100">
                  <th className="px-5 py-3 font-semibold">Student</th>
                  <th className="px-5 py-3 font-semibold">Billed</th>
                  <th className="px-5 py-3 font-semibold">Paid</th>
                  <th className="px-5 py-3 font-semibold">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {rows.map(({ s, billed, paid, due }) => (
                  <tr key={s.id} className="hover:bg-ivory/40">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-navy-700">{s.user?.name ?? "Student"}</p>
                      <p className="text-xs text-navy-400">{s.rollNo}</p>
                    </td>
                    <td className="px-5 py-3.5 text-navy-600">{inr(billed)}</td>
                    <td className="px-5 py-3.5 text-emerald-600">{inr(paid)}</td>
                    <td className={`px-5 py-3.5 font-semibold ${due > 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {inr(due)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Recent payments">
        {payments.length === 0 ? (
          <EmptyState message="No payments recorded yet." />
        ) : (
          <ul className="divide-y divide-navy-100">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="font-medium text-navy-700">{p.student?.user?.name ?? "Student"}</p>
                  <p className="text-xs text-navy-400">
                    {p.receiptNo} · {p.mode}
                    {p.forMonth ? ` · ${p.forMonth}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-emerald-600">{inr(p.amount)}</p>
                  <p className="text-xs text-navy-400">
                    {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

async function StudentFees({ userId }: { userId: string }) {
  const student = await safeQuery(() => studentByUser(userId), null);
  if (!student) return <EmptyState message="Student profile not found." />;
  
  const fees = await safeQuery(() => feeSummary(student.id), { billed: 0, paid: 0, due: 0 });
  const payments = await safeQuery(
    () =>
      prisma.payment.findMany({
        where: { studentId: student.id },
        orderBy: { paidAt: "desc" },
      }),
    []
  );

  return (
    <>
      <PageTitle title="My Fees" subtitle="Your fee summary and payment history." />
      <div className="grid gap-5 sm:grid-cols-3 mb-7">
        <StatCard label="Total billed" value={inr(fees.billed)} />
        <StatCard label="Paid" value={inr(fees.paid)} tone="green" />
        <StatCard label="Due" value={inr(fees.due)} tone={fees.due > 0 ? "red" : "green"} />
      </div>
      <Panel title="Payment history">
        {payments.length === 0 ? (
          <EmptyState message="No payments yet." />
        ) : (
          <ul className="divide-y divide-navy-100">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="font-medium text-navy-700">{p.receiptNo}</p>
                  <p className="text-xs text-navy-400">{p.mode}{p.forMonth ? ` · ${p.forMonth}` : ""}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-emerald-600">{inr(p.amount)}</p>
                  <p className="text-xs text-navy-400">
                    {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

async function ParentFees({ userId }: { userId: string }) {
  const children = await safeQuery(() => childrenByParentUser(userId), []);
  const data = await Promise.all(
    children.map(async (c) => ({ child: c, fees: await safeQuery(() => feeSummary(c.id), { billed: 0, paid: 0, due: 0 }) }))
  );

  return (
    <>
      <PageTitle title="Fees" subtitle="Fee summary for your children." />
      {data.length === 0 ? (
        <EmptyState message="No linked children found." />
      ) : (
        <div className="space-y-6">
          {data.map(({ child, fees }) => (
            <Panel key={child.id} title={`${child.user?.name ?? "Student"} · ${child.className}`}>
              <div className="grid gap-5 sm:grid-cols-3 p-5">
                <StatCard label="Billed" value={inr(fees.billed)} />
                <StatCard label="Paid" value={inr(fees.paid)} tone="green" />
                <StatCard label="Due" value={inr(fees.due)} tone={fees.due > 0 ? "red" : "green"} />
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
