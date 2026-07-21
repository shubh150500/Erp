"use client";

import { useActionState, useRef, useState } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, ImageIcon } from "lucide-react";
import { uploadPaymentProof, type ProofFormState } from "./actions";
import { Button } from "@/components/ui/Button";

const initial: ProofFormState = {};

const inputCls =
  "w-full rounded-xl border border-navy-200/70 bg-ivory/50 px-4 py-2.5 text-sm text-navy-700 placeholder:text-navy-400 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30 transition";

export function UploadProofForm({ slipId }: { slipId: string }) {
  const [state, action, pending] = useActionState(uploadPaymentProof, initial);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  if (state.ok) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
        <div className="flex items-center gap-2 font-semibold">
          <CheckCircle2 size={18} /> Screenshot uploaded
        </div>
        <p className="mt-1 text-emerald-700">{state.message}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="slipId" value={slipId} />

      {state.message && !state.ok && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">
          <AlertCircle size={16} /> {state.message}
        </div>
      )}

      <div>
        <span className="block text-sm font-medium text-navy-700 mb-1.5">
          UPI payment screenshot
        </span>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-navy-200 bg-ivory/50 px-4 py-8 text-center hover:border-gold-400 transition">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="max-h-48 rounded-lg shadow-sm" />
          ) : (
            <>
              <UploadCloud size={28} className="text-navy-400" />
              <span className="text-sm text-navy-500">
                Tap to choose your payment screenshot
              </span>
              <span className="text-xs text-navy-400">JPG, PNG or WebP · up to 5 MB</span>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            name="proof"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={onPick}
            required
          />
        </label>
        {preview && (
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              if (fileRef.current) fileRef.current.value = "";
            }}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-navy-500 hover:text-navy-700"
          >
            <ImageIcon size={13} /> Choose a different image
          </button>
        )}
      </div>

      <label className="block">
        <span className="block text-sm font-medium text-navy-700 mb-1.5">
          UPI reference / UTR number <span className="text-navy-400">(optional)</span>
        </span>
        <input name="txnRef" className={inputCls} placeholder="e.g. 4123 5567 8899" />
      </label>

      <Button type="submit" variant="gold" className="w-full" disabled={pending}>
        <UploadCloud size={16} /> {pending ? "Uploading…" : "Submit payment proof"}
      </Button>
    </form>
  );
}
