"use client";

import { useActionState, useState } from "react";
import { ArrowLeftRight, X, CheckCircle2, AlertCircle } from "lucide-react";
import { transferBatch, type StudentFormState } from "./actions";

const initial: StudentFormState = {};

const inputCls =
  "w-full rounded-xl border border-navy-200/70 bg-ivory/50 px-4 py-2.5 text-sm text-navy-700 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30 transition";

type BatchOpt = { id: string; name: string };

export function TransferBatchButton({
  studentId,
  studentName,
  currentBatches,
  allBatches,
}: {
  studentId: string;
  studentName: string;
  currentBatches: BatchOpt[];
  allBatches: BatchOpt[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(transferBatch, initial);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-navy-600 hover:text-gold-600"
      >
        <ArrowLeftRight size={13} /> Transfer
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-[var(--shadow-lift)]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100">
              <h2 className="font-serif text-xl font-bold text-navy-700">Transfer batch</h2>
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
                <input type="hidden" name="studentId" value={studentId} />
                <p className="text-sm text-navy-500">
                  Move <span className="font-semibold text-navy-700">{studentName}</span> to a different batch.
                </p>

                {state.message && !state.ok && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">
                    <AlertCircle size={16} /> {state.message}
                  </div>
                )}

                <label className="block">
                  <span className="block text-sm font-medium text-navy-700 mb-1.5">From batch (optional)</span>
                  <select name="fromBatchId" className={inputCls} defaultValue="">
                    <option value="">— Keep existing, just add —</option>
                    {currentBatches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="block text-sm font-medium text-navy-700 mb-1.5">To batch</span>
                  <select name="toBatchId" className={inputCls} defaultValue="">
                    <option value="" disabled>
                      Select batch
                    </option>
                    {allBatches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  {state.errors?.toBatchId?.[0] && (
                    <span className="mt-1 block text-xs text-red-600">{state.errors.toBatchId[0]}</span>
                  )}
                </label>

                <button
                  type="submit"
                  disabled={pending}
                  className="w-full rounded-full bg-navy-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-600 disabled:opacity-60"
                >
                  {pending ? "Transferring…" : "Transfer"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
