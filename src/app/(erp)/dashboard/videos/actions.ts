"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { notifyBatchStudents } from "@/lib/notify";

const schema = z.object({
  batchId: z.string().min(1, "Batch is required"),
  title: z.string().min(2, "Title is required").max(120),
  subject: z.string().max(60).optional().or(z.literal("")),
  url: z.string().url("Enter a valid video link (https://…)").max(500),
});

export type VideoFormState = {
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

export async function addVideo(
  _prev: VideoFormState,
  formData: FormData
): Promise<VideoFormState> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  if (!(await assertCanPost(user.id, user.role, d.batchId))) {
    return { ok: false, message: "You can't add a video to this batch." };
  }

  let video;
  try {
    video = await prisma.videoLecture.create({
      data: {
        batchId: d.batchId,
        title: d.title,
        subject: d.subject || null,
        url: d.url,
        createdById: user.id,
      },
      include: { batch: true },
    });
  } catch {
    return { ok: false, message: "Could not save the video. Try again." };
  }

  await notifyBatchStudents(d.batchId, {
    title: "New video lecture 🎬",
    body: `${video.batch.name}: ${video.title}`,
    href: "/dashboard/videos",
  });

  revalidatePath("/dashboard/videos");
  return { ok: true, message: `"${video.title}" added.` };
}

export async function deleteVideo(id: string): Promise<{ ok: boolean; message: string }> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  const video = await prisma.videoLecture.findUnique({ where: { id } });
  if (!video) return { ok: false, message: "Video not found." };
  if (!(await assertCanPost(user.id, user.role, video.batchId))) {
    return { ok: false, message: "You can't delete this video." };
  }
  await prisma.videoLecture.delete({ where: { id } });
  revalidatePath("/dashboard/videos");
  return { ok: true, message: "Video deleted." };
}
