"use client";

import { useActionState, useState, useTransition } from "react";
import { Plus, X, Save, CheckCircle2, AlertCircle, Pencil } from "lucide-react";
import { createExam, saveMarks, type ExamFormState } from "./actions";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const initial: ExamFormState = {};

const inputCls =
  "w-full rounded-xl border border-navy-200/70 bg-ivory/50 px-4 py-2.5 text-sm text-navy-700 placeholder:text-navy-400 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30 transition";

type Student = { id: string; name: string; rollNo: string };
type Exam = {
  id: string;
  title: string;
  subject: string;
  maxMarks: number;
  batchName: string;
  students: Student[];
  scores: Record<string, number>;
};

export function NewExamButton({
  batches,
}: {
  batches: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createExam, initial);

  return (
    <>
      <Button variant="gold" onClick={() => setOpen(true)}>
        <Plus size={16} /> New exam
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-[var(--shadow-lift)]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100">
              <h2 className="font-serif text-xl font-bold text-navy-700">New exam</h2>
              <button onClick={() => setOpen(false)} className="text-navy-400 hover:text-navy-700">
                <X size={20} />
              </button>
            </div>
            {state.ok ? (
              <div className="p-8 text-center">
                <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
                <p className="mt-3 font-semibold text-navy-700">{state.message}</p>
                <Button variant="outline" className="mt-5" onClick={() => window.location.reload()}>Done</Button>
              </div>
            ) : (
              <form action={action} className="p-6 space-y-4">
                {state.message && !state.ok && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">
                    <AlertCircle size={16} /> {state.message}
                  </div>
                )}
                <Field label="Exam title" err={state.errors?.title}>
                  <input name="title" className={inputCls} placeholder="e.g. Unit Test 1" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Subject" err={state.errors?.subject}>
                    <input name="subject" className={inputCls} placeholder="Physics" />
                  </Field>
                  <Field label="Max marks" err={state.errors?.maxMarks}>
                    <input name="maxMarks" type="number" className={inputCls} defaultValue={100} />
                  </Field>
                </div>
                <Field label="Batch" err={state.errors?.batchId}>
                  <select name="batchId" className={inputCls} defaultValue="">
                    <option value="" disabled>Select batch</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Date (optional)">
                  <input name="date" type="date" className={inputCls} />
                </Field>
                <Button type="submit" variant="primary" className="w-full" disabled={pending}>
                  {pending ? "Saving…" : "Create exam"}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function MarksEditor({ exam }: { exam: Exam }) {
  const [open, setOpen] = useState(false);
  const [scores, setScores] = useState<Record<string, string>>(
    Object.fromEntries(exam.students.map((s) => [s.id, exam.scores[s.id]?.toString() ?? ""]))
  );
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function save() {
    const entries = exam.students
      .map((s) => ({ studentId: s.id, score: Number(scores[s.id]) }))
      .filter((e) => !Number.isNaN(e.score) && scores[e.studentId] !== "");
    start(async () => {
      const res = await saveMarks(exam.id, entries);
      setResult(res);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-600 hover:text-gold-700"
      >
        <Pencil size={14} /> Enter marks
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-[var(--shadow-lift)] max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100">
              <div>
                <h2 className="font-serif text-xl font-bold text-navy-700">{exam.title}</h2>
                <p className="text-xs text-navy-400">{exam.subject} · {exam.batchName} · out of {exam.maxMarks}</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-navy-400 hover:text-navy-700">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {result && (
                <div className={cn("mb-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm",
                  result.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
                  {result.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />} {result.message}
                </div>
              )}
              {exam.students.length === 0 ? (
                <p className="py-8 text-center text-sm text-navy-400">No students in this batch.</p>
              ) : (
                <ul className="divide-y divide-navy-100">
                  {exam.students.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-4 px-2 py-2.5">
                      <div>
                        <p className="font-medium text-navy-700">{s.name}</p>
                        <p className="text-xs text-navy-400">{s.rollNo}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={scores[s.id] ?? ""}
                          max={exam.maxMarks}
                          min={0}
                          onChange={(e) => setScores((m) => ({ ...m, [s.id]: e.target.value }))}
                          className="w-20 rounded-lg border border-navy-200 px-3 py-1.5 text-sm text-right focus:outline-none focus:border-gold-500"
                          placeholder="—"
                        />
                        <span className="text-xs text-navy-400">/ {exam.maxMarks}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="px-6 py-4 border-t border-navy-100">
              <Button variant="primary" className="w-full" onClick={save} disabled={pending}>
                <Save size={16} /> {pending ? "Saving…" : "Save marks"}
              </Button>
            </div>
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
