"use client";

import { useState, useTransition } from "react";
import { Check, CheckCircle2, AlertCircle } from "lucide-react";
import type { AttendanceStatus } from "@prisma/client";
import { markAttendance } from "./actions";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type Student = { id: string; name: string; rollNo: string };

const STATUSES: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

const statusStyle: Record<AttendanceStatus, string> = {
  PRESENT: "bg-emerald-500 text-white border-emerald-500",
  ABSENT: "bg-red-500 text-white border-red-500",
  LATE: "bg-amber-500 text-white border-amber-500",
  EXCUSED: "bg-blue-500 text-white border-blue-500",
};

export function AttendanceMarker({
  batches,
}: {
  batches: { id: string; name: string; students: Student[] }[];
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [batchId, setBatchId] = useState(batches[0]?.id ?? "");
  const [date, setDate] = useState(today);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const batch = batches.find((b) => b.id === batchId);
  const students = batch?.students ?? [];

  function setAll(status: AttendanceStatus) {
    const next: Record<string, AttendanceStatus> = {};
    students.forEach((s) => (next[s.id] = status));
    setMarks(next);
  }

  function save() {
    const records = students.map((s) => ({
      studentId: s.id,
      status: marks[s.id] ?? "PRESENT",
    }));
    start(async () => {
      const res = await markAttendance(batchId, date, records);
      setResult(res);
    });
  }

  if (batches.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-navy-400">
        No batches assigned. Create a batch and enroll students first.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-4 items-end">
        <label className="block">
          <span className="block text-sm font-medium text-navy-700 mb-1.5">Batch</span>
          <select
            value={batchId}
            onChange={(e) => { setBatchId(e.target.value); setMarks({}); setResult(null); }}
            className="rounded-xl border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-700 focus:outline-none focus:border-gold-500"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-navy-700 mb-1.5">Date</span>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-700 focus:outline-none focus:border-gold-500"
          />
        </label>
        <div className="flex gap-2 ml-auto">
          <button onClick={() => setAll("PRESENT")} className="text-xs font-semibold rounded-lg px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
            All present
          </button>
          <button onClick={() => setAll("ABSENT")} className="text-xs font-semibold rounded-lg px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100">
            All absent
          </button>
        </div>
      </div>

      {result && (
        <div className={cn("flex items-center gap-2 rounded-xl px-4 py-3 text-sm",
          result.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
          {result.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {result.message}
        </div>
      )}

      {students.length === 0 ? (
        <div className="py-10 text-center text-sm text-navy-400">
          No students enrolled in this batch.
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-navy-100 overflow-hidden">
            <ul className="divide-y divide-navy-100">
              {students.map((s) => {
                const cur = marks[s.id] ?? "PRESENT";
                return (
                  <li key={s.id} className="flex items-center justify-between gap-4 px-5 py-3 bg-white">
                    <div>
                      <p className="font-medium text-navy-700">{s.name}</p>
                      <p className="text-xs text-navy-400">{s.rollNo}</p>
                    </div>
                    <div className="flex gap-1.5">
                      {STATUSES.map((st) => (
                        <button
                          key={st}
                          onClick={() => setMarks((m) => ({ ...m, [s.id]: st }))}
                          className={cn(
                            "rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                            cur === st
                              ? statusStyle[st]
                              : "border-navy-200 text-navy-500 hover:border-navy-400"
                          )}
                        >
                          {st[0]}
                        </button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-navy-400">
              P = Present · A = Absent · L = Late · E = Excused. Unmarked defaults to Present.
            </p>
            <Button variant="primary" onClick={save} disabled={pending}>
              <Check size={16} /> {pending ? "Saving…" : "Save attendance"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
