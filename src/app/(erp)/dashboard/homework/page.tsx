import { Paperclip, CalendarClock } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import {
  manageableBatches,
  studentByUser,
  studentBatchIds,
  childrenByParentUser,
} from "@/lib/dal";
import { PageTitle, Panel, EmptyState } from "@/components/erp/ui";
import { CreateHomeworkButton } from "./CreateHomeworkButton";
import { DeleteHomeworkButton } from "./DeleteHomeworkButton";

export const metadata = { title: "Homework" };

type HwRow = {
  id: string;
  title: string;
  details: string;
  subject: string | null;
  attachment: string | null;
  dueDate: Date | null;
  createdAt: Date;
  batch: { name: string };
};

export default async function HomeworkPage() {
  const user = await requireUser();
  if (user.role === "ADMIN" || user.role === "TEACHER")
    return <ManageView role={user.role} userId={user.id} />;
  if (user.role === "STUDENT") return <StudentView userId={user.id} />;
  if (user.role === "PARENT") return <ParentView userId={user.id} />;
  return <EmptyState message="Homework is not available for this role." />;
}

async function homeworkForBatches(batchIds: string[]): Promise<HwRow[]> {
  if (batchIds.length === 0) return [];
  return prisma.homework.findMany({
    where: { batchId: { in: batchIds } },
    include: { batch: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

async function ManageView({ role, userId }: { role: string; userId: string }) {
  const batches = await manageableBatches(userId, role);
  const list = await homeworkForBatches(batches.map((b) => b.id));

  return (
    <>
      <PageTitle
        title="Homework"
        subtitle="Post homework for your batches with an optional attachment and due date."
        action={<CreateHomeworkButton batches={batches} />}
      />
      {batches.length === 0 && (
        <Panel className="mb-5">
          <EmptyState message="You have no batches assigned yet." />
        </Panel>
      )}
      <HomeworkList list={list} canManage />
    </>
  );
}

async function StudentView({ userId }: { userId: string }) {
  const student = await studentByUser(userId);
  if (!student) return <EmptyState message="Student profile not found." />;
  const list = await homeworkForBatches(await studentBatchIds(student.id));
  return (
    <>
      <PageTitle title="Homework" subtitle="Homework assigned to your batches." />
      <HomeworkList list={list} />
    </>
  );
}

async function ParentView({ userId }: { userId: string }) {
  const children = await childrenByParentUser(userId);
  if (children.length === 0) return <EmptyState message="No linked children found." />;
  const batchIds = (
    await Promise.all(children.map((c) => studentBatchIds(c.id)))
  ).flat();
  const list = await homeworkForBatches([...new Set(batchIds)]);
  return (
    <>
      <PageTitle title="Homework" subtitle="Homework assigned to your children's batches." />
      <HomeworkList list={list} />
    </>
  );
}

function HomeworkList({ list, canManage }: { list: HwRow[]; canManage?: boolean }) {
  if (list.length === 0) {
    return (
      <Panel>
        <EmptyState message="No homework posted yet." />
      </Panel>
    );
  }
  const today = new Date();
  return (
    <div className="space-y-4">
      {list.map((hw) => {
        const overdue = hw.dueDate && hw.dueDate < today;
        return (
          <Panel key={hw.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-navy-700">{hw.title}</h3>
                  {hw.subject && (
                    <span className="rounded-full bg-navy-700/5 px-2.5 py-0.5 text-xs font-medium text-navy-600">
                      {hw.subject}
                    </span>
                  )}
                  <span className="text-xs text-navy-400">· {hw.batch.name}</span>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-navy-600">{hw.details}</p>
              </div>
              <div className="text-right shrink-0">
                {hw.dueDate && (
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold ${
                      overdue ? "text-red-600" : "text-gold-700"
                    }`}
                  >
                    <CalendarClock size={13} />
                    Due {hw.dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                )}
                <p className="mt-1 text-[11px] text-navy-400">
                  {hw.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              {hw.attachment ? (
                <a
                  href={hw.attachment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:text-gold-600"
                >
                  <Paperclip size={14} /> Attachment
                </a>
              ) : (
                <span />
              )}
              {canManage && <DeleteHomeworkButton id={hw.id} />}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
