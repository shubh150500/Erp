import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { buildReceiptPdf } from "@/lib/receipt-pdf";

export const runtime = "nodejs";

/** GET — download the fee receipt / slip as a 2-copy PDF (Student + Institute). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await requireUser();

  const slip = await prisma.feeSlip.findUnique({
    where: { id },
    include: {
      student: {
        include: { user: true, parent: { include: { user: true } }, enrollments: { include: { batch: true } } },
      },
    },
  });
  if (!slip) return new Response("Not found", { status: 404 });

  // Access control mirrors the slip page: admin sees all; student/parent own only.
  if (user.role !== "ADMIN") {
    let allowed = false;
    if (user.role === "STUDENT") {
      const me = await prisma.student.findUnique({ where: { userId: user.id } });
      allowed = me?.id === slip.studentId;
    } else if (user.role === "PARENT") {
      const parent = await prisma.parent.findUnique({
        where: { userId: user.id },
        include: { children: true },
      });
      allowed = !!parent?.children.some((c) => c.id === slip.studentId);
    }
    if (!allowed) return new Response("Forbidden", { status: 403 });
  }

  const isReceipt = slip.status === "PAID";
  const docId = isReceipt ? slip.receiptNo ?? slip.slipNo : slip.slipNo;
  const batch = slip.student.enrollments[0]?.batch;

  const pdf = await buildReceiptPdf({
    docTitle: isReceipt ? "Official Fee Receipt" : "Fee Deposit Slip",
    docId,
    slipNo: slip.slipNo,
    status: slip.status,
    studentName: slip.student.user.name,
    rollNo: slip.student.rollNo,
    parentName: slip.student.guardianName ?? slip.student.parent?.user.name ?? "-",
    className: slip.student.className,
    batch: batch?.name ?? "-",
    feeType: slip.forMonth ?? slip.note ?? "Tuition fee",
    amount: slip.amount,
    mode: slip.mode,
    date: slip.reviewedAt ?? slip.createdAt,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${docId}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
