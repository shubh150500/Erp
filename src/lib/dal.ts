import { prisma } from "@/lib/prisma";

/** Attendance percentage for a student across all records. */
export async function attendancePct(studentId: string) {
  const [total, present] = await Promise.all([
    prisma.attendance.count({ where: { studentId } }),
    prisma.attendance.count({
      where: { studentId, status: { in: ["PRESENT", "LATE"] } },
    }),
  ]);
  return total === 0 ? null : Math.round((present / total) * 100);
}

/** Total fee due for a student = sum(batch fees enrolled) - sum(payments). */
export async function feeSummary(studentId: string) {
  const [enrollments, paidAgg] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId },
      include: { batch: true },
    }),
    prisma.payment.aggregate({
      where: { studentId },
      _sum: { amount: true },
    }),
  ]);
  const billed = enrollments.reduce((sum, e) => sum + e.batch.feeAmount, 0);
  const paid = paidAgg._sum.amount ?? 0;
  return { billed, paid, due: Math.max(0, billed - paid) };
}

/** Resolve the Student row for a logged-in student user. */
export function studentByUser(userId: string) {
  return prisma.student.findUnique({
    where: { userId },
    include: { user: true, enrollments: { include: { batch: true } } },
  });
}

/** Children for a parent user. */
export async function childrenByParentUser(userId: string) {
  const parent = await prisma.parent.findUnique({
    where: { userId },
    include: {
      children: { include: { user: true } },
    },
  });
  return parent?.children ?? [];
}

/** Report card rows (exam + score) for a student. */
export function marksByStudent(studentId: string) {
  return prisma.mark.findMany({
    where: { studentId },
    include: { exam: true },
    orderBy: { exam: { date: "desc" } },
  });
}

/** Fee slips for one or more students (student/parent view). */
export function slipsForStudents(studentIds: string[]) {
  return prisma.feeSlip.findMany({
    where: { studentId: { in: studentIds } },
    include: { student: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export type SlipFilters = {
  status?: "PENDING" | "PAID" | "REJECTED";
  className?: string;
  batchId?: string;
  date?: string; // yyyy-mm-dd
};

/** All fee slips with optional filters (admin view). */
export function allSlips(filters: SlipFilters = {}) {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.className) where.student = { className: filters.className };
  if (filters.batchId)
    where.student = {
      ...(where.student as object),
      enrollments: { some: { batchId: filters.batchId } },
    };
  if (filters.date) {
    const start = new Date(filters.date + "T00:00:00");
    const end = new Date(filters.date + "T23:59:59");
    where.createdAt = { gte: start, lte: end };
  }
  return prisma.feeSlip.findMany({
    where,
    include: {
      student: {
        include: { user: true, enrollments: { include: { batch: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Batches a teacher/admin can post to (teacher: own batches; admin: all). */
export function manageableBatches(userId: string, role: string) {
  return prisma.batch.findMany({
    where: role === "TEACHER" ? { teacher: { userId } } : {},
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

/** Batch ids a student is enrolled in. */
export async function studentBatchIds(studentId: string) {
  const rows = await prisma.enrollment.findMany({
    where: { studentId },
    select: { batchId: true },
  });
  return rows.map((r) => r.batchId);
}

/** Flattened mark rows (with % score) for a student, oldest first. */
export async function performanceData(studentId: string) {
  const marks = await prisma.mark.findMany({
    where: { studentId },
    include: { exam: true },
    orderBy: { exam: { date: "asc" } },
  });
  return marks.map((m) => ({
    pct: m.exam.maxMarks > 0 ? (m.score / m.exam.maxMarks) * 100 : 0,
    subject: m.exam.subject,
    date: m.exam.date,
    title: m.exam.title,
    score: m.score,
    max: m.exam.maxMarks,
  }));
}

/** A student's rank within their batch by average exam %. */
export async function rankInBatch(studentId: string) {
  const enr = await prisma.enrollment.findFirst({
    where: { studentId },
    select: { batchId: true },
  });
  if (!enr) return null;

  const peers = await prisma.enrollment.findMany({
    where: { batchId: enr.batchId },
    select: { studentId: true },
  });
  const ids = [...new Set(peers.map((p) => p.studentId))];

  const avgs = await Promise.all(
    ids.map(async (id) => {
      const marks = await prisma.mark.findMany({
        where: { studentId: id },
        include: { exam: true },
      });
      const pcts = marks.map((m) => (m.exam.maxMarks > 0 ? (m.score / m.exam.maxMarks) * 100 : 0));
      const avg = pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : 0;
      return { id, avg, count: pcts.length };
    })
  );
  const ranked = avgs.filter((a) => a.count > 0).sort((a, b) => b.avg - a.avg);
  const pos = ranked.findIndex((a) => a.id === studentId);
  return pos >= 0 ? { rank: pos + 1, total: ranked.length } : null;
}

/** Unread notification count + recent list for a user. */
export async function notificationsFor(userId: string) {
  const [unread, items] = await Promise.all([
    prisma.notification.count({ where: { userId, read: false } }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);
  return { unread, items };
}
