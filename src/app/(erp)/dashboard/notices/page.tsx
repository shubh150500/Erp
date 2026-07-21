import { Megaphone } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { prisma, safeQuery } from "@/lib/prisma";
import { PageTitle, Panel, EmptyState } from "@/components/erp/ui";
import { NewNoticeButton } from "./NewNoticeButton";

export const metadata = { title: "Notices" };

const audienceForRole: Record<string, string[]> = {
  STUDENT: ["ALL", "STUDENTS"],
  PARENT: ["ALL", "PARENTS"],
  TEACHER: ["ALL", "TEACHERS"],
  ADMIN: ["ALL", "STUDENTS", "PARENTS", "TEACHERS"],
};

export default async function NoticesPage() {
  const user = await requireUser();
  const canPost = user.role === "ADMIN" || user.role === "TEACHER";

  const notices = await safeQuery(
    () =>
      prisma.notice.findMany({
        where: { audience: { in: audienceForRole[user.role] } },
        include: { author: true },
        orderBy: { createdAt: "desc" },
      }),
    []
  );

  return (
    <>
      <PageTitle
        title="Notices"
        subtitle="Announcements and updates from Triple Entente."
        action={canPost ? <NewNoticeButton /> : undefined}
      />
      {notices.length === 0 ? (
        <Panel>
          <EmptyState message="No notices yet." />
        </Panel>
      ) : (
        <div className="space-y-4">
          {notices.map((n) => (
            <Panel key={n.id} className="p-5">
              <div className="flex items-start gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy-700 text-gold-400">
                  <Megaphone size={18} />
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-navy-700">{n.title}</h3>
                    <span className="text-xs text-navy-400 whitespace-nowrap">
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-navy-600 leading-relaxed whitespace-pre-line">
                    {n.body}
                  </p>
                  <p className="mt-3 text-xs text-navy-400">
                    {n.author?.name ?? "Office"} · for {n.audience.toLowerCase()}
                  </p>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
