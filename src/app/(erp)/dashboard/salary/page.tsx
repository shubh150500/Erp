import { CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageTitle, Panel, EmptyState, StatCard } from "@/components/erp/ui";
import { SetSalaryButton } from "./SetSalaryButton";
import { PaySalaryButton } from "./PaySalaryButton";
import { DeleteSalaryButton } from "./DeleteSalaryButton";

export const metadata = { title: "Salary" };

const inr = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

/** Current year-month as YYYY-MM. */
function thisMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** "2026-06" -> "Jun 2026" */
function monthLabel(m: string) {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export default async function SalaryPage() {
  const user = await requireUser();
  if (user.role === "ADMIN") return <AdminView />;
  if (user.role === "TEACHER") return <TeacherView userId={user.id} />;
  return <EmptyState message="Salary is not available for this role." />;
}

async function AdminView() {
  const month = thisMonth();
  const teachers = await prisma.teacher.findMany({
    include: {
      user: true,
      salaryPayments: { orderBy: { paidAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const monthlyBill = teachers.reduce((s, t) => s + t.monthlySalary, 0);
  const paidThisMonth = teachers
    .flatMap((t) => t.salaryPayments)
    .filter((p) => p.forMonth === month)
    .reduce((s, p) => s + p.amount, 0);
  const paidCount = teachers.filter((t) => t.salaryPayments.some((p) => p.forMonth === month)).length;

  return (
    <>
      <PageTitle title="Salary" subtitle={`Teacher salaries · ${monthLabel(month)}`} />

      <div className="grid gap-5 sm:grid-cols-3 mb-7">
        <StatCard label="Monthly salary bill" value={inr(monthlyBill)} />
        <StatCard label="Paid this month" value={inr(paidThisMonth)} tone="green" hint={`${paidCount}/${teachers.length} staff`} />
        <StatCard label="Pending this month" value={inr(Math.max(0, monthlyBill - paidThisMonth))} tone="gold" />
      </div>

      <Panel title="Staff salaries" className="mb-7">
        {teachers.length === 0 ? (
          <EmptyState message="No teaching staff yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-navy-400 border-b border-navy-100">
                  <th className="px-5 py-3 font-semibold">Teacher</th>
                  <th className="px-5 py-3 font-semibold">Monthly salary</th>
                  <th className="px-5 py-3 font-semibold">{monthLabel(month)}</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {teachers.map((t) => {
                  const paid = t.salaryPayments.find((p) => p.forMonth === month);
                  return (
                    <tr key={t.id} className="hover:bg-ivory/40">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-navy-700">{t.user.name}</p>
                        <p className="text-xs text-navy-400">{t.subject ?? "—"}</p>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-navy-700">
                        {t.monthlySalary > 0 ? inr(t.monthlySalary) : <span className="text-navy-300">Not set</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {paid ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <CheckCircle2 size={14} /> Paid · {inr(paid.amount)}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-amber-600">Pending</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-4">
                          <SetSalaryButton teacherId={t.id} teacherName={t.user.name} current={t.monthlySalary} />
                          {!paid && (
                            <PaySalaryButton
                              teacherId={t.id}
                              teacherName={t.user.name}
                              salary={t.monthlySalary}
                              defaultMonth={month}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Recent salary payments">
        <PaymentHistory
          rows={teachers
            .flatMap((t) => t.salaryPayments.map((p) => ({ ...p, teacherName: t.user.name })))
            .sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime())
            .slice(0, 20)}
          canDelete
        />
      </Panel>
    </>
  );
}

async function TeacherView({ userId }: { userId: string }) {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    include: { user: true, salaryPayments: { orderBy: { paidAt: "desc" } } },
  });
  if (!teacher) return <EmptyState message="Teacher profile not found." />;

  const totalPaid = teacher.salaryPayments.reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <PageTitle title="My Salary" subtitle="Your monthly salary and payment slips." />
      <div className="grid gap-5 sm:grid-cols-2 mb-7">
        <StatCard label="Monthly salary" value={teacher.monthlySalary > 0 ? inr(teacher.monthlySalary) : "—"} tone="gold" />
        <StatCard label="Total received" value={inr(totalPaid)} tone="green" hint={`${teacher.salaryPayments.length} payments`} />
      </div>
      <Panel title="Salary slips">
        <PaymentHistory rows={teacher.salaryPayments.map((p) => ({ ...p, teacherName: teacher.user.name }))} />
      </Panel>
    </>
  );
}

type Row = {
  id: string;
  amount: number;
  forMonth: string;
  mode: string;
  note: string | null;
  paidAt: Date;
  teacherName: string;
};

function PaymentHistory({ rows, canDelete }: { rows: Row[]; canDelete?: boolean }) {
  if (rows.length === 0) {
    return <EmptyState message="No salary payments recorded yet." />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-navy-400 border-b border-navy-100">
            <th className="px-5 py-3 font-semibold">Month</th>
            {canDelete && <th className="px-5 py-3 font-semibold">Teacher</th>}
            <th className="px-5 py-3 font-semibold">Amount</th>
            <th className="px-5 py-3 font-semibold">Mode</th>
            <th className="px-5 py-3 font-semibold">Paid on</th>
            {canDelete && <th className="px-5 py-3 font-semibold text-right">Action</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-100">
          {rows.map((p) => (
            <tr key={p.id} className="hover:bg-ivory/40">
              <td className="px-5 py-3.5 font-medium text-navy-700">{monthLabel(p.forMonth)}</td>
              {canDelete && <td className="px-5 py-3.5 text-navy-600">{p.teacherName}</td>}
              <td className="px-5 py-3.5 font-medium text-navy-700">{inr(p.amount)}</td>
              <td className="px-5 py-3.5 text-navy-500">
                {p.mode}
                {p.note ? <span className="block text-xs text-navy-400">{p.note}</span> : null}
              </td>
              <td className="px-5 py-3.5 text-navy-500 whitespace-nowrap">
                {p.paidAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </td>
              {canDelete && (
                <td className="px-5 py-3.5 text-right">
                  <DeleteSalaryButton id={p.id} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
