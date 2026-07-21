"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { notifyAdmins, notifyUser, notifyStudentAndParent } from "@/lib/notify";

const schema = z.object({
  studentId: z.string().min(1, "Student is required"),
  slot: z.string().min(1, "Please pick a date & time"),
  note: z.string().max(300).optional().or(z.literal("")),
});

export type PtmFormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

async function canActFor(userId: string, role: string, studentId: string) {
  if (role === "STUDENT") {
    const me = await prisma.student.findUnique({ where: { userId } });
    return me?.id === studentId;
  }
  if (role === "PARENT") {
    const parent = await prisma.parent.findUnique({ where: { userId }, include: { children: true } });
    return !!parent?.children.some((c) => c.id === studentId);
  }
  return false;
}

export async function requestPtm(
  _prev: PtmFormState,
  formData: FormData
): Promise<PtmFormState> {
  const user = await requireRole(["PARENT", "STUDENT"]);
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  if (!(await canActFor(user.id, user.role, d.studentId))) {
    return { ok: false, message: "You can't book a meeting for this student." };
  }
  const slot = new Date(d.slot);

  let student;
  try {
    const b = await prisma.ptmBooking.create({
      data: { studentId: d.studentId, requestedById: user.id, slot, note: d.note || null },
    });
    student = await prisma.student.findUnique({ where: { id: b.studentId }, include: { user: true } });
  } catch {
    return { ok: false, message: "Could not book the meeting. Try again." };
  }

  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER", teacher: { batches: { some: { enrollments: { some: { studentId: d.studentId } } } } } },
    select: { id: true },
  });
  for (const t of teachers) {
    await notifyUser(t.id, {
      title: "PTM request 🤝",
      body: `${student?.user.name} · ${slot.toLocaleString("en-IN")}`,
      href: "/dashboard/ptm",
    });
  }
  await notifyAdmins({
    title: "PTM request 🤝",
    body: `${student?.user.name} · ${slot.toLocaleString("en-IN")}`,
    href: "/dashboard/ptm",
  });

  revalidatePath("/dashboard/ptm");
  return { ok: true, message: "Meeting request sent." };
}

export async function decidePtm(
  id: string,
  decision: "APPROVED" | "REJECTED"
): Promise<{ ok: boolean; message: string }> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  const b = await prisma.ptmBooking.findUnique({ where: { id } });
  if (!b) return { ok: false, message: "Booking not found." };
  if (b.status !== "PENDING") return { ok: false, message: "Already decided." };

  if (user.role === "TEACHER") {
    const owns = await prisma.student.findFirst({
      where: { id: b.studentId, enrollments: { some: { batch: { teacher: { userId: user.id } } } } },
      select: { id: true },
    });
    if (!owns) return { ok: false, message: "This student isn't in your batches." };
  }

  await prisma.ptmBooking.update({
    where: { id },
    data: { status: decision, decidedById: user.id },
  });

  await notifyStudentAndParent(b.studentId, {
    title: decision === "APPROVED" ? "PTM confirmed ✅" : "PTM declined",
    body: `Meeting on ${b.slot.toLocaleString("en-IN")} was ${decision === "APPROVED" ? "confirmed" : "declined"}.`,
    href: "/dashboard/ptm",
  });

  revalidatePath("/dashboard/ptm");
  return { ok: true, message: `Meeting ${decision === "APPROVED" ? "confirmed" : "declined"}.` };
}
