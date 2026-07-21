"use client";

import { Printer, ArrowLeft, FileDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function PrintBar({ id }: { id: string }) {
  return (
    <div className="print:hidden mb-5 flex flex-wrap items-center justify-between gap-3">
      <Link
        href="/dashboard/fees/slips"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600 hover:text-gold-600"
      >
        <ArrowLeft size={16} /> Back to slips
      </Link>
      <div className="flex items-center gap-2">
        <a
          href={`/dashboard/fees/slips/${id}/pdf`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-navy-200 bg-white px-4 py-2 text-sm font-semibold text-navy-700 hover:border-gold-500 hover:text-gold-600"
        >
          <FileDown size={16} /> Download PDF
        </a>
        <Button variant="gold" onClick={() => window.print()}>
          <Printer size={16} /> Print
        </Button>
      </div>
    </div>
  );
}
