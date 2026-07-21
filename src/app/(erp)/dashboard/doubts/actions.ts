"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { notifyUser, notifyAdmins, notifyStudentAndParent } from "@/lib/notify";
import { saveImageUpload } from "@/lib/upload";

const askSchema = z.object({
  question: z.string().min(3, "Please describe your doubt").max(2000),
  subject: z.string().max(60).optional().or(z.literal("")),
  batchId: z.string().optional().or(z.literal("")),
});

export type DoubtFormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function askDoubt(
  _prev: DoubtFormState,
  formData: FormData
): Promise<DoubtFormState> {
  const user = await requireRole(["STUDENT"]);
  const parsed = askSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  const student = await prisma.student.findUnique({ where: { userId: user.id } });
  if (!student) return { ok: false, message: "Student profile not found." };

  // If a batch is chosen, confirm the student is enrolled in it.
  let batchId: string | null = null;
  if (d.batchId) {
    const enrolled = await prisma.enrollment.findFirst({
      where: { studentId: student.id, batchId: d.batchId },
      select: { id: true },
    });
    if (!enrolled) return { ok: false, message: "You're not enrolled in that batch." };
    batchId = d.batchId;
  }

  let image: string | null = null;
  const file = formData.get("image") as File | null;
  if (file && typeof file !== "string" && file.size > 0) {
    const saved = await saveImageUpload(file, "doubts", student.rollNo);
    if (!saved.ok) return { ok: false, message: saved.error };
    image = saved.url;
  }

  try {
    await prisma.doubt.create({
      data: {
        studentId: student.id,
        batchId,
        subject: d.subject || null,
        question: d.question,
        image,
      },
    });
  } catch {
    return { ok: false, message: "Could not submit your doubt. Try again." };
  }

  // Route to the batch's teacher if known, plus admins.
  if (batchId) {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { teacher: { include: { user: true } } },
    });
    if (batch?.teacher?.user.id) {
      await notifyUser(batch.teacher.user.id, {
        title: "New student doubt ❓",
        body: `${batch.name}: ${d.question.slice(0, 80)}`,
        href: "/dashboard/doubts",
      });
    }
  }
  await notifyAdmins({
    title: "New student doubt ❓",
    body: `${d.subject ? d.subject + " — " : ""}${d.question.slice(0, 80)}`,
    href: "/dashboard/doubts",
  });

  revalidatePath("/dashboard/doubts");
  return { ok: true, message: "Doubt submitted. Your teacher will respond soon." };
}

export async function answerDoubt(
  id: string,
  answer: string
): Promise<{ ok: boolean; message: string }> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  const text = answer.trim();
  if (text.length < 2) return { ok: false, message: "Please write an answer." };

  const doubt = await prisma.doubt.findUnique({ where: { id } });
  if (!doubt) return { ok: false, message: "Doubt not found." };

  // A teacher may answer doubts for their own batches (or unassigned ones).
  if (user.role === "TEACHER" && doubt.batchId) {
    const owns = await prisma.batch.findFirst({
      where: { id: doubt.batchId, teacher: { userId: user.id } },
      select: { id: true },
    });
    if (!owns) return { ok: false, message: "This doubt belongs to another teacher's batch." };
  }

  try {
    await prisma.doubt.update({
      where: { id },
      data: { answer: text, answeredById: user.id, answeredAt: new Date() },
    });
  } catch {
    return { ok: false, message: "Could not save the answer." };
  }

  await notifyStudentAndParent(doubt.studentId, {
    title: "Your doubt was answered ✅",
    body: text.slice(0, 90),
    href: "/dashboard/doubts",
  });

  revalidatePath("/dashboard/doubts");
  return { ok: true, message: "Answer sent to the student." };
}
