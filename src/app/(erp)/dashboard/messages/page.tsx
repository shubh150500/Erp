import { Send, Users, UsersRound } from "lucide-react";
import { requireRole } from "@/lib/rbac";
import { prisma, safeQuery } from "@/lib/prisma";
import { manageableBatches } from "@/lib/dal";
import { PageTitle, Panel, EmptyState, StatCard } from "@/components/erp/ui";
import { SendBroadcastButton } from "./SendBroadcastButton";
import { DeleteBroadcastButton } from "./DeleteBroadcastButton";

export const metadata = { title: "Bulk Messaging" };

const audienceLabel: Record<string, string> = {
  STUDENTS: "Students",
  PARENTS: "Parents",
  BOTH: "Students & Parents",
};

export default async function MessagesPage() {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  const batches = await manageableBatches(user.id, user.role);

  const isAdmin = user.role === "ADMIN";
  const messages = await safeQuery(
    () =>
      prisma.broadcastMessage.findMany({
        where: isAdmin ? {} : { sentById: user.id },
        orderBy: { createdAt: "desc" },
      }),
    []
  );

  let senderName: (id: string) => string = () => "";
  if (isAdmin && messages.length > 0) {
    const senders = await safeQuery(
      () =>
        prisma.user.findMany({
          where: { id: { in: [...new Set(messages.map((m) => m.sentById))] } },
          select: { id: true, name: true },
        }),
      []
    );
    const map = new Map(senders.map((s) => [s.id, s.name]));
    senderName = (id) => map.get(id) ?? "Unknown";
  }

  const totalReach = messages.reduce((s, m) => s + m.recipientCount, 0);

  return (
    <>
      <PageTitle
        title="Bulk Messaging"
        subtitle="Send an announcement to a batch (or all your batches) as an in-app notification."
        action={<SendBroadcastButton batches={batches} />}
      />

      {batches.length === 0 && (
        <Panel className="mb-5">
          <EmptyState message="You have no batches assigned yet." />
        </Panel>
      )}

      <div className="grid gap-5 sm:grid-cols-3 mb-7">
        <StatCard label="Messages sent" value={messages.length} />
        <StatCard label="Total reach" value={totalReach} tone="gold" hint="recipient notifications" />
        <StatCard label="Your batches" value={batches.length} tone="green" />
      </div>

      {messages.length === 0 ? (
        <Panel>
          <EmptyState message="No messages sent yet." />
        </Panel>
      ) : (
        <div className="space-y-4">
          {messages.map((m) => (
            <Panel key={m.id} className="p-5">
              <div className="flex items-start gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy-700 text-gold-400">
                  <Send size={17} />
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-navy-700">{m.title}</h3>
                    <span className="text-xs text-navy-400 whitespace-nowrap">
                      {m.createdAt ? new Date(m.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-line text-sm text-navy-600 leading-relaxed">{m.body}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-navy-400">
                    <span className="inline-flex items-center gap-1">
                      {m.audience === "PARENTS" ? <UsersRound size={13} /> : <Users size={13} />}
                      {audienceLabel[m.audience] ?? m.audience}
                    </span>
                    <span>· {m.batchName ?? "All batches"}</span>
                    <span>· {m.recipientCount} reached</span>
                    {isAdmin && <span>· by {senderName(m.sentById)}</span>}
                  </div>
                </div>
                <DeleteBroadcastButton id={m.id} />
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
