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
  subject: z.string().max(60).optional().or(z.literal("")),
});

export type MaterialFormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

async function assertCanPost(userId: string, role: string, batchId: string) {
  if (role === "ADMIN") return true;
  const batch = await prisma.batch.findFirst({
    where: { id: batchId, teacher: { userId } },
    select: { id: true },
  });
  return !!batch;
}

export async function uploadMaterial(
  _prev: MaterialFormState,
  formData: FormData
): Promise<MaterialFormState> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  if (!(await assertCanPost(user.id, user.role, d.batchId))) {
    return { ok: false, message: "You can't upload material to this batch." };
  }

  const file = formData.get("file") as File | null;
  if (!file || typeof file === "string" || file.size === 0) {
    return { ok: false, message: "Please choose a PDF or image to upload." };
  }
  const saved = await saveDocumentUpload(file, "materials", d.title.slice(0, 20));
  if (!saved.ok) return { ok: false, message: saved.error };

  let mat;
  try {
    mat = await prisma.studyMaterial.create({
      data: {
        batchId: d.batchId,
        title: d.title,
        subject: d.subject || null,
        fileUrl: saved.url,
        fileName: file.name,
        uploadedById: user.id,
      },
      include: { batch: true },
    });
  } catch {
    return { ok: false, message: "Could not save the material. Try again." };
  }

  await notifyBatchStudents(d.batchId, {
    title: "New study material 📄",
    body: `${mat.batch.name}: ${mat.title}`,
    href: "/dashboard/materials",
  });

  revalidatePath("/dashboard/materials");
  return { ok: true, message: `"${mat.title}" uploaded.` };
}

export async function deleteMaterial(id: string): Promise<{ ok: boolean; message: string }> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  const mat = await prisma.studyMaterial.findUnique({ where: { id } });
  if (!mat) return { ok: false, message: "Material not found." };
  if (!(await assertCanPost(user.id, user.role, mat.batchId))) {
    return { ok: false, message: "You can't delete this material." };
  }
  await prisma.studyMaterial.delete({ where: { id } });
  revalidatePath("/dashboard/materials");
  return { ok: true, message: "Material deleted." };
}
