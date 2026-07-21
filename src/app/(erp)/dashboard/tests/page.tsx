import { CalendarClock, BookMarked } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { prisma, safeQuery } from "@/lib/prisma";
import { manageableBatches, studentByUser, studentBatchIds, childrenByParentUser } from "@/lib/dal";
import { PageTitle, Panel, EmptyState } from "@/components/erp/ui";
import { ScheduleTestButton } from "./ScheduleTestButton";
import { DeleteTestButton } from "./DeleteTestButton";

export const metadata = { title: "Test Schedule" };

type TestRow = {
  id: string;
  title: string;
  subject: string;
  maxMarks: number;
  date: Date;
  syllabus: string | null;
  batch: { name: string };
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysUntil(date: Date) {
  const ms = new Date(date).getTime() - startOfToday().getTime();
  const days = Math.round(ms / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

async function upcomingForBatches(batchIds: string[]): Promise<TestRow[]> {
  if (batchIds.length === 0) return [];
  return safeQuery(
    () =>
      prisma.exam.findMany({
        where: { batchId: { in: batchIds }, date: { gte: startOfToday() } },
        include: { batch: { select: { name: true } } },
        orderBy: { date: "asc" },
      }),
    []
  );
}

export default async function TestsPage() {
  const user = await requireUser();
  if (user.role === "ADMIN" || user.role === "TEACHER") return <ManageView role={user.role} userId={user.id} />;
  if (user.role === "STUDENT") return <StudentView userId={user.id} />;
  if (user.role === "PARENT") return <ParentView userId={user.id} />;
  return <EmptyState message="Test schedule is not available for this role." />;
}

async function ManageView({ role, userId }: { role: string; userId: string }) {
  const batches = await safeQuery(() => manageableBatches(userId, role), []);
  const list = await upcomingForBatches(batches.map((b) => b.id));
  return (
    <>
      <PageTitle
        title="Test Schedule"
        subtitle="Schedule upcoming tests for your batches — students are notified automatically."
        action={<ScheduleTestButton batches={batches} />}
      />
      {batches.length === 0 && (
        <Panel className="mb-5">
          <EmptyState message="You have no batches assigned yet." />
        </Panel>
      )}
      <TestList list={list} canManage />
    </>
  );
}

async function StudentView({ userId }: { userId: string }) {
  const student = await safeQuery(() => studentByUser(userId), null);
  if (!student) return <EmptyState message="Student profile not found." />;
  const bIds = await safeQuery(() => studentBatchIds(student.id), []);
  const list = await upcomingForBatches(bIds);
  return (
    <>
      <PageTitle title="Test Schedule" subtitle="Upcoming tests for your batches." />
      <TestList list={list} />
    </>
  );
}

async function ParentView({ userId }: { userId: string }) {
  const children = await safeQuery(() => childrenByParentUser(userId), []);
  if (children.length === 0) return <EmptyState message="No linked children found." />;
  const batchIds = (await Promise.all(children.map((c) => safeQuery(() => studentBatchIds(c.id), [])))).flat();
  const list = await upcomingForBatches([...new Set(batchIds)]);
  return (
    <>
      <PageTitle title="Test Schedule" subtitle="Upcoming tests for your children's batches." />
      <TestList list={list} />
    </>
  );
}

function TestList({ list, canManage }: { list: TestRow[]; canManage?: boolean }) {
  if (list.length === 0) {
    return (
      <Panel>
        <EmptyState message="No upcoming tests scheduled." />
      </Panel>
    );
  }
  return (
    <div className="space-y-4">
      {list.map((t) => {
        const near = new Date(t.date).getTime() - startOfToday().getTime() <= 3 * 86_400_000;
        return (
          <Panel key={t.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 flex-col place-items-center rounded-xl bg-navy-700 text-ivory leading-none">
                  <span className="text-sm font-bold mt-1.5">{new Date(t.date).getDate()}</span>
                  <span className="text-[10px] uppercase">
                    {new Date(t.date).toLocaleDateString("en-IN", { month: "short" })}
                  </span>
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-navy-700">{t.title}</h3>
                    <span className="rounded-full bg-navy-700/5 px-2.5 py-0.5 text-xs font-medium text-navy-600">
                      {t.subject}
                    </span>
                    <span className="text-xs text-navy-400">· {t.batch?.name ?? "Batch"}</span>
                  </div>
                  {t.syllabus && (
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-navy-600">
                      <BookMarked size={14} className="mt-0.5 shrink-0 text-gold-600" />
                      <span className="whitespace-pre-line">{t.syllabus}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold ${
                    near ? "text-red-600" : "text-gold-700"
                  }`}
                >
                  <CalendarClock size={13} /> {daysUntil(t.date)}
                </span>
                <p className="mt-1 text-[11px] text-navy-400">Max {t.maxMarks} marks</p>
                {canManage && (
                  <div className="mt-2">
                    <DeleteTestButton id={t.id} />
                  </div>
                )}
              </div>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
