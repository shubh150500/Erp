"use client";

import { useActionState, useState } from "react";
import { Pencil, X, CheckCircle2, AlertCircle } from "lucide-react";
import { setTeacherSalary, type SalaryFormState } from "./actions";

const initial: SalaryFormState = {};

const inputCls =
  "w-full rounded-xl border border-navy-200/70 bg-ivory/50 px-4 py-2.5 text-sm text-navy-700 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30 transition";

type Hr = {
  designation?: string | null;
  joinDate?: string | null; // yyyy-mm-dd
  bankName?: string | null;
  bankAccount?: string | null;
  ifsc?: string | null;
};

export function SetSalaryButton({
  teacherId,
  teacherName,
  current,
  hr,
}: {
  teacherId: string;
  teacherName: string;
  current: number;
  hr?: Hr;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(setTeacherSalary, initial);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-navy-600 hover:text-gold-600"
      >
        <Pencil size={12} /> Set salary
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-[var(--shadow-lift)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100">
              <h2 className="font-serif text-lg font-bold text-navy-700">Salary &amp; HR profile</h2>
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
                  Set the monthly salary for <span className="font-semibold text-navy-700">{teacherName}</span>.
                </p>
                {state.message && !state.ok && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">
                    <AlertCircle size={16} /> {state.message}
                  </div>
                )}
                <label className="block">
                  <span className="block text-sm font-medium text-navy-700 mb-1.5">Monthly salary (₹)</span>
                  <input
                    name="monthlySalary"
                    type="number"
                    min="0"
                    step="100"
                    defaultValue={current || ""}
                    className={inputCls}
                    placeholder="e.g. 25000"
                  />
                  {state.errors?.monthlySalary?.[0] && (
                    <span className="mt-1 block text-xs text-red-600">{state.errors.monthlySalary[0]}</span>
                  )}
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block text-sm font-medium text-navy-700 mb-1.5">Designation</span>
                    <input name="designation" defaultValue={hr?.designation ?? ""} className={inputCls} placeholder="e.g. Senior Faculty" />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-medium text-navy-700 mb-1.5">Joining date</span>
                    <input name="joinDate" type="date" defaultValue={hr?.joinDate ?? ""} className={inputCls} />
                  </label>
                </div>

                <label className="block">
                  <span className="block text-sm font-medium text-navy-700 mb-1.5">Bank name</span>
                  <input name="bankName" defaultValue={hr?.bankName ?? ""} className={inputCls} placeholder="e.g. SBI" />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block text-sm font-medium text-navy-700 mb-1.5">Account no.</span>
                    <input name="bankAccount" defaultValue={hr?.bankAccount ?? ""} className={inputCls} placeholder="XXXXXXXX" />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-medium text-navy-700 mb-1.5">IFSC</span>
                    <input name="ifsc" defaultValue={hr?.ifsc ?? ""} className={inputCls} placeholder="SBIN0000123" />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={pending}
                  className="w-full rounded-full bg-navy-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-600 disabled:opacity-60"
                >
                  {pending ? "Saving…" : "Save profile"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
