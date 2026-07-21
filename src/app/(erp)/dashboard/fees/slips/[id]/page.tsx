import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import { amountInWords } from "@/lib/words";
import { PrintBar } from "./PrintButton";
import { UploadProofForm } from "../UploadProofForm";
import { VerifyButton } from "../VerifyButton";

export const metadata = { title: "Fee Slip" };

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export default async function SlipDocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const slip = await prisma.feeSlip.findUnique({
    where: { id },
    include: {
      student: {
        include: { user: true, enrollments: { include: { batch: true } } },
      },
    },
  });
  if (!slip) notFound();

  // Access control: admin sees all; student/parent only their own.
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
    if (!allowed) notFound();
  }

  const isReceipt = slip.status === "PAID";
  const docTitle = isReceipt ? "Official Fee Receipt" : "Fee Deposit Slip";
  const docId = isReceipt ? slip.receiptNo! : slip.slipNo;

  // Generate QR code (server-side) encoding key verification details.
  const qrPayload = [
    site.name,
    docTitle,
    `ID:${docId}`,
    `Slip:${slip.slipNo}`,
    `Amt:${slip.amount}`,
    `Status:${slip.status}`,
  ].join(" | ");
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    margin: 1,
    width: 220,
    color: { dark: "#0d1b3e", light: "#ffffff" },
  });

  const batch = slip.student.enrollments[0]?.batch;

  return (
    <div className="mx-auto max-w-3xl">
      <PrintBar id={slip.id} />

      <div
        id="print-doc"
        className="relative bg-white text-navy-700 rounded-2xl border border-navy-200 shadow-[var(--shadow-card)] print:shadow-none print:border-0 print:rounded-none overflow-hidden"
      >
        {/* Status watermark */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span
            className={`font-serif text-[7rem] font-bold opacity-[0.06] rotate-[-20deg] ${
              slip.status === "PAID"
                ? "text-emerald-600"
                : slip.status === "REJECTED"
                ? "text-red-600"
                : "text-navy-700"
            }`}
          >
            {slip.status}
          </span>
        </div>

        {/* Header */}
        <div className="relative bg-navy-700 text-ivory px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-gold-500 text-navy-800 font-serif text-lg font-bold">
              TE
            </span>
            <div>
              <h1 className="font-serif text-2xl font-bold leading-tight">{site.name}</h1>
              <p className="text-xs text-gold-300">{site.tagline}</p>
            </div>
          </div>
          <div className="text-right text-xs text-navy-100/80">
            <p>{site.address.full}</p>
            <p>{site.address.city}</p>
            <p>{site.phoneDisplay}</p>
          </div>
        </div>

        {/* Doc title band */}
        <div className="relative bg-gold-500/10 border-y border-gold-500/30 px-8 py-3 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-navy-700">{docTitle}</h2>
          <span className="font-mono text-sm font-semibold text-navy-700">{docId}</span>
        </div>

        {/* Body */}
        <div className="relative px-8 py-6 grid sm:grid-cols-3 gap-6">
          <div className="sm:col-span-2 space-y-4">
            <Row2 label="Student name" value={slip.student.user.name} />
            <div className="grid grid-cols-2 gap-4">
              <Row2 label="Roll no" value={slip.student.rollNo} />
              <Row2 label="Class" value={slip.student.className} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Row2 label="Batch" value={batch?.name ?? "—"} />
              <Row2 label="For month" value={slip.forMonth ?? "—"} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Row2 label="Payment mode" value={slip.mode} />
              <Row2
                label={isReceipt ? "Receipt date" : "Generated on"}
                value={(slip.reviewedAt ?? slip.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              />
            </div>
            {slip.note && <Row2 label="Note" value={slip.note} />}
            {slip.reviewNote && <Row2 label="Office remark" value={slip.reviewNote} />}
          </div>

          {/* QR */}
          <div className="flex flex-col items-center justify-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR code" className="h-32 w-32" />
            <p className="mt-2 text-[10px] text-navy-400 text-center">
              Scan to verify
            </p>
          </div>
        </div>

        {/* Amount */}
        <div className="relative mx-8 mb-6 rounded-xl bg-navy-700 text-ivory px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-gold-300">Amount</p>
            <p className="text-sm text-navy-100/80">{amountInWords(slip.amount)}</p>
          </div>
          <p className="font-serif text-3xl font-bold text-gold-400">{inr(slip.amount)}</p>
        </div>

        {/* Footer / signatures */}
        <div className="relative px-8 pb-8 pt-2 flex items-end justify-between text-xs text-navy-500">
          <div>
            <p className="mb-8">
              {isReceipt
                ? "This is a computer-generated official receipt."
                : "Deposit this slip with payment at the office. Valid after verification."}
            </p>
            <p className="border-t border-navy-300 pt-1 w-40">Depositor's signature</p>
          </div>
          <div className="text-right">
            <p className="mb-8">For {site.name}</p>
            <p className="border-t border-navy-300 pt-1 w-40 ml-auto">Authorised signatory</p>
          </div>
        </div>
      </div>

      {/* Admin verify panel — generate the official receipt or reject (PENDING only) */}
      {user.role === "ADMIN" && slip.status === "PENDING" && (
        <div className="print:hidden mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-navy-200 bg-white p-6 shadow-[var(--shadow-card)]">
          <div>
            <h3 className="font-serif text-lg font-bold text-navy-700">Verify this deposit</h3>
            <p className="mt-1 text-sm text-navy-500">
              Approve to generate the official receipt automatically, or reject the slip.
            </p>
          </div>
          <VerifyButton
            slipId={slip.id}
            slipNo={slip.slipNo}
            studentName={slip.student.user.name}
            amount={slip.amount}
            proofImage={slip.proofImage}
            txnRef={slip.txnRef}
          />
        </div>
      )}

      {/* Payment proof (UPI screenshot) — hidden when printing */}
      <PaymentProofSection
        role={user.role}
        slipId={slip.id}
        status={slip.status}
        proofImage={slip.proofImage}
        txnRef={slip.txnRef}
        submittedAt={slip.submittedAt}
      />

      <p className="print:hidden mt-4 text-center text-xs text-navy-400">
        Tip: in the print dialog, choose “Save as PDF” for a digital copy. Paper size: A4.
      </p>
    </div>
  );
}

function PaymentProofSection({
  role,
  slipId,
  status,
  proofImage,
  txnRef,
  submittedAt,
}: {
  role: string;
  slipId: string;
  status: string;
  proofImage: string | null;
  txnRef: string | null;
  submittedAt: Date | null;
}) {
  const isOwner = role === "STUDENT" || role === "PARENT";

  // Student/parent, slip still pending, no proof yet → show the upload form.
  if (isOwner && status === "PENDING" && !proofImage) {
    return (
      <div className="print:hidden mt-6 rounded-2xl border border-navy-200 bg-white p-6 shadow-[var(--shadow-card)]">
        <h3 className="font-serif text-lg font-bold text-navy-700">Paid online via UPI?</h3>
        <p className="mt-1 mb-4 text-sm text-navy-500">
          Upload a screenshot of your UPI payment. Once the office verifies it, your official
          receipt is generated automatically.
        </p>
        <UploadProofForm slipId={slipId} />
      </div>
    );
  }

  // Proof exists → show it (everyone who can see the slip).
  if (proofImage) {
    return (
      <div className="print:hidden mt-6 rounded-2xl border border-navy-200 bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-serif text-lg font-bold text-navy-700">Payment proof</h3>
          {status === "PENDING" && (
            <span className="rounded-full bg-gold-500/15 px-3 py-1 text-xs font-semibold text-gold-700">
              Awaiting verification
            </span>
          )}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-[200px_1fr]">
          <a href={proofImage} target="_blank" rel="noopener noreferrer" className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={proofImage}
              alt="Payment screenshot"
              className="w-full rounded-xl border border-navy-100 object-cover hover:opacity-90"
            />
          </a>
          <div className="space-y-3 text-sm">
            {txnRef && (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-navy-400 font-semibold">
                  UPI reference / UTR
                </p>
                <p className="font-mono text-navy-700">{txnRef}</p>
              </div>
            )}
            {submittedAt && (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-navy-400 font-semibold">
                  Uploaded on
                </p>
                <p className="text-navy-700">
                  {submittedAt.toLocaleString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
            <a
              href={proofImage}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-semibold text-navy-700 hover:text-gold-600"
            >
              Open full image →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function Row2({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-navy-400 font-semibold">{label}</p>
      <p className="text-navy-700 font-medium">{value}</p>
    </div>
  );
}
