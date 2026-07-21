"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { saveDocumentUpload } from "@/lib/upload";
import { EXPENSE_CATEGORIES } from "./categories";

const inr = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const schema = z.object({
  title: z.string().min(2, "Title is required").max(120),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  spentAt: z.coerce.date().optional(),
  note: z.string().max(500).optional(),
});

export type ExpenseFormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function addExpense(
  _prev: ExpenseFormState,
  formData: FormData
): Promise<ExpenseFormState> {
  const user = await requireRole(["ADMIN"]);
  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  // Optional invoice/bill upload (PDF or image).
  let invoiceImage: string | null = null;
  const file = formData.get("invoice") as File | null;
  if (file && typeof file !== "string" && file.size > 0) {
    const saved = await saveDocumentUpload(file, "invoices", d.category.toLowerCase());
    if (!saved.ok) return { ok: false, errors: { invoice: [saved.error] } };
    invoiceImage = saved.url;
  }

  let created;
  try {
    created = await prisma.expense.create({
      data: {
        title: d.title,
        category: d.category,
        amount: d.amount,
        note: d.note?.trim() || null,
        invoiceImage,
        spentAt: d.spentAt ?? new Date(),
        createdById: user.id,
      },
    });
  } catch {
    return { ok: false, message: "Could not save the expense. Try again." };
  }

  await logAudit({
    actorId: user.id,
    actorName: user.name ?? "Admin",
    action: "EXPENSE_ADDED",
    entity: "Expense",
    entityId: created.id,
    summary: `Added ${d.category.toLowerCase()} expense "${d.title}" of ${inr(d.amount)}.`,
  });

  revalidatePath("/dashboard/finance");
  return { ok: true, message: "Expense recorded." };
}

export async function deleteExpense(id: string): Promise<{ ok: boolean; message: string }> {
  const user = await requireRole(["ADMIN"]);
  let removed;
  try {
    removed = await prisma.expense.delete({ where: { id } });
  } catch {
    return { ok: false, message: "Could not delete." };
  }
  await logAudit({
    actorId: user.id,
    actorName: user.name ?? "Admin",
    action: "EXPENSE_DELETED",
    entity: "Expense",
    entityId: id,
    summary: `Deleted ${removed.category.toLowerCase()} expense "${removed.title}" of ${inr(removed.amount)}.`,
  });
  revalidatePath("/dashboard/finance");
  return { ok: true, message: "Expense deleted." };
}
