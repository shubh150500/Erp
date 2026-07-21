import { requireUser } from "@/lib/rbac";
import { notificationsFor } from "@/lib/dal";
import { DashboardShell } from "@/components/erp/DashboardShell";

export default async function ErpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  
  let unread = 0;
  let notifications: any[] = [];

  try {
    const res = await notificationsFor(user.id).catch(() => ({ unread: 0, items: [] }));
    unread = res.unread;
    notifications = (res.items || []).map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      href: n.href,
      read: n.read,
      createdAt: n.createdAt ? n.createdAt.toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.error("Notifications fetch failed:", err);
  }

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
