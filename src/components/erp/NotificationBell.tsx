"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { markAllRead } from "@/app/(erp)/dashboard/notifications/actions";
import { cn } from "@/lib/cn";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string; // ISO string (serialised for the client)
};

export function NotificationBell({
  items,
  unread,
}: {
  items: NotificationItem[];
  unread: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-10 w-10 place-items-center rounded-full text-navy-600 hover:bg-navy-700/5"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-white border border-navy-100 shadow-[var(--shadow-lift)] z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-navy-100">
              <p className="font-semibold text-navy-700 text-sm">Notifications</p>
              {unread > 0 && (
                <button
                  onClick={() => start(() => markAllRead())}
                  disabled={pending}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-gold-600 hover:text-gold-700"
                >
                  <Check size={13} /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-navy-400">
                  No notifications yet.
                </p>
              ) : (
                <ul className="divide-y divide-navy-100">
                  {items.map((n) => {
                    const inner = (
                      <div
                        className={cn(
                          "px-4 py-3 hover:bg-ivory/60 transition-colors",
                          !n.read && "bg-gold-500/5"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {!n.read && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-500" />
                          )}
                          <div className={cn(!n.read ? "" : "pl-4")}>
                            <p className="text-sm font-semibold text-navy-700">{n.title}</p>
                            <p className="text-xs text-navy-500 leading-relaxed">{n.body}</p>
                            <p className="mt-1 text-[11px] text-navy-400">
                              {new Date(n.createdAt).toLocaleString("en-IN", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                    return (
                      <li key={n.id}>
                        {n.href ? (
                          <Link href={n.href} onClick={() => setOpen(false)}>
                            {inner}
                          </Link>
                        ) : (
                          inner
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
