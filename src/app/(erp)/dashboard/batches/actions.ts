"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const batchSchema = z.object({
  name: z.string().min(2, "Batch name is required").max(60),
  year: z.string().min(1, "Year is required").max(20),
  courseId: z.string().min(1, "Select a course"),
  teacherId: z.string().optional().or(z.literal("")),
  feeAmount: z.coerce.number().min(0, "Fee can't be negative"),
});

export type BatchFormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function createBatch(
  _prev: BatchFormState,
  formData: FormData
): Promise<BatchFormState> {
  await requireRole(["ADMIN"]);
  const parsed = batchSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  try {
    await prisma.batch.create({
      data: {
        name: d.name,
        year: d.year,
        courseId: d.courseId,
        teacherId: d.teacherId || null,
        feeAmount: d.feeAmount,
      },
    });
  } catch {
    return { ok: false, message: "Could not create batch." };
  }
  revalidatePath("/dashboard/batches");
  return { ok: true, message: `Batch "${d.name}" created.` };
}
