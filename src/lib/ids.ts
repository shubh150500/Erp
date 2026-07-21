import { prisma } from "@/lib/prisma";

/** Next sequential slip number, e.g. TE-SLIP-00001. */
export async function nextSlipNo() {
  const count = await prisma.feeSlip.count();
  return "TE-SLIP-" + String(count + 1).padStart(5, "0");
}

/** Next sequential official receipt number, e.g. TE-RC-00001. */
export async function nextReceiptNo() {
  const count = await prisma.payment.count();
  return "TE-RC-" + String(count + 1).padStart(5, "0");
}
