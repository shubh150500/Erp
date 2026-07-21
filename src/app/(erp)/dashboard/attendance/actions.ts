"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import type { AttendanceStatus } from "@prisma/client";

export type MarkAttendanceResult = { ok: boolean; message: string };

export async function markAttendance(
  batchId: string,
  dateStr: string,
  records: { studentId: string; status: AttendanceStatus }[]
): Promise<MarkAttendanceResult> {
  await requireRole(["ADMIN", "TEACHER"]);

  const date = new Date(dateStr + "T00:00:00");
  if (isNaN(date.getTime())) return { ok: false, message: "Invalid date." };

  try {
    await prisma.$transaction(
      records.map((r) =>
        prisma.attendance.upsert({
          where: {
            studentId_batchId_date: {
              studentId: r.studentId,
              batchId,
              date,
            },
          },
          create: {
            studentId: r.studentId,
            batchId,
            date,
            status: r.status,
          },
          update: { status: r.status },
        })
      )
    );
  } catch {
    return { ok: false, message: "Could not save attendance." };
  }

  revalidatePath("/dashboard/attendance");
  return { ok: true, message: `Attendance saved for ${records.length} students.` };
}
