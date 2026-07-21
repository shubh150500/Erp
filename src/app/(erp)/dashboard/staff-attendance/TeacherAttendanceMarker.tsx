"use client";

import { useState, useTransition } from "react";
import { Check, CheckCircle2, AlertCircle } from "lucide-react";
import type { AttendanceStatus } from "@prisma/client";
import { markTeacherAttendance } from "./actions";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type Teacher = { id: string; name: string; subject: string | null; status?: AttendanceStatus };

const STATUSES: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

const statusStyle: Record<AttendanceStatus, string> = {
  PRESENT: "bg-emerald-500 text-white border-emerald-500",
  ABSENT: "bg-red-500 text-white border-red-500",
  LATE: "bg-amber-500 text-white border-amber-500",
  EXCUSED: "bg-blue-500 text-white border-blue-500",
};

export function TeacherAttendanceMarker({ teachers }: { teachers: Teacher[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>(
    () => Object.fromEntries(teachers.filter((t) => t.status).map((t) => [t.id, t.status!]))
  );
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function setAll(status: AttendanceStatus) {
    setMarks(Object.fromEntries(teachers.map((t) => [t.id, status])));
  }

  function save() {
    const records = teachers.map((t) => ({ teacherId: t.id, status: marks[t.id] ?? "PRESENT" }));
    start(async () => setResult(await markTeacherAttendance(date, records)));
  }

  if (teachers.length === 0) {
    return <div className="py-12 text-center text-sm text-navy-400">No teaching staff yet.</div>;
  }

  return (
    <div className="space-y-5 p-5">
      <div className="flex flex-wrap items-end gap-4">
        <label className="block">
          <span className="block text-sm font-medium text-navy-700 mb-1.5">Date</span>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => {
              setDate(e.target.value);
              setResult(null);
            }}
            className="rounded-xl border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-700 focus:outline-none focus:border-gold-500"
          />
        </label>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setAll("PRESENT")} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
            All present
          </button>
          <button onClick={() => setAll("ABSENT")} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100">
            All absent
          </button>
        </div>
      </div>

      {result && (
        <div className={cn("flex items-center gap-2 rounded-xl px-4 py-3 text-sm", result.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
          {result.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {result.message}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-navy-100">
        <ul className="divide-y divide-navy-100">
          {teachers.map((t) => {
            const cur = marks[t.id] ?? "PRESENT";
            return (
              <li key={t.id} className="flex items-center justify-between gap-4 bg-white px-5 py-3">
                <div>
                  <p className="font-medium text-navy-700">{t.name}</p>
                  <p className="text-xs text-navy-400">{t.subject ?? "—"}</p>
                </div>
                <div className="flex gap-1.5">
                  {STATUSES.map((st) => (
                    <button
                      key={st}
                      onClick={() => setMarks((m) => ({ ...m, [t.id]: st }))}
                      className={cn(
                        "rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                        cur === st ? statusStyle[st] : "border-navy-200 text-navy-500 hover:border-navy-400"
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
        <p className="text-xs text-navy-400">P = Present · A = Absent · L = Late · E = Excused. Unmarked defaults to Present.</p>
        <Button variant="primary" onClick={save} disabled={pending}>
          <Check size={16} /> {pending ? "Saving…" : "Save attendance"}
        </Button>
      </div>
    </div>
  );
}
