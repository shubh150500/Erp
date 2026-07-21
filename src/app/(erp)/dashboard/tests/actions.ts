"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { notifyBatchStudents } from "@/lib/notify";

const schema = z.object({
  batchId: z.string().min(1, "Select a batch"),
  title: z.string().min(2, "Test title is required").max(80),
  subject: z.string().min(1, "Subject is required").max(40),
  maxMarks: z.coerce.number().positive("Max marks must be > 0"),
  date: z.string().min(1, "Pick a date"),
  syllabus: z.string().max(1000).optional().or(z.literal("")),
});

export type TestFormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

/** Ensure a teacher owns the batch (admins can schedule for any). */
async function assertCanManage(userId: string, role: string, batchId: string) {
  if (role === "ADMIN") return true;
  const batch = await prisma.batch.findFirst({
    where: { id: batchId, teacher: { userId } },
    select: { id: true },
  });
  return !!batch;
}

export async function scheduleTest(
  _prev: TestFormState,
  formData: FormData
): Promise<TestFormState> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  if (!(await assertCanManage(user.id, user.role, d.batchId))) {
    return { ok: false, message: "You can't schedule tests for this batch." };
  }

  let exam;
  try {
    exam = await prisma.exam.create({
      data: {
        title: d.title,
        subject: d.subject,
        batchId: d.batchId,
        maxMarks: d.maxMarks,
        date: new Date(d.date + "T00:00:00"),
        syllabus: d.syllabus?.trim() || null,
      },
      include: { batch: true },
    });
  } catch {
    return { ok: false, message: "Could not schedule the test. Try again." };
  }

  await notifyBatchStudents(d.batchId, {
    title: "New test scheduled 📝",
    body: `${exam.subject}: ${exam.title} on ${exam.date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
    href: "/dashboard/tests",
  });

  revalidatePath("/dashboard/tests");
  revalidatePath("/dashboard/exams");
  return { ok: true, message: `Test "${d.title}" scheduled.` };
}

export async function deleteTest(id: string): Promise<{ ok: boolean; message: string }> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  const exam = await prisma.exam.findUnique({ where: { id }, select: { batchId: true } });
  if (!exam) return { ok: false, message: "Test not found." };
  if (!(await assertCanManage(user.id, user.role, exam.batchId))) {
    return { ok: false, message: "You can't delete this test." };
  }
  await prisma.exam.delete({ where: { id } });
  revalidatePath("/dashboard/tests");
  revalidatePath("/dashboard/exams");
  return { ok: true, message: "Test removed." };
}
