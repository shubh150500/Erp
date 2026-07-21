import { FileText, Download } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { prisma, safeQuery } from "@/lib/prisma";
import {
  manageableBatches,
  studentByUser,
  studentBatchIds,
  childrenByParentUser,
} from "@/lib/dal";
import { PageTitle, Panel, EmptyState } from "@/components/erp/ui";
import { UploadMaterialButton } from "./UploadMaterialButton";
import { DeleteMaterialButton } from "./DeleteMaterialButton";

export const metadata = { title: "Study Material" };

type MatRow = {
  id: string;
  title: string;
  subject: string | null;
  fileUrl: string;
  fileName: string;
  createdAt: Date;
  batch: { name: string };
};

export default async function MaterialsPage() {
  const user = await requireUser();
  if (user.role === "ADMIN" || user.role === "TEACHER")
    return <ManageView role={user.role} userId={user.id} />;
  if (user.role === "STUDENT") return <StudentView userId={user.id} />;
  if (user.role === "PARENT") return <ParentView userId={user.id} />;
  return <EmptyState message="Study material is not available for this role." />;
}

async function materialsForBatches(batchIds: string[]): Promise<MatRow[]> {
  if (batchIds.length === 0) return [];
  return safeQuery(
    () =>
      prisma.studyMaterial.findMany({
        where: { batchId: { in: batchIds } },
        include: { batch: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    []
  );
}

async function ManageView({ role, userId }: { role: string; userId: string }) {
  const batches = await safeQuery(() => manageableBatches(userId, role), []);
  const list = await materialsForBatches(batches.map((b) => b.id));
  return (
    <>
      <PageTitle
        title="Study Material"
        subtitle="Upload notes and PDFs for your batches. Students can download them anytime."
        action={<UploadMaterialButton batches={batches} />}
      />
      {batches.length === 0 && (
        <Panel className="mb-5">
          <EmptyState message="You have no batches assigned yet." />
        </Panel>
      )}
      <MaterialList list={list} canManage />
    </>
  );
}

async function StudentView({ userId }: { userId: string }) {
  const student = await safeQuery(() => studentByUser(userId), null);
  if (!student) return <EmptyState message="Student profile not found." />;
  const bIds = await safeQuery(() => studentBatchIds(student.id), []);
  const list = await materialsForBatches(bIds);
  return (
    <>
      <PageTitle title="Study Material" subtitle="Notes and PDFs shared by your teachers." />
      <MaterialList list={list} />
    </>
  );
}

async function ParentView({ userId }: { userId: string }) {
  const children = await safeQuery(() => childrenByParentUser(userId), []);
  if (children.length === 0) return <EmptyState message="No linked children found." />;
  const batchIds = (await Promise.all(children.map((c) => safeQuery(() => studentBatchIds(c.id), [])))).flat();
  const list = await materialsForBatches([...new Set(batchIds)]);
  return (
    <>
      <PageTitle title="Study Material" subtitle="Notes and PDFs shared with your children's batches." />
      <MaterialList list={list} />
    </>
  );
}

function MaterialList({ list, canManage }: { list: MatRow[]; canManage?: boolean }) {
  if (list.length === 0) {
    return (
      <Panel>
        <EmptyState message="No study material uploaded yet." />
      </Panel>
    );
  }
  return (
    <Panel>
      <ul className="divide-y divide-navy-100">
        {list.map((m) => (
          <li key={m.id} className="flex items-center gap-4 px-5 py-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-gold-600">
              <FileText size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-navy-700 truncate">{m.title}</p>
                {m.subject && (
                  <span className="rounded-full bg-navy-700/5 px-2.5 py-0.5 text-xs font-medium text-navy-600">
                    {m.subject}
                  </span>
                )}
              </div>
              <p className="text-xs text-navy-400">
                {m.batch?.name ?? "Batch"} ·{" "}
                {m.createdAt ? new Date(m.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <a
                href={m.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={m.fileName}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:text-gold-600"
              >
                <Download size={15} /> Download
              </a>
              {canManage && <DeleteMaterialButton id={m.id} />}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
