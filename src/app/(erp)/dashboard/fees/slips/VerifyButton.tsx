"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, X, CheckCircle2, AlertCircle, Ban } from "lucide-react";
import { verifyFeeSlip } from "./actions";
import { Button } from "@/components/ui/Button";

export function VerifyButton({
  slipId,
  slipNo,
  studentName,
  amount,
  proofImage,
  txnRef,
}: {
  slipId: string;
  slipNo: string;
  studentName: string;
  amount: number;
  proofImage?: string | null;
  txnRef?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function decide(decision: "PAID" | "REJECTED") {
    start(async () => {
      const res = await verifyFeeSlip(slipId, decision, note);
      setResult(res);
      if (res.ok) setTimeout(() => window.location.reload(), 900);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-600 hover:text-gold-700"
      >
        <ShieldCheck size={15} /> Verify
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy-900/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-lift)]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100 shrink-0">
              <h2 className="font-serif text-xl font-bold text-navy-700">Verify slip</h2>
              <button onClick={() => setOpen(false)} className="text-navy-400 hover:text-navy-700">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-4">
              <div className="rounded-xl bg-ivory/60 border border-navy-100 p-4 text-sm">
                <p className="text-navy-700 font-semibold">{slipNo}</p>
                <p className="text-navy-500">{studentName}</p>
                <p className="mt-1 font-serif text-lg text-navy-700">
                  ₹{amount.toLocaleString("en-IN")}
                </p>
              </div>

              {proofImage ? (
                <div className="rounded-xl border border-navy-100 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-navy-400">
                    UPI payment screenshot
                  </p>
                  <a href={proofImage} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proofImage}
                      alt="Payment screenshot"
                      className="max-h-72 w-full rounded-lg border border-navy-100 object-contain bg-ivory/40 hover:opacity-90"
                    />
                  </a>
                  {txnRef && (
                    <p className="mt-2 text-sm text-navy-600">
                      UPI ref: <span className="font-mono text-navy-700">{txnRef}</span>
                    </p>
                  )}
                  <a
                    href={proofImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs font-semibold text-navy-500 hover:text-gold-600"
                  >
                    Open full image →
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  <AlertCircle size={16} /> No payment screenshot uploaded yet.
                </div>
              )}

              {result && (
                <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
                  result.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  {result.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {result.message}
                </div>
              )}

              <label className="block">
                <span className="block text-sm font-medium text-navy-700 mb-1.5">
                  Note (optional — shown to student)
                </span>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Received via UPI, ref #1234"
                  className="w-full rounded-xl border border-navy-200/70 bg-ivory/50 px-4 py-2.5 text-sm text-navy-700 focus:outline-none focus:border-gold-500"
                />
              </label>

              <div className="flex gap-3">
                <Button
                  variant="gold"
                  className="flex-1"
                  onClick={() => decide("PAID")}
                  disabled={pending}
                >
                  <CheckCircle2 size={16} /> Mark Paid
                </Button>
                <button
                  onClick={() => decide("REJECTED")}
                  disabled={pending}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-red-200 text-red-600 px-6 py-3 text-sm font-semibold hover:bg-red-50 disabled:opacity-60"
                >
                  <Ban size={16} /> Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
