"use client";

import { useActionState, useState } from "react";
import { Plus, X, CheckCircle2, AlertCircle, ImagePlus } from "lucide-react";
import { askDoubt, type DoubtFormState } from "./actions";
import { Button } from "@/components/ui/Button";

const initial: DoubtFormState = {};

const inputCls =
  "w-full rounded-xl border border-navy-200/70 bg-ivory/50 px-4 py-2.5 text-sm text-navy-700 placeholder:text-navy-400 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30 transition";

type BatchOpt = { id: string; name: string };

export function AskDoubtButton({ batches }: { batches: BatchOpt[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(askDoubt, initial);
  const [fileName, setFileName] = useState("");

  return (
    <>
      <Button variant="gold" onClick={() => setOpen(true)}>
        <Plus size={16} /> Ask a doubt
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-[var(--shadow-lift)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100">
              <h2 className="font-serif text-xl font-bold text-navy-700">Ask a doubt</h2>
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

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Subject (optional)">
                    <input name="subject" className={inputCls} placeholder="e.g. Maths" />
                  </Field>
                  <Field label="Batch (optional)">
                    <select name="batchId" className={inputCls} defaultValue="">
                      <option value="">— None —</option>
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Your doubt" err={state.errors?.question}>
                  <textarea name="question" rows={4} className={inputCls} placeholder="Type your question…" />
                </Field>

                <div>
                  <span className="block text-sm font-medium text-navy-700 mb-1.5">
                    Attach a photo (optional)
                  </span>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-navy-200 bg-ivory/50 px-4 py-2.5 text-sm text-navy-500 hover:border-gold-400">
                    <ImagePlus size={15} /> {fileName || "Choose an image"}
                    <input
                      type="file"
                      name="image"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
                    />
                  </label>
                </div>

                <Button type="submit" variant="primary" className="w-full" disabled={pending}>
                  {pending ? "Submitting…" : "Submit doubt"}
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
