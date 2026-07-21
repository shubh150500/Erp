"use client";

import { useActionState, useState } from "react";
import { Plus, X, CheckCircle2, AlertCircle } from "lucide-react";
import { createBatch, type BatchFormState } from "./actions";
import { Button } from "@/components/ui/Button";

const initial: BatchFormState = {};

const inputCls =
  "w-full rounded-xl border border-navy-200/70 bg-ivory/50 px-4 py-2.5 text-sm text-navy-700 placeholder:text-navy-400 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30 transition";

export function AddBatchButton({
  courses,
  teachers,
}: {
  courses: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createBatch, initial);

  return (
    <>
      <Button variant="gold" onClick={() => setOpen(true)}>
        <Plus size={16} /> New batch
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-[var(--shadow-lift)]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100">
              <h2 className="font-serif text-xl font-bold text-navy-700">New batch</h2>
              <button onClick={() => setOpen(false)} className="text-navy-400 hover:text-navy-700">
                <X size={20} />
              </button>
            </div>

            {state.ok ? (
              <div className="p-8 text-center">
                <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
                <p className="mt-3 font-semibold text-navy-700">{state.message}</p>
                <Button variant="outline" className="mt-5" onClick={() => window.location.reload()}>
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
                <Field label="Batch name" err={state.errors?.name}>
                  <input name="name" className={inputCls} placeholder="e.g. XII-Science-A" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Year" err={state.errors?.year}>
                    <input name="year" className={inputCls} placeholder="2025-26" />
                  </Field>
                  <Field label="Fee (₹)" err={state.errors?.feeAmount}>
                    <input name="feeAmount" type="number" className={inputCls} placeholder="0" defaultValue={0} />
                  </Field>
                </div>
                <Field label="Course" err={state.errors?.courseId}>
                  <select name="courseId" className={inputCls} defaultValue="">
                    <option value="" disabled>Select course</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Assign teacher (optional)">
                  <select name="teacherId" className={inputCls} defaultValue="">
                    <option value="">— Unassigned —</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </Field>
                <Button type="submit" variant="primary" className="w-full" disabled={pending}>
                  {pending ? "Saving…" : "Create batch"}
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
