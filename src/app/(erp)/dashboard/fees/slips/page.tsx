import Link from "next/link";
import { FileText, Paperclip } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { prisma, safeQuery } from "@/lib/prisma";
import {
  feeSummary,
  studentByUser,
  childrenByParentUser,
  slipsForStudents,
  allSlips,
  type SlipFilters,
} from "@/lib/dal";
import { PageTitle, Panel, EmptyState, StatusPill, StatCard } from "@/components/erp/ui";
import { GenerateSlipButton } from "./GenerateSlipButton";
import { VerifyButton } from "./VerifyButton";

export const metadata = { title: "Fee Slips" };

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export default async function SlipsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; className?: string; batchId?: string; date?: string }>;
}) {
  const user = await requireUser();
  if (user.role === "ADMIN") return <AdminSlips searchParams={searchParams} />;
  if (user.role === "STUDENT") return <StudentSlips userId={user.id} />;
  if (user.role === "PARENT") return <ParentSlips userId={user.id} />;
  return <EmptyState message="Fee slips are not available for this role." />;
}

function SlipRow({
  slip,
  showStudent,
  showVerify,
}: {
  slip: any;
  showStudent?: boolean;
  showVerify?: boolean;
}) {
  return (
    <tr className="hover:bg-ivory/40">
      <td className="px-5 py-3.5 font-mono text-xs text-navy-600">{slip.slipNo}</td>
      {showStudent && (
        <td className="px-5 py-3.5 font-medium text-navy-700">{slip.student?.user?.name ?? "Student"}</td>
      )}
      <td className="px-5 py-3.5 font-medium text-navy-700">{inr(slip.amount)}</td>
      <td className="px-5 py-3.5 text-navy-500">{slip.mode}{slip.forMonth ? ` · ${slip.forMonth}` : ""}</td>
      <td className="px-5 py-3.5 text-navy-500 whitespace-nowrap">
        {slip.createdAt ? new Date(slip.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <StatusPill status={slip.status} />
          {slip.proofImage && slip.status === "PENDING" && (
            <span
              title="Payment screenshot uploaded"
              className="inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2 py-0.5 text-[11px] font-semibold text-gold-700"
            >
              <Paperclip size={11} /> Proof
            </span>
          )}
        </div>
      </td>
      <td className="px-5 py-3.5 text-right whitespace-nowrap">
        <div className="inline-flex items-center gap-4">
          {showVerify && slip.status === "PENDING" && (
            <VerifyButton
              slipId={slip.id}
              slipNo={slip.slipNo}
              studentName={slip.student?.user?.name ?? "Student"}
              amount={slip.amount}
              proofImage={slip.proofImage}
              txnRef={slip.txnRef}
            />
          )}
          <Link
            href={`/dashboard/fees/slips/${slip.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:text-gold-600"
          >
            <FileText size={15} /> {slip.status === "PAID" ? "Receipt" : "Slip"}
          </Link>
        </div>
      </td>
    </tr>
  );
}

async function StudentSlips({ userId }: { userId: string }) {
  const student = await safeQuery(() => studentByUser(userId), null);
  if (!student) return <EmptyState message="Student profile not found." />;
  
  const fees = await safeQuery(() => feeSummary(student.id), { billed: 0, paid: 0, due: 0 });
  const slips = await safeQuery(() => slipsForStudents([student.id]), []);

  const opts = [{ id: student.id, label: student.user?.name ?? "Student", due: fees.due }];

  return (
    <>
      <PageTitle
        title="Fee Slips"
        subtitle="Generate a deposit slip, print it, and download your receipt after verification."
        action={<GenerateSlipButton students={opts} />}
      />
      <div className="grid gap-5 sm:grid-cols-3 mb-7">
        <StatCard label="Total billed" value={inr(fees.billed)} />
        <StatCard label="Paid" value={inr(fees.paid)} tone="green" />
        <StatCard label="Due" value={inr(fees.due)} tone={fees.due > 0 ? "red" : "green"} />
      </div>
      <SlipTable slips={slips} />
    </>
  );
}

async function ParentSlips({ userId }: { userId: string }) {
  const children = await safeQuery(() => childrenByParentUser(userId), []);
  if (children.length === 0) return <EmptyState message="No linked children found." />;

  const opts = await Promise.all(
    children.map(async (c) => ({
      id: c.id,
      label: `${c.user?.name ?? "Student"} (${c.rollNo})`,
      due: (await safeQuery(() => feeSummary(c.id), { billed: 0, paid: 0, due: 0 })).due,
    }))
  );
  const slips = await safeQuery(() => slipsForStudents(children.map((c) => c.id)), []);

  return (
    <>
      <PageTitle
        title="Fee Slips"
        subtitle="Generate deposit slips for your children and download official receipts."
        action={<GenerateSlipButton students={opts} />}
      />
      <SlipTable slips={slips} showStudent />
    </>
  );
}

async function AdminSlips({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; className?: string; batchId?: string; date?: string }>;
}) {
  const sp = await searchParams;
  const filters: SlipFilters = {
    status: (["PENDING", "PAID", "REJECTED"].includes(sp.status ?? "")
      ? sp.status
      : undefined) as SlipFilters["status"],
    className: sp.className || undefined,
    batchId: sp.batchId || undefined,
    date: sp.date || undefined,
  };

  const slips = await safeQuery(() => allSlips(filters), []);
  const batches = await safeQuery(() => prisma.batch.findMany({ select: { id: true, name: true } }), []);

  const pending = slips.filter((s) => s.status === "PENDING").length;
  const paidTotal = slips
    .filter((s) => s.status === "PAID")
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <>
      <PageTitle
        title="Fee Slips"
        subtitle="Review, verify and generate official receipts for deposit slips."
      />
      <div className="grid gap-5 sm:grid-cols-3 mb-7">
        <StatCard label="Total slips" value={slips.length} />
        <StatCard label="Pending review" value={pending} tone="gold" />
        <StatCard label="Verified amount" value={inr(paidTotal)} tone="green" />
      </div>

      <Panel className="mb-6">
        <form className="flex flex-wrap items-end gap-3 p-4">
          <Filter name="status" label="Status" value={sp.status} options={["", "PENDING", "PAID", "REJECTED"]} />
          <Filter
            name="className"
            label="Class"
            value={sp.className}
            options={["", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"]}
          />
          <label className="block">
            <span className="block text-xs font-semibold uppercase tracking-wider text-navy-400 mb-1.5">Batch</span>
            <select name="batchId" defaultValue={sp.batchId ?? ""} className="rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm">
              <option value="">All</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-semibold uppercase tracking-wider text-navy-400 mb-1.5">Date</span>
            <input type="date" name="date" defaultValue={sp.date ?? ""} className="rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm" />
          </label>
          <button className="rounded-full bg-navy-700 text-ivory px-5 py-2 text-sm font-semibold hover:bg-navy-600">
            Apply
          </button>
          <Link href="/dashboard/fees/slips" className="rounded-full px-4 py-2 text-sm font-semibold text-navy-500 hover:text-navy-700">
            Reset
          </Link>
        </form>
      </Panel>

      <SlipTable slips={slips} showStudent showVerify />
    </>
  );
}

function Filter({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value?: string;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wider text-navy-400 mb-1.5">{label}</span>
      <select name={name} defaultValue={value ?? ""} className="rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm">
        {options.map((o) => (
          <option key={o} value={o}>{o === "" ? "All" : o}</option>
        ))}
      </select>
    </label>
  );
}

function SlipTable({
  slips,
  showStudent,
  showVerify,
}: {
  slips: any[];
  showStudent?: boolean;
  showVerify?: boolean;
}) {
  return (
    <Panel>
      {slips.length === 0 ? (
        <EmptyState message="No fee slips yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-navy-400 border-b border-navy-100">
                <th className="px-5 py-3 font-semibold">Slip No</th>
                {showStudent && <th className="px-5 py-3 font-semibold">Student</th>}
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Mode</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {slips.map((s) => (
                <SlipRow key={s.id} slip={s} showStudent={showStudent} showVerify={showVerify} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
