"use client";

import { useActionState, useState } from "react";
import { Plus, X, CheckCircle2, AlertCircle } from "lucide-react";
import { recordPayment, type PaymentFormState } from "./actions";
import { Button } from "@/components/ui/Button";

const initial: PaymentFormState = {};

const inputCls =
  "w-full rounded-xl border border-navy-200/70 bg-ivory/50 px-4 py-2.5 text-sm text-navy-700 placeholder:text-navy-400 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30 transition";

export function RecordPaymentButton({
  students,
}: {
  students: { id: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(recordPayment, initial);

  return (
    <>
      <Button variant="gold" onClick={() => setOpen(true)}>
        <Plus size={16} /> Record payment
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-[var(--shadow-lift)]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100">
              <h2 className="font-serif text-xl font-bold text-navy-700">Record payment</h2>
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
                <Field label="Student" err={state.errors?.studentId}>
                  <select name="studentId" className={inputCls} defaultValue="">
                    <option value="" disabled>Select student</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Amount (₹)" err={state.errors?.amount}>
                    <input name="amount" type="number" className={inputCls} placeholder="0" />
                  </Field>
                  <Field label="Mode" err={state.errors?.mode}>
                    <select name="mode" className={inputCls} defaultValue="CASH">
                      {["CASH","UPI","CARD","BANK","CHEQUE"].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="For month (optional)">
                    <input name="forMonth" className={inputCls} placeholder="e.g. June" />
                  </Field>
                  <Field label="Note (optional)">
                    <input name="note" className={inputCls} placeholder="Remark" />
                  </Field>
                </div>
                <Button type="submit" variant="primary" className="w-full" disabled={pending}>
                  {pending ? "Saving…" : "Save payment"}
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
