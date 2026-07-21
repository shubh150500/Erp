"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { notifyBatchStudents } from "@/lib/notify";
import { saveDocumentUpload } from "@/lib/upload";

const schema = z.object({
  batchId: z.string().min(1, "Batch is required"),
  title: z.string().min(2, "Title is required").max(120),
  details: z.string().min(2, "Details are required").max(2000),
  subject: z.string().max(60).optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
});

export type HomeworkFormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

/** Ensure a teacher owns the batch (admins can post to any). */
async function assertCanPost(userId: string, role: string, batchId: string) {
  if (role === "ADMIN") return true;
  const batch = await prisma.batch.findFirst({
    where: { id: batchId, teacher: { userId } },
    select: { id: true },
  });
  return !!batch;
}

export async function createHomework(
  _prev: HomeworkFormState,
  formData: FormData
): Promise<HomeworkFormState> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  if (!(await assertCanPost(user.id, user.role, d.batchId))) {
    return { ok: false, message: "You can't post homework to this batch." };
  }

  let attachment: string | null = null;
  const file = formData.get("attachment") as File | null;
  if (file && typeof file !== "string" && file.size > 0) {
    const saved = await saveDocumentUpload(file, "homework", d.title.slice(0, 20));
    if (!saved.ok) return { ok: false, message: saved.error };
    attachment = saved.url;
  }

  let hw;
  try {
    hw = await prisma.homework.create({
      data: {
        batchId: d.batchId,
        title: d.title,
        details: d.details,
        subject: d.subject || null,
        dueDate: d.dueDate ? new Date(d.dueDate) : null,
        attachment,
        createdById: user.id,
      },
      include: { batch: true },
    });
  } catch {
    return { ok: false, message: "Could not create homework. Try again." };
  }

  await notifyBatchStudents(d.batchId, {
    title: "New homework 📘",
    body: `${hw.batch.name}: ${hw.title}${hw.dueDate ? ` (due ${hw.dueDate.toLocaleDateString("en-IN")})` : ""}`,
    href: "/dashboard/homework",
  });

  revalidatePath("/dashboard/homework");
  return { ok: true, message: `Homework "${hw.title}" posted.` };
}

export async function deleteHomework(id: string): Promise<{ ok: boolean; message: string }> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  const hw = await prisma.homework.findUnique({ where: { id } });
  if (!hw) return { ok: false, message: "Homework not found." };
  if (!(await assertCanPost(user.id, user.role, hw.batchId))) {
    return { ok: false, message: "You can't delete this homework." };
  }
  await prisma.homework.delete({ where: { id } });
  revalidatePath("/dashboard/homework");
  return { ok: true, message: "Homework deleted." };
}
