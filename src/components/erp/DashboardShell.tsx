"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Users,
  Boxes,
  GraduationCap,
  Wallet,
  FileText,
  CalendarCheck,
  ClipboardList,
  Megaphone,
  BookOpen,
  FolderOpen,
  MessageSquare,
  BarChart3,
  NotebookPen,
  History,
  TrendingUp,
  CalendarDays,
  CalendarRange,
  Send,
  PieChart,
  Banknote,
  UserCog,
  UserCheck,
  CalendarClock,
  Flag,
  ScrollText,
  PlaySquare,
  Landmark,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { Logo } from "@/components/Logo";
import { navForRole } from "@/lib/dashboard-nav";
import { roleLabel } from "@/lib/rbac";
import { logoutAction } from "@/app/(erp)/dashboard/logout";
import { NotificationBell, type NotificationItem } from "@/components/erp/NotificationBell";
import { cn } from "@/lib/cn";

const icons = {
  LayoutDashboard,
  Inbox,
  Users,
  Boxes,
  GraduationCap,
  Wallet,
  FileText,
  CalendarCheck,
  ClipboardList,
  Megaphone,
  BookOpen,
  FolderOpen,
  MessageSquare,
  BarChart3,
  NotebookPen,
  History,
  TrendingUp,
  CalendarDays,
  CalendarRange,
  Send,
  PieChart,
  Banknote,
  UserCog,
  UserCheck,
  CalendarClock,
  Flag,
  ScrollText,
  PlaySquare,
  Landmark,
} as const;

export function DashboardShell({
  role,
  name,
  notifications,
  unread,
  children,
}: {
  role: Role;
  name: string;
  notifications: NotificationItem[];
  unread: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const nav = navForRole(role);

  return (
    <div className="min-h-screen bg-ivory lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-navy-700 text-navy-100 flex flex-col transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center px-5 border-b border-white/10">
          <Logo light />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
          {nav.map((item) => {
            const Icon = icons[item.icon as keyof typeof icons];
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-gold-500 text-navy-800"
                    : "text-navy-100/75 hover:bg-white/5 hover:text-ivory"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10">
          <form action={logoutAction}>
            <button className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-navy-100/75 hover:bg-white/5 hover:text-ivory transition-colors">
              <LogOut size={18} /> Sign out
            </button>
          </form>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-navy-900/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-navy-100 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <button
            className="lg:hidden grid h-10 w-10 place-items-center rounded-lg text-navy-700 hover:bg-navy-700/5"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-4">
            <NotificationBell items={notifications} unread={unread} />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-navy-700 leading-tight">{name}</p>
                <p className="text-xs text-gold-600">{roleLabel[role]}</p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-navy-700 text-gold-400 font-bold">
                {name[0]?.toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
