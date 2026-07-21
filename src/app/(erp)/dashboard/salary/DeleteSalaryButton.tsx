"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteSalaryPayment } from "./actions";

export function DeleteSalaryButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this salary payment record?")) return;
        start(async () => {
          await deleteSalaryPayment(id);
          window.location.reload();
        });
      }}
      className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50"
    >
      <Trash2 size={13} /> {pending ? "…" : "Delete"}
    </button>
  );
}
