"use client";

import { useTransition } from "react";
import { Check, Ban } from "lucide-react";
import { decideLeave } from "./actions";

export function DecideLeaveButtons({ id }: { id: string }) {
  const [pending, start] = useTransition();

  function decide(decision: "APPROVED" | "REJECTED") {
    start(async () => {
      await decideLeave(id, decision);
      window.location.reload();
    });
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => decide("APPROVED")}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        <Check size={13} /> Approve
      </button>
      <button
        onClick={() => decide("REJECTED")}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <Ban size={13} /> Reject
      </button>
    </div>
  );
}
