import { prisma } from "@/lib/prisma";

type NotifyInput = { title: string; body: string; href?: string };

/** Create an in-app notification for a single user. */
export async function notifyUser(userId: string, n: NotifyInput) {
  await prisma.notification.create({
    data: { userId, title: n.title, body: n.body, href: n.href ?? null },
  });
}

/** Notify a student (and their linked parent, if any). */
export async function notifyStudentAndParent(studentId: string, n: NotifyInput) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true, parent: { include: { user: true } } },
  });
  if (!student) return;

  const targets = new Set<string>();
  targets.add(student.user.id);
  if (student.parent?.user.id) targets.add(student.parent.user.id);

  await prisma.notification.createMany({
    data: [...targets].map((userId) => ({
      userId,
      title: n.title,
      body: n.body,
      href: n.href ?? null,
    })),
  });
}

/** Notify every student enrolled in a batch (e.g. new homework or material). */
export async function notifyBatchStudents(batchId: string, n: NotifyInput) {
  const enrollments = await prisma.enrollment.findMany({
    where: { batchId },
    include: { student: { include: { user: true } } },
  });
  const userIds = [...new Set(enrollments.map((e) => e.student.user.id))];
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      title: n.title,
      body: n.body,
      href: n.href ?? null,
    })),
  });
}

/**
 * Notify the students of one or more batches, optionally their parents too.
 * Returns the number of distinct users notified (for sent-history logging).
 */
export async function notifyBatches(
  batchIds: string[],
  audience: "STUDENTS" | "PARENTS" | "BOTH",
  n: NotifyInput
): Promise<number> {
  if (batchIds.length === 0) return 0;
  const enrollments = await prisma.enrollment.findMany({
    where: { batchId: { in: batchIds } },
    include: { student: { include: { user: true, parent: { include: { user: true } } } } },
  });

  const targets = new Set<string>();
  for (const e of enrollments) {
    if (audience === "STUDENTS" || audience === "BOTH") {
      targets.add(e.student.user.id);
    }
    if (audience === "PARENTS" || audience === "BOTH") {
      const parentUserId = e.student.parent?.user.id;
      if (parentUserId) targets.add(parentUserId);
    }
  }
  if (targets.size === 0) return 0;

  await prisma.notification.createMany({
    data: [...targets].map((userId) => ({
      userId,
      title: n.title,
      body: n.body,
      href: n.href ?? null,
    })),
  });
  return targets.size;
}

/** Notify all admins (e.g. when a new slip is generated). */
export async function notifyAdmins(n: NotifyInput) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  if (admins.length === 0) return;
  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      title: n.title,
      body: n.body,
      href: n.href ?? null,
    })),
  });
}
