"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireRole } from "@/lib/rbac";
import { nextSlipNo, nextReceiptNo } from "@/lib/ids";
import { notifyAdmins, notifyStudentAndParent } from "@/lib/notify";
import { saveImageUpload } from "@/lib/upload";
import { logAudit } from "@/lib/audit";

const slipSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  mode: z.enum(["CASH", "UPI", "CARD", "BANK", "CHEQUE"]),
  forMonth: z.string().max(30).optional().or(z.literal("")),
  note: z.string().max(200).optional().or(z.literal("")),
});

export type SlipFormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  slipId?: string;
};

/** Verify that the logged-in user is allowed to create a slip for this student. */
async function assertCanActForStudent(userId: string, role: string, studentId: string) {
  if (role === "ADMIN") return true;
  if (role === "STUDENT") {
    const s = await prisma.student.findUnique({ where: { id: studentId } });
    const me = await prisma.student.findUnique({ where: { userId } });
    return !!s && !!me && s.id === me.id;
  }
  if (role === "PARENT") {
    const parent = await prisma.parent.findUnique({
      where: { userId },
      include: { children: true },
    });
    return !!parent?.children.some((c) => c.id === studentId);
  }
  return false;
}

export async function createFeeSlip(
  _prev: SlipFormState,
  formData: FormData
): Promise<SlipFormState> {
  const user = await requireUser();
  const parsed = slipSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  if (!(await assertCanActForStudent(user.id, user.role, d.studentId))) {
    return { ok: false, message: "You can't create a slip for this student." };
  }

  let slip;
  try {
    const slipNo = await nextSlipNo();
    slip = await prisma.feeSlip.create({
      data: {
        slipNo,
        studentId: d.studentId,
        amount: d.amount,
        mode: d.mode,
        forMonth: d.forMonth || null,
        note: d.note || null,
        createdById: user.id,
      },
      include: { student: { include: { user: true } } },
    });
  } catch {
    return { ok: false, message: "Could not create the slip. Try again." };
  }

  await notifyAdmins({
    title: "New fee deposit slip",
    body: `${slip.student.user.name} generated slip ${slip.slipNo} for ₹${d.amount.toLocaleString("en-IN")}.`,
    href: "/dashboard/fees/slips",
  });

  revalidatePath("/dashboard/fees/slips");
  return { ok: true, message: `Slip ${slip.slipNo} generated.`, slipId: slip.id };
}

export type ProofFormState = {
  ok?: boolean;
  message?: string;
};

/**
 * Student/parent uploads a UPI payment screenshot (and optional UTR/reference)
 * against a PENDING slip they own. The slip stays PENDING until an admin verifies it.
 */
export async function uploadPaymentProof(
  _prev: ProofFormState,
  formData: FormData
): Promise<ProofFormState> {
  const user = await requireUser();

  const slipId = String(formData.get("slipId") ?? "");
  const txnRef = String(formData.get("txnRef") ?? "").trim();
  const file = formData.get("proof") as File | null;

  if (!slipId) return { ok: false, message: "Missing slip." };

  const slip = await prisma.feeSlip.findUnique({ where: { id: slipId } });
  if (!slip) return { ok: false, message: "Slip not found." };

  if (!(await assertCanActForStudent(user.id, user.role, slip.studentId))) {
    return { ok: false, message: "You can't upload proof for this slip." };
  }
  if (slip.status !== "PENDING") {
    return { ok: false, message: "This slip has already been reviewed." };
  }

  const saved = await saveImageUpload(file, "payment-proofs", slip.slipNo);
  if (!saved.ok) return { ok: false, message: saved.error };

  try {
    await prisma.feeSlip.update({
      where: { id: slipId },
      data: {
        proofImage: saved.url,
        txnRef: txnRef || null,
        submittedAt: new Date(),
      },
    });
  } catch {
    return { ok: false, message: "Could not save your upload. Try again." };
  }

  const student = await prisma.student.findUnique({
    where: { id: slip.studentId },
    include: { user: true },
  });
  await notifyAdmins({
    title: "Payment proof uploaded 🧾",
    body: `${student?.user.name ?? "A student"} uploaded a payment screenshot for slip ${slip.slipNo} (₹${slip.amount.toLocaleString("en-IN")}). Please verify.`,
    href: "/dashboard/fees/slips?status=PENDING",
  });

  revalidatePath("/dashboard/fees/slips");
  revalidatePath(`/dashboard/fees/slips/${slipId}`);
  return { ok: true, message: "Payment screenshot uploaded. The office will verify it shortly." };
}

export async function verifyFeeSlip(
  id: string,
  decision: "PAID" | "REJECTED",
  note?: string
): Promise<{ ok: boolean; message: string }> {
  const admin = await requireRole(["ADMIN"]);

  const slip = await prisma.feeSlip.findUnique({ where: { id } });
  if (!slip) return { ok: false, message: "Slip not found." };
  if (slip.status !== "PENDING")
    return { ok: false, message: "This slip has already been reviewed." };

  try {
    if (decision === "PAID") {
      const receiptNo = await nextReceiptNo();
      await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.create({
          data: {
            studentId: slip.studentId,
            amount: slip.amount,
            mode: slip.mode,
            receiptNo,
            forMonth: slip.forMonth,
            note: `Fee slip ${slip.slipNo}${slip.txnRef ? ` · UPI ref ${slip.txnRef}` : ""}`,
          },
        });
        await tx.feeSlip.update({
          where: { id },
          data: {
            status: "PAID",
            receiptNo,
            paymentId: payment.id,
            reviewedAt: new Date(),
            reviewNote: note || null,
          },
        });
      });
      await notifyStudentAndParent(slip.studentId, {
        title: "Payment confirmed ✅",
        body: `Your fee slip ${slip.slipNo} is verified. Official receipt ${receiptNo} is ready to download.`,
        href: `/dashboard/fees/slips/${id}`,
      });
      await notifyAdmins({
        title: "Fee payment recorded 💰",
        body: `Receipt ${receiptNo} generated for slip ${slip.slipNo} — ₹${slip.amount.toLocaleString("en-IN")} collected.`,
        href: "/dashboard/accounting",
      });
      await logAudit({
        actorId: admin.id,
        actorName: admin.name ?? "Admin",
        action: "FEE_VERIFIED",
        entity: "FeeSlip",
        entityId: id,
        summary: `Verified slip ${slip.slipNo} (₹${slip.amount.toLocaleString("en-IN")}) → receipt ${receiptNo}.`,
      });
    } else {
      await prisma.feeSlip.update({
        where: { id },
        data: { status: "REJECTED", reviewedAt: new Date(), reviewNote: note || null },
      });
      await notifyStudentAndParent(slip.studentId, {
        title: "Fee slip rejected",
        body: `Your fee slip ${slip.slipNo} was rejected${note ? `: ${note}` : "."} Please contact the office.`,
        href: `/dashboard/fees/slips/${id}`,
      });
      await logAudit({
        actorId: admin.id,
        actorName: admin.name ?? "Admin",
        action: "FEE_REJECTED",
        entity: "FeeSlip",
        entityId: id,
        summary: `Rejected slip ${slip.slipNo} (₹${slip.amount.toLocaleString("en-IN")})${note ? `: ${note}` : "."}`,
      });
    }
  } catch {
    return { ok: false, message: "Could not update the slip." };
  }

  revalidatePath("/dashboard/fees/slips");
  revalidatePath(`/dashboard/fees/slips/${id}`);
  return {
    ok: true,
    message: decision === "PAID" ? "Marked as paid — receipt generated." : "Slip rejected.",
  };
}
