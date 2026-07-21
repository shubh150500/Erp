"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const studentSchema = z.object({
  name: z.string().min(2, "Enter the student's name").max(80),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rollNo: z.string().min(1, "Roll number is required").max(20),
  className: z.string().min(1, "Class is required"),
  phone: z.string().max(15).optional().or(z.literal("")),
  guardianName: z.string().max(80).optional().or(z.literal("")),
  batchId: z.string().optional().or(z.literal("")),
});

export type StudentFormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function createStudent(
  _prev: StudentFormState,
  formData: FormData
): Promise<StudentFormState> {
  await requireRole(["ADMIN"]);

  const parsed = studentSchema.safeParse(
    Object.fromEntries(formData.entries())
  );
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  const email = d.email.toLowerCase().trim();

  const [emailTaken, rollTaken] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.student.findUnique({ where: { rollNo: d.rollNo } }),
  ]);
  if (emailTaken) return { ok: false, message: "That email is already registered." };
  if (rollTaken) return { ok: false, message: "That roll number already exists." };

  const passwordHash = await bcrypt.hash(d.password, 10);

  try {
    await prisma.user.create({
      data: {
        email,
        name: d.name,
        passwordHash,
        role: "STUDENT",
        phone: d.phone || null,
        student: {
          create: {
            rollNo: d.rollNo,
            className: d.className,
            guardianName: d.guardianName || null,
            ...(d.batchId
              ? { enrollments: { create: { batchId: d.batchId } } }
              : {}),
          },
        },
      },
    });
  } catch {
    return { ok: false, message: "Could not create the student. Try again." };
  }

  revalidatePath("/dashboard/students");
  return { ok: true, message: `${d.name} added successfully.` };
}

const transferSchema = z.object({
  studentId: z.string().min(1),
  toBatchId: z.string().min(1, "Choose a batch to transfer to"),
  fromBatchId: z.string().optional().or(z.literal("")), // "" => just add the new enrolment
});

export async function transferBatch(
  _prev: StudentFormState,
  formData: FormData
): Promise<StudentFormState> {
  await requireRole(["ADMIN"]);
  const parsed = transferSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const { studentId, toBatchId, fromBatchId } = parsed.data;

  if (fromBatchId && fromBatchId === toBatchId) {
    return { ok: false, message: "Source and destination batches are the same." };
  }

  const already = await prisma.enrollment.findUnique({
    where: { studentId_batchId: { studentId, batchId: toBatchId } },
    select: { id: true },
  });
  if (already) return { ok: false, message: "Student is already enrolled in that batch." };

  try {
    await prisma.$transaction(async (tx) => {
      if (fromBatchId) {
        await tx.enrollment.deleteMany({ where: { studentId, batchId: fromBatchId } });
      }
      await tx.enrollment.create({ data: { studentId, batchId: toBatchId } });
    });
  } catch {
    return { ok: false, message: "Could not transfer. Try again." };
  }

  revalidatePath("/dashboard/students");
  return { ok: true, message: fromBatchId ? "Student transferred." : "Student enrolled in batch." };
}
