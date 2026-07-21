"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const schema = z.object({
  batchId: z.string().min(1, "Batch is required"),
  topic: z.string().min(2, "Topic is required").max(160),
  subject: z.string().max(60).optional().or(z.literal("")),
  objective: z.string().max(500).optional().or(z.literal("")),
  plannedDate: z.string().optional().or(z.literal("")),
});

export type LessonFormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

/** Ensure a teacher owns the batch (admins can manage any). */
async function assertCanManage(userId: string, role: string, batchId: string) {
  if (role === "ADMIN") return true;
  const batch = await prisma.batch.findFirst({
    where: { id: batchId, teacher: { userId } },
    select: { id: true },
  });
  return !!batch;
}

export async function createLessonPlan(
  _prev: LessonFormState,
  formData: FormData
): Promise<LessonFormState> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  if (!(await assertCanManage(user.id, user.role, d.batchId))) {
    return { ok: false, message: "You can't plan lessons for this batch." };
  }

  try {
    await prisma.lessonPlan.create({
      data: {
        batchId: d.batchId,
        topic: d.topic,
        subject: d.subject || null,
        objective: d.objective || null,
        plannedDate: d.plannedDate ? new Date(d.plannedDate) : null,
        createdById: user.id,
      },
    });
  } catch {
    return { ok: false, message: "Could not save the lesson plan. Try again." };
  }

  revalidatePath("/dashboard/lessons");
  return { ok: true, message: "Lesson plan added." };
}

/** Mark a planned lesson as taught (with an optional teaching-log note), or reopen it. */
export async function setLessonDone(
  id: string,
  done: boolean,
  logNote?: string
): Promise<{ ok: boolean; message: string }> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  const lesson = await prisma.lessonPlan.findUnique({ where: { id } });
  if (!lesson) return { ok: false, message: "Lesson not found." };
  if (!(await assertCanManage(user.id, user.role, lesson.batchId))) {
    return { ok: false, message: "You can't update this lesson." };
  }

  await prisma.lessonPlan.update({
    where: { id },
    data: done
      ? { status: "DONE", completedAt: new Date(), logNote: logNote?.trim() || null }
      : { status: "PLANNED", completedAt: null, logNote: null },
  });

  revalidatePath("/dashboard/lessons");
  return { ok: true, message: done ? "Marked as taught." : "Reopened." };
}

export async function deleteLessonPlan(id: string): Promise<{ ok: boolean; message: string }> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  const lesson = await prisma.lessonPlan.findUnique({ where: { id } });
  if (!lesson) return { ok: false, message: "Lesson not found." };
  if (!(await assertCanManage(user.id, user.role, lesson.batchId))) {
    return { ok: false, message: "You can't delete this lesson." };
  }
  await prisma.lessonPlan.delete({ where: { id } });
  revalidatePath("/dashboard/lessons");
  return { ok: true, message: "Lesson deleted." };
}
