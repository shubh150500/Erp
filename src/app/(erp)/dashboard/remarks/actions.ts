"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { notifyStudentAndParent } from "@/lib/notify";

const schema = z.object({
  studentId: z.string().min(1, "Student is required"),
  body: z.string().min(2, "Remark is required").max(1000),
});

export type RemarkFormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function createRemark(
  _prev: RemarkFormState,
  formData: FormData
): Promise<RemarkFormState> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  if (user.role === "TEACHER") {
    const inBatch = await prisma.student.findFirst({
      where: { id: d.studentId, enrollments: { some: { batch: { teacher: { userId: user.id } } } } },
      select: { id: true },
    });
    if (!inBatch) return { ok: false, message: "That student isn't in your batches." };
  }

  try {
    await prisma.remark.create({
      data: { studentId: d.studentId, teacherId: user.id, body: d.body },
    });
  } catch {
    return { ok: false, message: "Could not save the remark. Try again." };
  }

  await notifyStudentAndParent(d.studentId, {
    title: "New teacher remark 📝",
    body: d.body.slice(0, 90),
    href: "/dashboard/remarks",
  });

  revalidatePath("/dashboard/remarks");
  return { ok: true, message: "Remark added." };
}
