import { requireUser } from "@/lib/rbac";
import { notificationsFor } from "@/lib/dal";
import { DashboardShell } from "@/components/erp/DashboardShell";

export default async function ErpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const { unread, items } = await notificationsFor(user.id);

  const notifications = items.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    href: n.href,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <DashboardShell
      role={user.role}
      name={user.name ?? "User"}
      notifications={notifications}
      unread={unread}
    >
      {children}
    </DashboardShell>
  );
}
