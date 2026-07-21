import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { studentByUser, childrenByParentUser } from "@/lib/dal";
import { xlsxResponse } from "@/lib/excel";

export const runtime = "nodejs";

const fmt = (d: Date) =>
  d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const include = { student: { include: { user: true } } } as const;

/** GET — export payment history as .xlsx (scoped to the caller's role). */
export async function GET() {
  const user = await requireUser();

  let rows: Awaited<ReturnType<typeof fetchAll>> = [];
  if (user.role === "STUDENT") {
    const student = await studentByUser(user.id);
    rows = student
      ? await prisma.payment.findMany({ where: { studentId: student.id }, include, orderBy: { paidAt: "desc" } })
      : [];
  } else if (user.role === "PARENT") {
    const children = await childrenByParentUser(user.id);
    rows = await prisma.payment.findMany({
      where: { studentId: { in: children.map((c) => c.id) } },
      include,
      orderBy: { paidAt: "desc" },
    });
  } else if (user.role === "ADMIN") {
    rows = await fetchAll();
  } else {
    return new Response("Forbidden", { status: 403 });
  }

  return xlsxResponse("payments.xlsx", [
    {
      name: "Payments",
      rows: rows.map((p) => ({
        Receipt: p.receiptNo,
        Student: p.student.user.name,
        Amount: p.amount,
        Mode: p.mode,
        ForMonth: p.forMonth ?? "",
        Date: fmt(p.paidAt),
        Note: p.note ?? "",
      })),
    },
  ]);
}

function fetchAll() {
  return prisma.payment.findMany({ include, orderBy: { paidAt: "desc" } });
}
