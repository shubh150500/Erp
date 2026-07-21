import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { buildSalarySlipPdf } from "@/lib/salary-slip-pdf";

export const runtime = "nodejs";

/** GET — download a teacher salary slip as a branded PDF. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const pay = await prisma.salaryPayment.findUnique({
    where: { id },
    include: { teacher: { include: { user: true } } },
  });
  if (!pay) return new Response("Not found", { status: 404 });

  // Admin sees all; a teacher sees only their own slips.
  if (user.role !== "ADMIN") {
    if (!(user.role === "TEACHER" && pay.teacher.userId === user.id)) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const t = pay.teacher;
  const pdf = await buildSalarySlipPdf({
    slipNo: pay.id.slice(-8).toUpperCase(),
    payeeName: t.user.name,
    payeeType: "Teacher",
    designation: t.designation ?? t.subject ?? "-",
    forMonth: pay.forMonth,
    status: pay.status,
    mode: pay.mode,
    gross: pay.gross ?? pay.amount,
    bonus: pay.bonus,
    deductions: pay.deductions,
    advance: pay.advance,
    net: pay.amount,
    paidAmount: pay.paidAmount ?? pay.amount,
    bankName: t.bankName ?? "-",
    bankAccount: t.bankAccount ?? "-",
    date: pay.paidAt,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="salary-${pay.forMonth}-${t.user.name.replace(/\s+/g, "_")}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
