"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { notifyAdmins, notifyUser } from "@/lib/notify";

const schema = z.object({
  category: z.enum(["COMPLAINT", "SUGGESTION"]),
  subject: z.string().min(2, "Subject is required").max(120),
  body: z.string().min(3, "Please add some detail").max(2000),
});

export type ComplaintFormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function submitComplaint(
  _prev: ComplaintFormState,
  formData: FormData
): Promise<ComplaintFormState> {
  const user = await requireRole(["STUDENT", "PARENT"]);
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  try {
    await prisma.complaint.create({
      data: { userId: user.id, category: d.category, subject: d.subject, body: d.body },
    });
  } catch {
    return { ok: false, message: "Could not submit. Try again." };
  }

  await notifyAdmins({
    title: d.category === "SUGGESTION" ? "New suggestion 💡" : "New complaint 📣",
    body: d.subject,
    href: "/dashboard/complaints",
  });

  revalidatePath("/dashboard/complaints");
  return { ok: true, message: "Submitted. The office will review it." };
}

export async function respondComplaint(
  id: string,
  response: string
): Promise<{ ok: boolean; message: string }> {
  await requireRole(["ADMIN"]);
  const text = response.trim();
  if (text.length < 2) return { ok: false, message: "Please write a response." };

  const c = await prisma.complaint.findUnique({ where: { id } });
  if (!c) return { ok: false, message: "Not found." };

  await prisma.complaint.update({
    where: { id },
    data: { response: text, status: "RESOLVED" },
  });

  await notifyUser(c.userId, {
    title: "Your submission was addressed ✅",
    body: `"${c.subject}" — ${text.slice(0, 80)}`,
    href: "/dashboard/complaints",
  });

  revalidatePath("/dashboard/complaints");
  return { ok: true, message: "Response sent." };
}
