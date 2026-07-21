import { PlaySquare, ExternalLink } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { prisma, safeQuery } from "@/lib/prisma";
import {
  manageableBatches,
  studentByUser,
  studentBatchIds,
  childrenByParentUser,
} from "@/lib/dal";
import { PageTitle, Panel, EmptyState } from "@/components/erp/ui";
import { AddVideoButton } from "./AddVideoButton";
import { DeleteVideoButton } from "./DeleteVideoButton";

export const metadata = { title: "Video Lectures" };

type VideoRow = {
  id: string;
  title: string;
  subject: string | null;
  url: string;
  createdAt: Date;
  batch: { name: string };
};

export default async function VideosPage() {
  const user = await requireUser();
  if (user.role === "ADMIN" || user.role === "TEACHER")
    return <ManageView role={user.role} userId={user.id} />;
  if (user.role === "STUDENT") return <StudentView userId={user.id} />;
  if (user.role === "PARENT") return <ParentView userId={user.id} />;
  return <EmptyState message="Video lectures are not available for this role." />;
}

async function videosForBatches(batchIds: string[]): Promise<VideoRow[]> {
  if (batchIds.length === 0) return [];
  return safeQuery(
    () =>
      prisma.videoLecture.findMany({
        where: { batchId: { in: batchIds } },
        include: { batch: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    []
  );
}

async function ManageView({ role, userId }: { role: string; userId: string }) {
  const batches = await safeQuery(() => manageableBatches(userId, role), []);
  const list = await videosForBatches(batches.map((b) => b.id));
  return (
    <>
      <PageTitle
        title="Video Lectures"
        subtitle="Share recorded lectures (YouTube, Vimeo, etc.) with your batches. Students can watch anytime."
        action={<AddVideoButton batches={batches} />}
      />
      {batches.length === 0 && (
        <Panel className="mb-5">
          <EmptyState message="You have no batches assigned yet." />
        </Panel>
      )}
      <VideoList list={list} canManage />
    </>
  );
}

async function StudentView({ userId }: { userId: string }) {
  const student = await safeQuery(() => studentByUser(userId), null);
  if (!student) return <EmptyState message="Student profile not found." />;
  const bIds = await safeQuery(() => studentBatchIds(student.id), []);
  const list = await videosForBatches(bIds);
  return (
    <>
      <PageTitle title="Video Lectures" subtitle="Recorded lectures shared by your teachers." />
      <VideoList list={list} />
    </>
  );
}

async function ParentView({ userId }: { userId: string }) {
  const children = await safeQuery(() => childrenByParentUser(userId), []);
  if (children.length === 0) return <EmptyState message="No linked children found." />;
  const batchIds = (await Promise.all(children.map((c) => safeQuery(() => studentBatchIds(c.id), [])))).flat();
  const list = await videosForBatches([...new Set(batchIds)]);
  return (
    <>
      <PageTitle title="Video Lectures" subtitle="Recorded lectures shared with your children's batches." />
      <VideoList list={list} />
    </>
  );
}

function youtubeThumb(url: string): string | null {
  try {
    const u = new URL(url);
    let id = "";
    if (u.hostname === "youtu.be") id = u.pathname.slice(1);
    else if (u.hostname.endsWith("youtube.com")) {
      if (u.pathname === "/watch") id = u.searchParams.get("v") ?? "";
      else if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/")[2] ?? "";
      else if (u.pathname.startsWith("/shorts/")) id = u.pathname.split("/")[2] ?? "";
    }
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
  } catch {
    return null;
  }
}

function VideoList({ list, canManage }: { list: VideoRow[]; canManage?: boolean }) {
  if (list.length === 0) {
    return (
      <Panel>
        <EmptyState message="No video lectures shared yet." />
      </Panel>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((v) => {
        const thumb = youtubeThumb(v.url);
        return (
          <Panel key={v.id} className="overflow-hidden p-0">
            <a
              href={v.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-video bg-navy-900"
            >
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb} alt="" className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100" />
              ) : (
                <span className="grid h-full w-full place-items-center bg-navy-700/5 text-navy-300">
                  <PlaySquare size={40} />
                </span>
              )}
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm transition group-hover:scale-110 group-hover:bg-gold-500">
                  <PlaySquare size={22} />
                </span>
              </span>
            </a>
            <div className="flex items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-navy-700 truncate">{v.title}</p>
                  {v.subject && (
                    <span className="rounded-full bg-navy-700/5 px-2.5 py-0.5 text-xs font-medium text-navy-600">
                      {v.subject}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-navy-400">
                  {v.batch?.name ?? "Batch"} ·{" "}
                  {v.createdAt ? new Date(v.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                </p>
                <div className="mt-2 flex items-center gap-4">
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:text-gold-600"
                  >
                    <ExternalLink size={14} /> Watch
                  </a>
                  {canManage && <DeleteVideoButton id={v.id} />}
                </div>
              </div>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
