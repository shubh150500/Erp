"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const examSchema = z.object({
  title: z.string().min(2, "Exam title is required").max(80),
  subject: z.string().min(1, "Subject is required").max(40),
  batchId: z.string().min(1, "Select a batch"),
  maxMarks: z.coerce.number().positive("Max marks must be > 0"),
  date: z.string().optional().or(z.literal("")),
});

export type ExamFormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function createExam(
  _prev: ExamFormState,
  formData: FormData
): Promise<ExamFormState> {
  await requireRole(["ADMIN", "TEACHER"]);
  const parsed = examSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  try {
    await prisma.exam.create({
      data: {
        title: d.title,
        subject: d.subject,
        batchId: d.batchId,
        maxMarks: d.maxMarks,
        ...(d.date ? { date: new Date(d.date + "T00:00:00") } : {}),
      },
    });
  } catch {
    return { ok: false, message: "Could not create exam." };
  }
  revalidatePath("/dashboard/exams");
  return { ok: true, message: `Exam "${d.title}" created.` };
}

export async function saveMarks(
  examId: string,
  entries: { studentId: string; score: number }[]
): Promise<{ ok: boolean; message: string }> {
  await requireRole(["ADMIN", "TEACHER"]);
  try {
    await prisma.$transaction(
      entries.map((e) =>
        prisma.mark.upsert({
          where: { examId_studentId: { examId, studentId: e.studentId } },
          create: { examId, studentId: e.studentId, score: e.score },
          update: { score: e.score },
        })
      )
    );
  } catch {
    return { ok: false, message: "Could not save marks." };
  }
  revalidatePath("/dashboard/exams");
  return { ok: true, message: `Saved marks for ${entries.length} students.` };
}
