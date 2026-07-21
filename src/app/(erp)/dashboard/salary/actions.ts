"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { notifyUser } from "@/lib/notify";
import { logAudit } from "@/lib/audit";

const inr = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const setSalarySchema = z.object({
  teacherId: z.string().min(1),
  monthlySalary: z.coerce.number().min(0, "Salary can't be negative"),
  designation: z.string().max(80).optional().or(z.literal("")),
  joinDate: z.string().optional().or(z.literal("")),
  bankName: z.string().max(80).optional().or(z.literal("")),
  bankAccount: z.string().max(40).optional().or(z.literal("")),
  ifsc: z.string().max(20).optional().or(z.literal("")),
});

const paySchema = z.object({
  teacherId: z.string().min(1),
  gross: z.coerce.number().min(0, "Gross can't be negative"),
  bonus: z.coerce.number().min(0).default(0),
  deductions: z.coerce.number().min(0).default(0),
  advance: z.coerce.number().min(0).default(0),
  paidAmount: z.coerce.number().min(0).default(0),
  forMonth: z.string().regex(/^\d{4}-\d{2}$/, "Pick a month"),
  mode: z.enum(["CASH", "UPI", "CARD", "BANK", "CHEQUE"]),
  note: z.string().max(300).optional().or(z.literal("")),
});

export type SalaryFormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function setTeacherSalary(
  _prev: SalaryFormState,
  formData: FormData
): Promise<SalaryFormState> {
  const admin = await requireRole(["ADMIN"]);
  const parsed = setSalarySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const { teacherId, monthlySalary, designation, joinDate, bankName, bankAccount, ifsc } = parsed.data;

  let teacher;
  try {
    teacher = await prisma.teacher.update({
      where: { id: teacherId },
      data: {
        monthlySalary,
        designation: designation?.trim() || null,
        joinDate: joinDate ? new Date(joinDate) : null,
        bankName: bankName?.trim() || null,
        bankAccount: bankAccount?.trim() || null,
        ifsc: ifsc?.trim() || null,
      },
      include: { user: true },
    });
  } catch {
    return { ok: false, message: "Could not update salary. Try again." };
  }

  await logAudit({
    actorId: admin.id,
    actorName: admin.name ?? "Admin",
    action: "SALARY_SET",
    entity: "Teacher",
    entityId: teacherId,
    summary: `Set ${teacher.user.name}'s monthly salary to ${inr(monthlySalary)}.`,
  });

  revalidatePath("/dashboard/salary");
  return { ok: true, message: "Monthly salary updated." };
}

export async function paySalary(
  _prev: SalaryFormState,
  formData: FormData
): Promise<SalaryFormState> {
  const admin = await requireRole(["ADMIN"]);
  const parsed = paySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  const teacher = await prisma.teacher.findUnique({
    where: { id: d.teacherId },
    include: { user: true },
  });
  if (!teacher) return { ok: false, message: "Teacher not found." };

  const existing = await prisma.salaryPayment.findFirst({
    where: { teacherId: d.teacherId, forMonth: d.forMonth },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, message: "Salary for this month is already recorded." };
  }

  // Net payable = gross + bonus - deductions - advance. Status follows how
  // much was actually disbursed (paidAmount).
  const net = Math.max(0, d.gross + d.bonus - d.deductions - d.advance);
  const paidAmount = d.paidAmount > 0 ? Math.min(d.paidAmount, net) : net;
  const status = paidAmount <= 0 ? "PENDING" : paidAmount < net ? "PARTIAL" : "PAID";

  try {
    await prisma.salaryPayment.create({
      data: {
        teacherId: d.teacherId,
        amount: net,
        gross: d.gross,
        bonus: d.bonus,
        deductions: d.deductions,
        advance: d.advance,
        status,
        paidAmount,
        forMonth: d.forMonth,
        mode: d.mode,
        note: d.note?.trim() || null,
        createdById: admin.id,
      },
    });
  } catch {
    return { ok: false, message: "Could not record the payment. Try again." };
  }

  await notifyUser(teacher.userId, {
    title: "Salary credited 💰",
    body: `${inr(paidAmount)} for ${d.forMonth} has been recorded${status === "PARTIAL" ? " (partial)" : ""}.`,
    href: "/dashboard/salary",
  });

  await logAudit({
    actorId: admin.id,
    actorName: admin.name ?? "Admin",
    action: "SALARY_PAID",
    entity: "SalaryPayment",
    entityId: d.teacherId,
    summary: `Paid ${inr(paidAmount)} salary to ${teacher.user.name} for ${d.forMonth} (${status}).`,
  });

  revalidatePath("/dashboard/salary");
  return { ok: true, message: `Recorded ${inr(paidAmount)} for ${teacher.user.name}.` };
}

export async function deleteSalaryPayment(id: string): Promise<{ ok: boolean; message: string }> {
  const admin = await requireRole(["ADMIN"]);
  let removed;
  try {
    removed = await prisma.salaryPayment.delete({
      where: { id },
      include: { teacher: { include: { user: true } } },
    });
  } catch {
    return { ok: false, message: "Could not delete." };
  }
  await logAudit({
    actorId: admin.id,
    actorName: admin.name ?? "Admin",
    action: "SALARY_DELETED",
    entity: "SalaryPayment",
    entityId: id,
    summary: `Deleted ${inr(removed.amount)} salary payment to ${removed.teacher.user.name} for ${removed.forMonth}.`,
  });
  revalidatePath("/dashboard/salary");
  return { ok: true, message: "Payment removed." };
}
