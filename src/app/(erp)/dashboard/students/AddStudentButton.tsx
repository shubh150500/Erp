"use client";

import { useActionState, useState } from "react";
import { UserPlus, X, CheckCircle2, AlertCircle } from "lucide-react";
import { createStudent, type StudentFormState } from "./actions";
import { Button } from "@/components/ui/Button";

const initial: StudentFormState = {};

const inputCls =
  "w-full rounded-xl border border-navy-200/70 bg-ivory/50 px-4 py-2.5 text-sm text-navy-700 placeholder:text-navy-400 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30 transition";

export function AddStudentButton({
  batches,
}: {
  batches: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createStudent, initial);

  return (
    <>
      <Button variant="gold" onClick={() => setOpen(true)}>
        <UserPlus size={16} /> Add student
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-[var(--shadow-lift)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100 sticky top-0 bg-white">
              <h2 className="font-serif text-xl font-bold text-navy-700">New student</h2>
              <button onClick={() => setOpen(false)} className="text-navy-400 hover:text-navy-700">
                <X size={20} />
              </button>
            </div>

            {state.ok ? (
              <div className="p-8 text-center">
                <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
                <p className="mt-3 font-semibold text-navy-700">{state.message}</p>
                <div className="mt-5 flex justify-center gap-3">
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form action={action} className="p-6 space-y-4">
                {state.message && !state.ok && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">
                    <AlertCircle size={16} /> {state.message}
                  </div>
                )}
                <Field label="Full name" err={state.errors?.name}>
                  <input name="name" className={inputCls} placeholder="Student name" />
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Login email" err={state.errors?.email}>
                    <input name="email" type="email" className={inputCls} placeholder="student@…" />
                  </Field>
                  <Field label="Password" err={state.errors?.password}>
                    <input name="password" className={inputCls} placeholder="min 6 chars" />
                  </Field>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Roll number" err={state.errors?.rollNo}>
                    <input name="rollNo" className={inputCls} placeholder="e.g. TE-101" />
                  </Field>
                  <Field label="Class" err={state.errors?.className}>
                    <select name="className" className={inputCls} defaultValue="">
                      <option value="" disabled>Select</option>
                      {["Class 8","Class 9","Class 10","Class 11","Class 12"].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Phone (optional)" err={state.errors?.phone}>
                    <input name="phone" className={inputCls} placeholder="Mobile" />
                  </Field>
                  <Field label="Guardian (optional)" err={state.errors?.guardianName}>
                    <input name="guardianName" className={inputCls} placeholder="Parent name" />
                  </Field>
                </div>
                <Field label="Enroll in batch (optional)">
                  <select name="batchId" className={inputCls} defaultValue="">
                    <option value="">— No batch —</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </Field>
                <Button type="submit" variant="primary" className="w-full" disabled={pending}>
                  {pending ? "Saving…" : "Create student"}
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
