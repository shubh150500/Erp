"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteHomework } from "./actions";

export function DeleteHomeworkButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this homework?")) return;
        start(async () => {
          await deleteHomework(id);
          window.location.reload();
        });
      }}
      className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50"
    >
      <Trash2 size={13} /> {pending ? "…" : "Delete"}
    </button>
  );
}
