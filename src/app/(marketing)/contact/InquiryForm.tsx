"use client";

import { useActionState } from "react";
import { CheckCircle2, Send, AlertCircle } from "lucide-react";
import { submitInquiry, type InquiryState } from "./actions";
import { Button } from "@/components/ui/Button";

const initial: InquiryState = {};

const classOptions = [
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];

export function InquiryForm() {
  const [state, formAction, pending] = useActionState(submitInquiry, initial);

  if (state.ok) {
    return (
      <div className="rounded-2xl bg-white border border-navy-100 p-8 text-center shadow-[var(--shadow-card)]">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold-500/15 text-gold-600">
          <CheckCircle2 size={28} />
        </span>
        <h3 className="mt-4 font-serif text-2xl font-bold text-navy-700">
          Enquiry received!
        </h3>
        <p className="mt-2 text-navy-500">{state.message}</p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-2xl bg-white border border-navy-100 p-7 md:p-8 shadow-[var(--shadow-card)] space-y-5"
    >
      <div>
        <h3 className="font-serif text-2xl font-bold text-navy-700">
          Book an admission enquiry
        </h3>
        <p className="mt-1 text-sm text-navy-500">
          Fill this in and we'll call you back shortly.
        </p>
      </div>

      {state.message && !state.ok && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">
          <AlertCircle size={17} /> {state.message}
        </div>
      )}

      <Field label="Full name" error={state.errors?.name}>
        <input
          name="name"
          type="text"
          placeholder="Student or parent name"
          className={inputCls}
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Phone number" error={state.errors?.phone}>
          <input
            name="phone"
            type="tel"
            placeholder="10-digit mobile"
            className={inputCls}
          />
        </Field>
        <Field label="Email (optional)" error={state.errors?.email}>
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Class / Programme" error={state.errors?.className}>
        <select name="className" className={inputCls} defaultValue="">
          <option value="" disabled>
            Select a class
          </option>
          {classOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Message (optional)" error={state.errors?.message}>
        <textarea
          name="message"
          rows={3}
          placeholder="Anything you'd like us to know?"
          className={inputCls}
        />
      </Field>

      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={pending}>
        {pending ? "Sending…" : (<>Send enquiry <Send size={16} /></>)}
      </Button>
    </form>
  );
}

const inputCls =
  "w-full rounded-xl border border-navy-200/70 bg-ivory/50 px-4 py-3 text-sm text-navy-700 placeholder:text-navy-400 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30 transition";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-navy-700 mb-1.5">{label}</span>
      {children}
      {error?.[0] && <span className="mt-1 block text-xs text-red-600">{error[0]}</span>}
    </label>
  );
}
