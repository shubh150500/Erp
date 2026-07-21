"use client";

import { useTransition } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { setLessonDone } from "./actions";

export function CompleteLessonButton({ id, done }: { id: string; done: boolean }) {
  const [pending, start] = useTransition();

  if (done) {
    return (
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            await setLessonDone(id, false);
            window.location.reload();
          })
        }
        className="inline-flex items-center gap-1 text-xs font-semibold text-navy-400 hover:text-navy-700 disabled:opacity-50"
      >
        <RotateCcw size={13} /> {pending ? "…" : "Reopen"}
      </button>
    );
  }

  return (
    <button
      disabled={pending}
      onClick={() => {
        const note = prompt("Teaching-log note (optional) — what was covered?") ?? "";
        start(async () => {
          await setLessonDone(id, true, note);
          window.location.reload();
        });
      }}
      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
    >
      <CheckCircle2 size={14} /> {pending ? "…" : "Mark taught"}
    </button>
  );
}
