import Link from "next/link";
import { cn } from "@/lib/cn";

/** Text-based wordmark logo for Triple Entente. */
export function Logo({
  className,
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "grid h-10 w-10 place-items-center rounded-xl font-serif text-lg font-bold transition-transform group-hover:scale-105",
          light
            ? "bg-gold-500 text-navy-800"
            : "bg-navy-700 text-gold-400 shadow-[0_6px_16px_-8px_rgba(13,27,62,0.8)]"
        )}
        aria-hidden
      >
        TE
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-serif text-lg font-bold tracking-tight",
            light ? "text-ivory" : "text-navy-700"
          )}
        >
          Triple Entente
        </span>
        <span
          className={cn(
            "text-[10px] font-semibold uppercase tracking-[0.22em]",
            light ? "text-gold-400" : "text-gold-600"
          )}
        >
          Study Hard · Result Best
        </span>
      </span>
    </Link>
  );
}
