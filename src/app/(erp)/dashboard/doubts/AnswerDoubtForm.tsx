"use client";

import { useState, useTransition } from "react";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { answerDoubt } from "./actions";

export function AnswerDoubtForm({ id }: { id: string }) {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function submit() {
    start(async () => {
      const res = await answerDoubt(id, text);
      setResult(res);
      if (res.ok) setTimeout(() => window.location.reload(), 800);
    });
  }

  return (
    <div className="mt-3 border-t border-navy-100 pt-3">
      {result && (
        <div
          className={`mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
            result.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {result.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} {result.message}
        </div>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="Write your answer…"
        className="w-full rounded-xl border border-navy-200/70 bg-ivory/50 px-4 py-2.5 text-sm text-navy-700 placeholder:text-navy-400 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
      />
      <button
        onClick={submit}
        disabled={pending || text.trim().length < 2}
        className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-navy-700 px-4 py-2 text-sm font-semibold text-ivory hover:bg-navy-600 disabled:opacity-50"
      >
        <Send size={14} /> {pending ? "Sending…" : "Send answer"}
      </button>
    </div>
  );
}
