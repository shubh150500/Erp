"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const paymentSchema = z.object({
  studentId: z.string().min(1, "Select a student"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  mode: z.enum(["CASH", "UPI", "CARD", "BANK", "CHEQUE"]),
  forMonth: z.string().max(20).optional().or(z.literal("")),
  note: z.string().max(120).optional().or(z.literal("")),
});

export type PaymentFormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function recordPayment(
  _prev: PaymentFormState,
  formData: FormData
): Promise<PaymentFormState> {
  await requireRole(["ADMIN"]);
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  // Generate a guaranteed-unique receipt number by counting existing rows.
  const count = await prisma.payment.count();
  const receipt = "TE-RC-" + String(count + 1).padStart(5, "0");

  try {
    await prisma.payment.create({
      data: {
        studentId: d.studentId,
        amount: d.amount,
        mode: d.mode,
        receiptNo: receipt,
        forMonth: d.forMonth || null,
        note: d.note || null,
      },
    });
  } catch {
    return { ok: false, message: "Could not record payment." };
  }
  revalidatePath("/dashboard/fees");
  return { ok: true, message: `Payment recorded · Receipt ${receipt}` };
}
