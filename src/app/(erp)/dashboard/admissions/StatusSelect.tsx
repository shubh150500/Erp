"use client";

import { useTransition } from "react";
import type { InquiryStatus } from "@prisma/client";
import { updateInquiryStatus } from "./actions";

const STATUSES: InquiryStatus[] = ["NEW", "CONTACTED", "ENROLLED", "CLOSED"];

export function StatusSelect({
  id,
  current,
}: {
  id: string;
  current: InquiryStatus;
}) {
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={current}
      disabled={pending}
      onChange={(e) =>
        start(() => updateInquiryStatus(id, e.target.value as InquiryStatus))
      }
      className="rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-navy-700 focus:outline-none focus:border-gold-500"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
