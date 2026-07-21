"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import type { AttendanceStatus } from "@prisma/client";

export type MarkResult = { ok: boolean; message: string };

export async function markTeacherAttendance(
  dateStr: string,
  records: { teacherId: string; status: AttendanceStatus }[]
): Promise<MarkResult> {
  await requireRole(["ADMIN"]);

  const date = new Date(dateStr + "T00:00:00");
  if (isNaN(date.getTime())) return { ok: false, message: "Invalid date." };
  if (records.length === 0) return { ok: false, message: "No staff to mark." };

  try {
    await prisma.$transaction(
      records.map((r) =>
        prisma.teacherAttendance.upsert({
          where: { teacherId_date: { teacherId: r.teacherId, date } },
          create: { teacherId: r.teacherId, date, status: r.status },
          update: { status: r.status },
        })
      )
    );
  } catch {
    return { ok: false, message: "Could not save attendance." };
  }

  revalidatePath("/dashboard/staff-attendance");
  return { ok: true, message: `Attendance saved for ${records.length} staff.` };
}
