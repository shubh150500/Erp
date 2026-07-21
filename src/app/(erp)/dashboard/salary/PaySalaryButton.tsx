"use client";

import { useActionState, useState } from "react";
import { Banknote, X, CheckCircle2, AlertCircle } from "lucide-react";
import { paySalary, type SalaryFormState } from "./actions";

const initial: SalaryFormState = {};

const inputCls =
  "w-full rounded-xl border border-navy-200/70 bg-ivory/50 px-4 py-2.5 text-sm text-navy-700 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30 transition";

const inr = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export function PaySalaryButton({
  teacherId,
  teacherName,
  salary,
  defaultMonth,
}: {
  teacherId: string;
  teacherName: string;
  salary: number;
  defaultMonth: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(paySalary, initial);
  const [gross, setGross] = useState(salary || 0);
  const [bonus, setBonus] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [advance, setAdvance] = useState(0);
  const net = Math.max(0, gross + bonus - deductions - advance);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full bg-gold-500 px-3 py-1.5 text-xs font-semibold text-navy-800 hover:bg-gold-400"
      >
        <Banknote size={13} /> Pay
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-[var(--shadow-lift)]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100">
              <h2 className="font-serif text-xl font-bold text-navy-700">Pay salary</h2>
              <button onClick={() => setOpen(false)} className="text-navy-400 hover:text-navy-700">
                <X size={20} />
              </button>
            </div>

            {state.ok ? (
              <div className="p-8 text-center">
                <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
                <p className="mt-3 font-semibold text-navy-700">{state.message}</p>
                <button
                  className="mt-5 rounded-full bg-navy-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-600"
                  onClick={() => window.location.reload()}
                >
                  Done
                </button>
              </div>
            ) : (
              <form action={action} className="p-6 space-y-4">
                <input type="hidden" name="teacherId" value={teacherId} />
                <p className="text-sm text-navy-500">
                  Record a salary payment for <span className="font-semibold text-navy-700">{teacherName}</span>.
                </p>
                {state.message && !state.ok && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">
                    <AlertCircle size={16} /> {state.message}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Month" err={state.errors?.forMonth}>
                    <input name="forMonth" type="month" defaultValue={defaultMonth} className={inputCls} />
                  </Field>
                  <Field label="Gross salary (₹)" err={state.errors?.gross}>
                    <input
                      name="gross"
                      type="number"
                      min="0"
                      step="1"
                      value={gross || ""}
                      onChange={(e) => setGross(Number(e.target.value) || 0)}
                      className={inputCls}
                      placeholder="0"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Field label="Bonus (₹)">
                    <input
                      name="bonus"
                      type="number"
                      min="0"
                      step="1"
                      value={bonus || ""}
                      onChange={(e) => setBonus(Number(e.target.value) || 0)}
                      className={inputCls}
                      placeholder="0"
                    />
                  </Field>
                  <Field label="Deductions (₹)">
                    <input
                      name="deductions"
                      type="number"
                      min="0"
                      step="1"
                      value={deductions || ""}
                      onChange={(e) => setDeductions(Number(e.target.value) || 0)}
                      className={inputCls}
                      placeholder="0"
                    />
                  </Field>
                  <Field label="Advance (₹)">
                    <input
                      name="advance"
                      type="number"
                      min="0"
                      step="1"
                      value={advance || ""}
                      onChange={(e) => setAdvance(Number(e.target.value) || 0)}
                      className={inputCls}
                      placeholder="0"
                    />
                  </Field>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-navy-700/5 px-4 py-3">
                  <span className="text-sm font-medium text-navy-600">Net payable</span>
                  <span className="text-lg font-bold text-navy-700">{inr(net)}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Amount paid now (₹)">
                    <input
                      name="paidAmount"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={net || ""}
                      className={inputCls}
                      placeholder={String(net)}
                    />
                  </Field>
                  <Field label="Mode">
                    <select name="mode" className={inputCls} defaultValue="BANK">
                      <option value="BANK">Bank transfer</option>
                      <option value="UPI">UPI</option>
                      <option value="CASH">Cash</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="CARD">Card</option>
                    </select>
                  </Field>
                </div>
                <p className="text-xs text-navy-400">
                  Leave “amount paid now” at the net for a full payment, or lower it to record a partial payment.
                </p>

                <Field label="Note (optional)">
                  <input name="note" className={inputCls} placeholder="e.g. festival bonus included" />
                </Field>

                <button
                  type="submit"
                  disabled={pending}
                  className="w-full rounded-full bg-navy-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-600 disabled:opacity-60"
                >
                  {pending ? "Recording…" : "Record payment"}
                </button>
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
