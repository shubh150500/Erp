"use client";

import { useActionState, useState } from "react";
import { Plus, X, CheckCircle2, AlertCircle } from "lucide-react";
import { addVideo, type VideoFormState } from "./actions";
import { Button } from "@/components/ui/Button";

const initial: VideoFormState = {};

const inputCls =
  "w-full rounded-xl border border-navy-200/70 bg-ivory/50 px-4 py-2.5 text-sm text-navy-700 placeholder:text-navy-400 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30 transition";

type BatchOpt = { id: string; name: string };

export function AddVideoButton({ batches }: { batches: BatchOpt[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(addVideo, initial);

  return (
    <>
      <Button variant="gold" onClick={() => setOpen(true)} disabled={batches.length === 0}>
        <Plus size={16} /> Add video
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-[var(--shadow-lift)]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100">
              <h2 className="font-serif text-xl font-bold text-navy-700">Add video lecture</h2>
              <button onClick={() => setOpen(false)} className="text-navy-400 hover:text-navy-700">
                <X size={20} />
              </button>
            </div>

            {state.ok ? (
              <div className="p-8 text-center">
                <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
                <p className="mt-3 font-semibold text-navy-700">{state.message}</p>
                <Button variant="primary" className="mt-5" onClick={() => window.location.reload()}>
                  Done
                </Button>
              </div>
            ) : (
              <form action={action} className="p-6 space-y-4">
                {state.message && !state.ok && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">
                    <AlertCircle size={16} /> {state.message}
                  </div>
                )}

                <Field label="Batch" err={state.errors?.batchId}>
                  <select name="batchId" className={inputCls} defaultValue="">
                    <option value="" disabled>Select batch</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Title" err={state.errors?.title}>
                    <input name="title" className={inputCls} placeholder="e.g. Kinematics — Lecture 1" />
                  </Field>
                  <Field label="Subject (optional)">
                    <input name="subject" className={inputCls} placeholder="e.g. Physics" />
                  </Field>
                </div>

                <Field label="Video link" err={state.errors?.url}>
                  <input
                    name="url"
                    type="url"
                    className={inputCls}
                    placeholder="https://youtube.com/watch?v=…"
                  />
                </Field>

                <Button type="submit" variant="primary" className="w-full" disabled={pending}>
                  {pending ? "Adding…" : "Add video"}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  err,
  children,
}: {
  label: string;
  err?: string[];
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-navy-700 mb-1.5">{label}</span>
      {children}
      {err?.[0] && <span className="mt-1 block text-xs text-red-600">{err[0]}</span>}
    </label>
  );
}
