"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import type { InquiryStatus } from "@prisma/client";

export async function updateInquiryStatus(id: string, status: InquiryStatus) {
  await requireRole(["ADMIN"]);
  await prisma.inquiry.update({ where: { id }, data: { status } });
  revalidatePath("/dashboard/admissions");
}
