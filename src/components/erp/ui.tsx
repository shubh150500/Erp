import { cn } from "@/lib/cn";

export function PageTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-navy-700">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-navy-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "navy",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "navy" | "gold" | "green" | "red";
}) {
  const tones = {
    navy: "text-navy-700",
    gold: "text-gold-600",
    green: "text-emerald-600",
    red: "text-red-600",
  };
  return (
    <div className="rounded-2xl bg-white border border-navy-100 p-5 shadow-[var(--shadow-card)]">
      <p className="text-xs uppercase tracking-wider text-navy-400 font-semibold">
        {label}
      </p>
      <p className={cn("mt-2 font-serif text-3xl font-bold", tones[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-navy-400">{hint}</p>}
    </div>
  );
}

export function Panel({
  title,
  children,
  className,
  action,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl bg-white border border-navy-100 shadow-[var(--shadow-card)]",
        className
      )}
    >
      {title && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-navy-100">
          <h2 className="font-semibold text-navy-700">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center text-sm text-navy-400">{message}</div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    NEW: "bg-blue-100 text-blue-700",
    CONTACTED: "bg-amber-100 text-amber-700",
    ENROLLED: "bg-emerald-100 text-emerald-700",
    CLOSED: "bg-gray-100 text-gray-600",
    PRESENT: "bg-emerald-100 text-emerald-700",
    ABSENT: "bg-red-100 text-red-700",
    LATE: "bg-amber-100 text-amber-700",
    EXCUSED: "bg-blue-100 text-blue-700",
    PAID: "bg-emerald-100 text-emerald-700",
    DUE: "bg-red-100 text-red-700",
    PENDING: "bg-amber-100 text-amber-700",
    REJECTED: "bg-red-100 text-red-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    OPEN: "bg-amber-100 text-amber-700",
    RESOLVED: "bg-emerald-100 text-emerald-700",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
        map[status] ?? "bg-gray-100 text-gray-600"
      )}
    >
      {status}
    </span>
  );
}
