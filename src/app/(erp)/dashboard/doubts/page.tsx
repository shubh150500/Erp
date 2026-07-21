import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { studentByUser, childrenByParentUser } from "@/lib/dal";
import { PageTitle, Panel, EmptyState, StatCard } from "@/components/erp/ui";
import { AskDoubtButton } from "./AskDoubtButton";
import { AnswerDoubtForm } from "./AnswerDoubtForm";

export const metadata = { title: "Doubts" };

type DoubtRow = {
  id: string;
  subject: string | null;
  question: string;
  image: string | null;
  answer: string | null;
  answeredAt: Date | null;
  createdAt: Date;
  student: { user: { name: string } };
  batch: { name: string } | null;
};

export default async function DoubtsPage() {
  const user = await requireUser();
  if (user.role === "STUDENT") return <StudentView userId={user.id} />;
  if (user.role === "ADMIN" || user.role === "TEACHER")
    return <TeacherView role={user.role} userId={user.id} />;
  if (user.role === "PARENT") return <ParentView userId={user.id} />;
  return <EmptyState message="Doubts are not available for this role." />;
}

const include = {
  student: { include: { user: true } },
  batch: { select: { name: true } },
} as const;

async function StudentView({ userId }: { userId: string }) {
  const student = await studentByUser(userId);
  if (!student) return <EmptyState message="Student profile not found." />;
  const [doubts, batches] = await Promise.all([
    prisma.doubt.findMany({
      where: { studentId: student.id },
      include,
      orderBy: { createdAt: "desc" },
    }),
    Promise.resolve(student.enrollments.map((e) => ({ id: e.batch.id, name: e.batch.name }))),
  ]);

  return (
    <>
      <PageTitle
        title="My Doubts"
        subtitle="Ask your teachers anything — they'll reply here."
        action={<AskDoubtButton batches={batches} />}
      />
      <DoubtList doubts={doubts} />
    </>
  );
}

async function TeacherView({ role, userId }: { role: string; userId: string }) {
  const where =
    role === "ADMIN"
      ? {}
      : { OR: [{ batch: { teacher: { userId } } }, { batchId: null }] };

  const doubts = await prisma.doubt.findMany({
    where,
    include,
    orderBy: [{ answeredAt: "asc" }, { createdAt: "desc" }],
  });
  const pending = doubts.filter((d) => !d.answer).length;

  return (
    <>
      <PageTitle title="Student Doubts" subtitle="Answer doubts raised by your students." />
      <div className="grid gap-5 sm:grid-cols-3 mb-7">
        <StatCard label="Total" value={doubts.length} />
        <StatCard label="Awaiting answer" value={pending} tone={pending > 0 ? "gold" : "green"} />
        <StatCard label="Answered" value={doubts.length - pending} tone="green" />
      </div>
      <DoubtList doubts={doubts} canAnswer showStudent />
    </>
  );
}

async function ParentView({ userId }: { userId: string }) {
  const children = await childrenByParentUser(userId);
  if (children.length === 0) return <EmptyState message="No linked children found." />;
  const doubts = await prisma.doubt.findMany({
    where: { studentId: { in: children.map((c) => c.id) } },
    include,
    orderBy: { createdAt: "desc" },
  });
  return (
    <>
      <PageTitle title="Doubts" subtitle="Doubts raised by your children and their answers." />
      <DoubtList doubts={doubts} showStudent />
    </>
  );
}

function DoubtList({
  doubts,
  canAnswer,
  showStudent,
}: {
  doubts: DoubtRow[];
  canAnswer?: boolean;
  showStudent?: boolean;
}) {
  if (doubts.length === 0) {
    return (
      <Panel>
        <EmptyState message="No doubts yet." />
      </Panel>
    );
  }
  return (
    <div className="space-y-4">
      {doubts.map((d) => (
        <Panel key={d.id} className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            {d.subject && (
              <span className="rounded-full bg-navy-700/5 px-2.5 py-0.5 text-xs font-medium text-navy-600">
                {d.subject}
              </span>
            )}
            {d.batch && <span className="text-xs text-navy-400">{d.batch.name}</span>}
            {showStudent && (
              <span className="text-xs font-medium text-navy-500">· {d.student.user.name}</span>
            )}
            <span className="ml-auto text-[11px] text-navy-400">
              {d.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
          </div>

          <p className="mt-2 whitespace-pre-line text-sm text-navy-700">{d.question}</p>

          {d.image && (
            <a href={d.image} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={d.image}
                alt="Doubt attachment"
                className="max-h-40 rounded-lg border border-navy-100 hover:opacity-90"
              />
            </a>
          )}

          {d.answer ? (
            <div className="mt-3 rounded-xl bg-emerald-50/70 border border-emerald-100 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                Answer
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-navy-700">{d.answer}</p>
            </div>
          ) : canAnswer ? (
            <AnswerDoubtForm id={d.id} />
          ) : (
            <p className="mt-3 text-xs font-medium text-gold-700">Awaiting answer…</p>
          )}
        </Panel>
      ))}
    </div>
  );
}
