import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import {
  attendancePct,
  feeSummary,
  studentByUser,
  childrenByParentUser,
} from "@/lib/dal";
import { PageTitle, StatCard, Panel, EmptyState, StatusPill } from "@/components/erp/ui";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <>
      <PageTitle
        title={greeting(user.name ?? "there")}
        subtitle="Here's what's happening at Triple Entente today."
      />
      {user.role === "ADMIN" && <AdminOverview />}
      {user.role === "TEACHER" && <TeacherOverview userId={user.id} />}
      {user.role === "STUDENT" && <StudentOverview userId={user.id} />}
      {user.role === "PARENT" && <ParentOverview userId={user.id} />}
    </>
  );
}

function greeting(name: string) {
  return `Welcome, ${name.split(" ")[0]}`;
}

async function AdminOverview() {
  const [students, teachers, batches, newInquiries, feeAgg, billedBatches, recent] =
    await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.batch.count(),
      prisma.inquiry.count({ where: { status: "NEW" } }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.enrollment.findMany({ include: { batch: true } }),
      prisma.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

  const billed = billedBatches.reduce((s, e) => s + e.batch.feeAmount, 0);
  const collected = feeAgg._sum.amount ?? 0;
  const due = Math.max(0, billed - collected);

  return (
    <div className="space-y-7">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students" value={students} />
        <StatCard label="Teachers" value={teachers} />
        <StatCard label="Batches" value={batches} />
        <StatCard label="New enquiries" value={newInquiries} tone="gold" hint="Awaiting follow-up" />
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard label="Fees billed" value={inr(billed)} />
        <StatCard label="Fees collected" value={inr(collected)} tone="green" />
        <StatCard label="Fees due" value={inr(due)} tone="red" />
      </div>

      <Panel
        title="Recent admission enquiries"
        action={
          <Link href="/dashboard/admissions" className="text-sm font-semibold text-gold-600 inline-flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        }
      >
        {recent.length === 0 ? (
          <EmptyState message="No enquiries yet. They'll appear here when submitted from the website." />
        ) : (
          <ul className="divide-y divide-navy-100">
            {recent.map((q) => (
              <li key={q.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="font-medium text-navy-700">{q.name}</p>
                  <p className="text-xs text-navy-500">
                    {q.className} · {q.phone}
                  </p>
                </div>
                <StatusPill status={q.status} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

async function TeacherOverview({ userId }: { userId: string }) {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    include: {
      batches: {
        include: { _count: { select: { enrollments: true } }, course: true },
      },
    },
  });

  const batches = teacher?.batches ?? [];
  const totalStudents = batches.reduce((s, b) => s + b._count.enrollments, 0);

  return (
    <div className="space-y-7">
      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard label="My batches" value={batches.length} />
        <StatCard label="My students" value={totalStudents} />
        <StatCard label="Subject" value={teacher?.subject ?? "—"} tone="gold" />
      </div>

      <Panel title="My batches">
        {batches.length === 0 ? (
          <EmptyState message="No batches assigned yet." />
        ) : (
          <ul className="divide-y divide-navy-100">
            {batches.map((b) => (
              <li key={b.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="font-medium text-navy-700">{b.name}</p>
                  <p className="text-xs text-navy-500">{b.course.name} · {b.year}</p>
                </div>
                <span className="text-sm text-navy-500">{b._count.enrollments} students</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="flex flex-wrap gap-3">
        <QuickLink href="/dashboard/attendance" label="Mark attendance" />
        <QuickLink href="/dashboard/exams" label="Enter exam marks" />
      </div>
    </div>
  );
}

async function StudentOverview({ userId }: { userId: string }) {
  const student = await studentByUser(userId);
  if (!student) return <EmptyState message="Student profile not found." />;

  const [pct, fees] = await Promise.all([
    attendancePct(student.id),
    feeSummary(student.id),
  ]);

  return (
    <div className="space-y-7">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Roll no" value={student.rollNo} />
        <StatCard label="Class" value={student.className} />
        <StatCard label="Attendance" value={pct === null ? "—" : `${pct}%`} tone={pct !== null && pct < 75 ? "red" : "green"} />
        <StatCard label="Fees due" value={inr(fees.due)} tone={fees.due > 0 ? "red" : "green"} />
      </div>

      <Panel title="My batches">
        {student.enrollments.length === 0 ? (
          <EmptyState message="Not enrolled in any batch yet." />
        ) : (
          <ul className="divide-y divide-navy-100">
            {student.enrollments.map((e) => (
              <li key={e.id} className="px-5 py-3.5">
                <p className="font-medium text-navy-700">{e.batch.name}</p>
                <p className="text-xs text-navy-500">{e.batch.year}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="flex flex-wrap gap-3">
        <QuickLink href="/dashboard/attendance" label="View attendance" />
        <QuickLink href="/dashboard/exams" label="View results" />
        <QuickLink href="/dashboard/fees" label="View fees" />
      </div>
    </div>
  );
}

async function ParentOverview({ userId }: { userId: string }) {
  const children = await childrenByParentUser(userId);

  const cards = await Promise.all(
    children.map(async (c) => ({
      child: c,
      pct: await attendancePct(c.id),
      fees: await feeSummary(c.id),
    }))
  );

  return (
    <div className="space-y-7">
      {cards.length === 0 ? (
        <EmptyState message="No linked children found." />
      ) : (
        cards.map(({ child, pct, fees }) => (
          <Panel key={child.id} title={`${child.user.name} · ${child.className}`}>
            <div className="grid gap-5 sm:grid-cols-3 p-5">
              <StatCard label="Roll no" value={child.rollNo} />
              <StatCard label="Attendance" value={pct === null ? "—" : `${pct}%`} tone={pct !== null && pct < 75 ? "red" : "green"} />
              <StatCard label="Fees due" value={inr(fees.due)} tone={fees.due > 0 ? "red" : "green"} />
            </div>
          </Panel>
        ))
      )}
      <div className="flex flex-wrap gap-3">
        <QuickLink href="/dashboard/attendance" label="View attendance" />
        <QuickLink href="/dashboard/exams" label="View results" />
        <QuickLink href="/dashboard/fees" label="View fees" />
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full bg-navy-700 text-ivory px-5 py-2.5 text-sm font-semibold hover:bg-navy-600 transition-colors"
    >
      {label} <ArrowRight size={15} />
    </Link>
  );
}

function inr(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}
