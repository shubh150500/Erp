"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { notifyBatches } from "@/lib/notify";
import { manageableBatches } from "@/lib/dal";

const schema = z.object({
  batchId: z.string().optional().or(z.literal("")), // "" / "ALL" => all of sender's batches
  title: z.string().min(2, "Title is required").max(120),
  body: z.string().min(2, "Message is required").max(1000),
  audience: z.enum(["STUDENTS", "PARENTS", "BOTH"]),
});

export type BroadcastFormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function sendBroadcast(
  _prev: BroadcastFormState,
  formData: FormData
): Promise<BroadcastFormState> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  const batches = await manageableBatches(user.id, user.role);
  if (batches.length === 0) {
    return { ok: false, message: "You have no batches to message." };
  }

  const toAll = !d.batchId || d.batchId === "ALL";
  const target = toAll ? null : batches.find((b) => b.id === d.batchId);
  if (!toAll && !target) {
    return { ok: false, message: "You can't message this batch." };
  }

  const batchIds = toAll ? batches.map((b) => b.id) : [target!.id];
  const batchName = toAll ? "All my batches" : target!.name;

  let recipientCount = 0;
  try {
    recipientCount = await notifyBatches(batchIds, d.audience, {
      title: `📣 ${d.title}`,
      body: d.body,
      href: "/dashboard/notifications",
    });

    await prisma.broadcastMessage.create({
      data: {
        title: d.title,
        body: d.body,
        batchId: toAll ? null : target!.id,
        batchName,
        audience: d.audience,
        recipientCount,
        sentById: user.id,
      },
    });
  } catch {
    return { ok: false, message: "Could not send the message. Try again." };
  }

  revalidatePath("/dashboard/messages");
  return {
    ok: true,
    message:
      recipientCount === 0
        ? "Saved, but no recipients matched (no enrolled students/parents)."
        : `Sent to ${recipientCount} recipient${recipientCount === 1 ? "" : "s"}.`,
  };
}

export async function deleteBroadcast(id: string): Promise<{ ok: boolean; message: string }> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  const msg = await prisma.broadcastMessage.findUnique({ where: { id } });
  if (!msg) return { ok: false, message: "Message not found." };
  if (user.role !== "ADMIN" && msg.sentById !== user.id) {
    return { ok: false, message: "You can only delete your own messages." };
  }
  await prisma.broadcastMessage.delete({ where: { id } });
  revalidatePath("/dashboard/messages");
  return { ok: true, message: "Removed from history." };
}
