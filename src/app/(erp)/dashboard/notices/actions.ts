"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/rbac";

const noticeSchema = z.object({
  title: z.string().min(2, "Title is required").max(120),
  body: z.string().min(2, "Message is required").max(1000),
  audience: z.enum(["ALL", "STUDENTS", "PARENTS", "TEACHERS"]),
});

export type NoticeFormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function createNotice(
  _prev: NoticeFormState,
  formData: FormData
): Promise<NoticeFormState> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  const parsed = noticeSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  try {
    await prisma.notice.create({
      data: {
        title: d.title,
        body: d.body,
        audience: d.audience,
        authorId: user.id,
      },
    });
  } catch {
    return { ok: false, message: "Could not post notice." };
  }
  revalidatePath("/dashboard/notices");
  return { ok: true, message: "Notice posted." };
}

export async function deleteNotice(id: string) {
  await requireUser();
  await requireRole(["ADMIN", "TEACHER"]);
  await prisma.notice.delete({ where: { id } });
  revalidatePath("/dashboard/notices");
}
