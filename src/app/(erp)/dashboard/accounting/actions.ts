"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { INCOME_CATEGORIES } from "./categories";

const inr = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const schema = z.object({
  title: z.string().min(2, "Title is required").max(120),
  category: z.enum(INCOME_CATEGORIES),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  receivedAt: z.coerce.date().optional(),
  note: z.string().max(500).optional(),
});

export type IncomeFormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function addOtherIncome(
  _prev: IncomeFormState,
  formData: FormData
): Promise<IncomeFormState> {
  const user = await requireRole(["ADMIN"]);
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  let created;
  try {
    created = await prisma.otherIncome.create({
      data: {
        title: d.title,
        category: d.category,
        amount: d.amount,
        note: d.note?.trim() || null,
        receivedAt: d.receivedAt ?? new Date(),
        createdById: user.id,
      },
    });
  } catch {
    return { ok: false, message: "Could not save the income. Try again." };
  }

  await logAudit({
    actorId: user.id,
    actorName: user.name ?? "Admin",
    action: "INCOME_ADDED",
    entity: "OtherIncome",
    entityId: created.id,
    summary: `Recorded ${d.category.toLowerCase().replace("_", " ")} income "${d.title}" of ${inr(d.amount)}.`,
  });

  revalidatePath("/dashboard/accounting");
  revalidatePath("/dashboard/finance");
  return { ok: true, message: "Income recorded." };
}

export async function deleteOtherIncome(id: string): Promise<{ ok: boolean; message: string }> {
  const user = await requireRole(["ADMIN"]);
  let removed;
  try {
    removed = await prisma.otherIncome.delete({ where: { id } });
  } catch {
    return { ok: false, message: "Could not delete." };
  }
  await logAudit({
    actorId: user.id,
    actorName: user.name ?? "Admin",
    action: "INCOME_DELETED",
    entity: "OtherIncome",
    entityId: id,
    summary: `Deleted income "${removed.title}" of ${inr(removed.amount)}.`,
  });
  revalidatePath("/dashboard/accounting");
  revalidatePath("/dashboard/finance");
  return { ok: true, message: "Income deleted." };
}
