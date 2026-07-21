import { Flag, Lightbulb } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageTitle, Panel, EmptyState, StatCard } from "@/components/erp/ui";
import { SubmitComplaintButton } from "./SubmitComplaintButton";
import { RespondForm } from "./RespondForm";

export const metadata = { title: "Complaint Box" };

type Row = {
  id: string;
  userId: string;
  category: string;
  subject: string;
  body: string;
  status: string;
  response: string | null;
  createdAt: Date;
};

export default async function ComplaintsPage() {
  const user = await requireUser();
  if (user.role === "STUDENT" || user.role === "PARENT") {
    const rows = await prisma.complaint.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return (
      <>
        <PageTitle
          title="Complaint / Suggestion Box"
          subtitle="Raise a concern or share an idea — the office will respond here."
          action={<SubmitComplaintButton />}
        />
        <ComplaintList rows={rows} />
      </>
    );
  }
  if (user.role === "ADMIN") return <AdminView />;
  return <EmptyState message="Not available for this role." />;
}

async function AdminView() {
  const rows = await prisma.complaint.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }] });
  const names = await prisma.user.findMany({
    where: { id: { in: [...new Set(rows.map((r) => r.userId))] } },
    select: { id: true, name: true, role: true },
  });
  const map = new Map(names.map((u) => [u.id, u]));
  const open = rows.filter((r) => r.status === "OPEN").length;

  return (
    <>
      <PageTitle title="Complaint / Suggestion Box" subtitle="Review and respond to submissions." />
      <div className="grid gap-5 sm:grid-cols-3 mb-7">
        <StatCard label="Total" value={rows.length} />
        <StatCard label="Open" value={open} tone={open > 0 ? "gold" : "green"} />
        <StatCard label="Resolved" value={rows.length - open} tone="green" />
      </div>
      <ComplaintList
        rows={rows}
        canRespond
        author={(id) => {
          const u = map.get(id);
          return u ? `${u.name} (${u.role})` : "Unknown";
        }}
      />
    </>
  );
}

function ComplaintList({
  rows,
  canRespond,
  author,
}: {
  rows: Row[];
  canRespond?: boolean;
  author?: (userId: string) => string;
}) {
  if (rows.length === 0) {
    return (
      <Panel>
        <EmptyState message="Nothing here yet." />
      </Panel>
    );
  }
  return (
    <div className="space-y-4">
      {rows.map((r) => {
        const isSuggestion = r.category === "SUGGESTION";
        return (
          <Panel key={r.id} className="p-5">
            <div className="flex items-start gap-3">
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                  isSuggestion ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"
                }`}
              >
                {isSuggestion ? <Lightbulb size={18} /> : <Flag size={18} />}
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-navy-700">{r.subject}</h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      r.status === "RESOLVED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {r.status}
                  </span>
                  {author && <span className="text-xs text-navy-400">· {author(r.userId)}</span>}
                </div>
                <p className="mt-1.5 whitespace-pre-line text-sm text-navy-600">{r.body}</p>
                <p className="mt-1 text-[11px] text-navy-400">
                  {r.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>

                {r.response ? (
                  <div className="mt-3 rounded-xl bg-emerald-50/70 border border-emerald-100 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Office response</p>
                    <p className="mt-1 whitespace-pre-line text-sm text-navy-700">{r.response}</p>
                  </div>
                ) : canRespond ? (
                  <RespondForm id={r.id} />
                ) : null}
              </div>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
