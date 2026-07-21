"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { notifyAdmins, notifyUser, notifyStudentAndParent } from "@/lib/notify";

const schema = z.object({
  studentId: z.string().min(1, "Student is required"),
  fromDate: z.string().min(1, "From date is required"),
  toDate: z.string().min(1, "To date is required"),
  reason: z.string().min(3, "Reason is required").max(500),
});

export type LeaveFormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

/** Verify the requester may act for this student. */
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

export async function applyLeave(
  _prev: LeaveFormState,
  formData: FormData
): Promise<LeaveFormState> {
  const user = await requireRole(["STUDENT", "PARENT"]);
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  if (!(await canActFor(user.id, user.role, d.studentId))) {
    return { ok: false, message: "You can't apply leave for this student." };
  }
  const from = new Date(d.fromDate);
  const to = new Date(d.toDate);
  if (to < from) return { ok: false, message: "End date can't be before start date." };

  let student;
  try {
    const leave = await prisma.leaveApplication.create({
      data: {
        studentId: d.studentId,
        raisedById: user.id,
        fromDate: from,
        toDate: to,
        reason: d.reason,
      },
    });
    student = await prisma.student.findUnique({ where: { id: leave.studentId }, include: { user: true } });
  } catch {
    return { ok: false, message: "Could not submit the application. Try again." };
  }

  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER", teacher: { batches: { some: { enrollments: { some: { studentId: d.studentId } } } } } },
    select: { id: true },
  });
  for (const t of teachers) {
    await notifyUser(t.id, {
      title: "Leave application 🗓️",
      body: `${student?.user.name}: ${d.reason.slice(0, 60)}`,
      href: "/dashboard/leave",
    });
  }
  await notifyAdmins({
    title: "Leave application 🗓️",
    body: `${student?.user.name}: ${d.reason.slice(0, 60)}`,
    href: "/dashboard/leave",
  });

  revalidatePath("/dashboard/leave");
  return { ok: true, message: "Leave application submitted." };
}

export async function decideLeave(
  id: string,
  decision: "APPROVED" | "REJECTED"
): Promise<{ ok: boolean; message: string }> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  const leave = await prisma.leaveApplication.findUnique({ where: { id } });
  if (!leave) return { ok: false, message: "Application not found." };
  if (leave.status !== "PENDING") return { ok: false, message: "Already decided." };

  if (user.role === "TEACHER") {
    const owns = await prisma.student.findFirst({
      where: { id: leave.studentId, enrollments: { some: { batch: { teacher: { userId: user.id } } } } },
      select: { id: true },
    });
    if (!owns) return { ok: false, message: "This student isn't in your batches." };
  }

  await prisma.leaveApplication.update({
    where: { id },
    data: { status: decision, decidedById: user.id, decidedAt: new Date() },
  });

  await notifyStudentAndParent(leave.studentId, {
    title: decision === "APPROVED" ? "Leave approved ✅" : "Leave rejected",
    body: `Your leave from ${leave.fromDate.toLocaleDateString("en-IN")} to ${leave.toDate.toLocaleDateString("en-IN")} was ${decision.toLowerCase()}.`,
    href: "/dashboard/leave",
  });

  revalidatePath("/dashboard/leave");
  return { ok: true, message: `Leave ${decision.toLowerCase()}.` };
}
