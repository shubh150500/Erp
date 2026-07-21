import { UserCheck } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { prisma, safeQuery } from "@/lib/prisma";
import { studentByUser, childrenByParentUser } from "@/lib/dal";
import { PageTitle, Panel, EmptyState, StatCard, StatusPill } from "@/components/erp/ui";
import { RequestPtmButton } from "./RequestPtmButton";
import { DecidePtmButtons } from "./DecidePtmButtons";

export const metadata = { title: "PTM Booking" };

type Row = {
  id: string;
  slot: Date;
  note: string | null;
  status: string;
  student: { user: { name: string } };
};

const include = { student: { include: { user: true } } } as const;
const fmt = (d: Date) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export default async function PtmPage() {
  const user = await requireUser();

  if (user.role === "PARENT" || user.role === "STUDENT") {
    let opts: { id: string; label: string }[] = [];
    let studentIds: string[] = [];
    if (user.role === "STUDENT") {
      const s = await safeQuery(() => studentByUser(user.id), null);
      if (!s) return <EmptyState message="Student profile not found." />;
      opts = [{ id: s.id, label: s.user?.name ?? "Student" }];
      studentIds = [s.id];
    } else {
      const children = await safeQuery(() => childrenByParentUser(user.id), []);
      opts = children.map((c) => ({ id: c.id, label: `${c.user?.name ?? "Student"} (${c.rollNo})` }));
      studentIds = children.map((c) => c.id);
    }
    const rows = await safeQuery(
      () =>
        prisma.ptmBooking.findMany({
          where: { studentId: { in: studentIds } },
          include,
          orderBy: { slot: "desc" },
        }),
      []
    );
    return (
      <>
        <PageTitle
          title="Parent-Teacher Meetings"
          subtitle="Request a meeting slot and track its confirmation."
          action={<RequestPtmButton students={opts} />}
        />
        <PtmList rows={rows} />
      </>
    );
  }

  const where =
    user.role === "TEACHER"
      ? { student: { enrollments: { some: { batch: { teacher: { userId: user.id } } } } } }
      : {};
  const rows = await safeQuery(
    () =>
      prisma.ptmBooking.findMany({
        where,
        include,
        orderBy: [{ status: "asc" }, { slot: "desc" }],
      }),
    []
  );
  const pending = rows.filter((r) => r.status === "PENDING").length;

  return (
    <>
      <PageTitle title="Parent-Teacher Meetings" subtitle="Confirm or decline meeting requests." />
      <div className="grid gap-5 sm:grid-cols-3 mb-7">
        <StatCard label="Total" value={rows.length} />
        <StatCard label="Pending" value={pending} tone={pending > 0 ? "gold" : "green"} />
        <StatCard label="Decided" value={rows.length - pending} tone="green" />
      </div>
      <PtmList rows={rows} showStudent canDecide />
    </>
  );
}

function PtmList({
  rows,
  showStudent,
  canDecide,
}: {
  rows: Row[];
  showStudent?: boolean;
  canDecide?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <Panel>
        <EmptyState message="No meeting requests yet." />
      </Panel>
    );
  }
  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <Panel key={r.id} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-gold-600">
                <UserCheck size={18} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-navy-700">{fmt(r.slot)}</p>
                  <StatusPill status={r.status} />
                </div>
                {showStudent && <p className="text-xs font-medium text-navy-500">{r.student?.user?.name ?? "Student"}</p>}
                {r.note && <p className="mt-1.5 text-sm text-navy-600">{r.note}</p>}
              </div>
            </div>
            {canDecide && r.status === "PENDING" && <DecidePtmButtons id={r.id} />}
          </div>
        </Panel>
      ))}
    </div>
  );
}
