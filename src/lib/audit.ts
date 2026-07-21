import { prisma } from "@/lib/prisma";

type AuditInput = {
  actorId: string;
  actorName: string;
  action: string; // e.g. FEE_VERIFIED | EXPENSE_ADDED | SALARY_PAID
  entity: string; // e.g. FeeSlip | Expense | SalaryPayment
  entityId?: string | null;
  summary: string;
};

/**
 * Record a sensitive admin action in the finance audit trail.
 * Fire-and-forget: failures are swallowed so they never break the main action.
 */
export async function logAudit(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        actorName: input.actorName,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        summary: input.summary,
      },
    });
  } catch {
    // Never let audit logging interrupt the operation it records.
  }
}
