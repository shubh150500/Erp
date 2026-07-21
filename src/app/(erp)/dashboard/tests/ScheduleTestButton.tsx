"use client";

import { useActionState, useState } from "react";
import { CalendarPlus, X, CheckCircle2, AlertCircle } from "lucide-react";
import { scheduleTest, type TestFormState } from "./actions";
import { Button } from "@/components/ui/Button";

const initial: TestFormState = {};

const inputCls =
  "w-full rounded-xl border border-navy-200/70 bg-ivory/50 px-4 py-2.5 text-sm text-navy-700 placeholder:text-navy-400 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30 transition";

type BatchOpt = { id: string; name: string };

export function ScheduleTestButton({ batches }: { batches: BatchOpt[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(scheduleTest, initial);

  return (
    <>
      <Button variant="gold" onClick={() => setOpen(true)} disabled={batches.length === 0}>
        <CalendarPlus size={16} /> Schedule test
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-[var(--shadow-lift)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100">
              <h2 className="font-serif text-xl font-bold text-navy-700">Schedule a test</h2>
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
                    <option value="" disabled>
                      Select batch
                    </option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Title" err={state.errors?.title}>
                    <input name="title" className={inputCls} placeholder="e.g. Unit Test 3" />
                  </Field>
                  <Field label="Subject" err={state.errors?.subject}>
                    <input name="subject" className={inputCls} placeholder="e.g. Physics" />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Date" err={state.errors?.date}>
                    <input name="date" type="date" className={inputCls} />
                  </Field>
                  <Field label="Max marks" err={state.errors?.maxMarks}>
                    <input name="maxMarks" type="number" min="1" defaultValue={100} className={inputCls} />
                  </Field>
                </div>

                <Field label="Syllabus / what to prepare (optional)">
                  <textarea name="syllabus" rows={3} className={inputCls} placeholder="Chapters and topics covered…" />
                </Field>

                <Button type="submit" variant="primary" className="w-full" disabled={pending}>
                  {pending ? "Scheduling…" : "Schedule test"}
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
