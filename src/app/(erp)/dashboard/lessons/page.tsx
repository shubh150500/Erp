import { CalendarClock, BookText } from "lucide-react";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { manageableBatches } from "@/lib/dal";
import { PageTitle, Panel, EmptyState, StatCard } from "@/components/erp/ui";
import { CreateLessonButton } from "./CreateLessonButton";
import { CompleteLessonButton } from "./CompleteLessonButton";
import { DeleteLessonButton } from "./DeleteLessonButton";

export const metadata = { title: "Lesson Planning & Teaching Log" };

type Lesson = {
  id: string;
  batchId: string;
  topic: string;
  subject: string | null;
  objective: string | null;
  plannedDate: Date | null;
  status: string;
  logNote: string | null;
  completedAt: Date | null;
};

export default async function LessonsPage() {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  const batches = await manageableBatches(user.id, user.role);
  const batchIds = batches.map((b) => b.id);

  const lessons: Lesson[] =
    batchIds.length === 0
      ? []
      : await prisma.lessonPlan.findMany({
          where: { batchId: { in: batchIds } },
          orderBy: [{ status: "asc" }, { plannedDate: "asc" }, { createdAt: "asc" }],
        });

  const done = lessons.filter((l) => l.status === "DONE").length;
  const total = lessons.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const byBatch = new Map<string, Lesson[]>();
  for (const l of lessons) {
    const arr = byBatch.get(l.batchId) ?? [];
    arr.push(l);
    byBatch.set(l.batchId, arr);
  }

  return (
    <>
      <PageTitle
        title="Lesson Planning & Teaching Log"
        subtitle="Plan topics per batch, mark them taught, and track syllabus completion."
        action={<CreateLessonButton batches={batches} />}
      />

      {batches.length === 0 ? (
        <Panel>
          <EmptyState message="You have no batches assigned yet." />
        </Panel>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-3 mb-7">
            <StatCard label="Planned topics" value={total} />
            <StatCard label="Taught" value={done} tone="green" />
            <StatCard label="Syllabus completion" value={`${pct}%`} tone={pct >= 100 ? "green" : "gold"} />
          </div>

          {total === 0 ? (
            <Panel>
              <EmptyState message="No lessons planned yet. Add your first topic." />
            </Panel>
          ) : (
            <div className="space-y-7">
              {batches
                .filter((b) => byBatch.has(b.id))
                .map((b) => {
                  const rows = byBatch.get(b.id)!;
                  const bDone = rows.filter((l) => l.status === "DONE").length;
                  const bPct = Math.round((bDone / rows.length) * 100);
                  return (
                    <Panel key={b.id} title={`${b.name} · ${bDone}/${rows.length} taught (${bPct}%)`}>
                      <div className="px-5 pt-4">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-navy-100">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${bPct}%` }}
                          />
                        </div>
                      </div>
                      <ul className="divide-y divide-navy-100 p-2">
                        {rows.map((l) => {
                          const isDone = l.status === "DONE";
                          return (
                            <li key={l.id} className="flex flex-wrap items-start justify-between gap-3 px-3 py-3.5">
                              <div className="flex items-start gap-3">
                                <span
                                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                                    isDone ? "bg-emerald-100 text-emerald-600" : "bg-navy-100 text-navy-500"
                                  }`}
                                >
                                  <BookText size={16} />
                                </span>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`font-semibold ${
                                        isDone ? "text-navy-400 line-through" : "text-navy-700"
                                      }`}
                                    >
                                      {l.topic}
                                    </span>
                                    {l.subject && (
                                      <span className="rounded-full bg-navy-700/5 px-2.5 py-0.5 text-xs font-medium text-navy-600">
                                        {l.subject}
                                      </span>
                                    )}
                                  </div>
                                  {l.objective && <p className="mt-0.5 text-sm text-navy-500">{l.objective}</p>}
                                  {l.plannedDate && (
                                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-gold-700">
                                      <CalendarClock size={12} />
                                      {l.plannedDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                    </span>
                                  )}
                                  {isDone && l.logNote && (
                                    <p className="mt-1.5 rounded-lg bg-emerald-50/70 border border-emerald-100 px-2.5 py-1.5 text-xs text-navy-600">
                                      <span className="font-semibold text-emerald-600">Log:</span> {l.logNote}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4 shrink-0">
                                <CompleteLessonButton id={l.id} done={isDone} />
                                <DeleteLessonButton id={l.id} />
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </Panel>
                  );
                })}
            </div>
          )}
        </>
      )}
    </>
  );
}
