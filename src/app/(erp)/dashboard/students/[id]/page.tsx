import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, MapPin } from "lucide-react";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import { PageTitle } from "@/components/erp/ui";
import { PrintButton } from "./PrintButton";

export const metadata = { title: "Student ID Card" };

export default async function StudentIdCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN"]);
  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: { user: true, enrollments: { include: { batch: true } } },
  });
  if (!student) notFound();

  const batchNames = student.enrollments.map((e) => e.batch.name).join(", ") || "—";
  const year = String(new Date().getFullYear());

  return (
    <>
      <div className="print:hidden">
        <PageTitle
          title="Student ID Card"
          subtitle={student.user.name}
          action={<PrintButton />}
        />
        <Link
          href="/dashboard/students"
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-500 hover:text-gold-600"
        >
          <ArrowLeft size={15} /> Back to students
        </Link>
      </div>

      <div className="flex justify-center">
        <div className="w-[340px] overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-[var(--shadow-lift)] print:shadow-none">
          <div className="bg-navy-700 px-5 py-4 text-center">
            <p className="font-serif text-lg font-bold text-ivory">{site.name}</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-400">
              {site.tagline}
            </p>
          </div>

          <div className="flex flex-col items-center px-6 pt-5">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-gold-500/15 font-serif text-2xl font-bold text-gold-700">
              {student.user.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <h2 className="mt-3 font-serif text-xl font-bold text-navy-700">{student.user.name}</h2>
            <span className="mt-1 rounded-full bg-navy-700/5 px-3 py-0.5 text-xs font-semibold text-navy-600">
              Student · {year}
            </span>
          </div>

          <dl className="space-y-2.5 px-6 py-5 text-sm">
            <Row label="Roll No" value={student.rollNo} mono />
            <Row label="Class" value={student.className} />
            <Row label="Batch" value={batchNames} />
            {student.guardianName && <Row label="Guardian" value={student.guardianName} />}
            {student.user.phone && <Row label="Phone" value={student.user.phone} />}
          </dl>

          <div className="border-t border-navy-100 bg-ivory/50 px-6 py-3 text-[10px] text-navy-500">
            <p className="flex items-center gap-1.5">
              <Phone size={11} /> {site.phoneDisplay}
            </p>
            <p className="mt-1 flex items-center gap-1.5">
              <MapPin size={11} /> {site.address.full}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-navy-400">{label}</dt>
      <dd className={`font-semibold text-navy-700 ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
