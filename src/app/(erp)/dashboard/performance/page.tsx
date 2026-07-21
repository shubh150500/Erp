import { Award, TrendingDown, Trophy, Medal, Flame, CheckCircle2, Sparkles, BadgeCheck } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import {
  performanceData,
  rankInBatch,
  attendancePct,
  feeSummary,
  studentByUser,
  childrenByParentUser,
} from "@/lib/dal";
import { PageTitle, Panel, EmptyState, StatCard } from "@/components/erp/ui";

export const metadata = { title: "Performance" };

export default async function PerformancePage() {
  const user = await requireUser();
  if (user.role === "STUDENT") {
    const student = await studentByUser(user.id);
    if (!student) return <EmptyState message="Student profile not found." />;
    return (
      <>
        <PageTitle title="My Performance" subtitle="Your academic progress, rank and achievements." />
        <PerfBlock data={await buildPerf(student.id)} />
      </>
    );
  }
  if (user.role === "PARENT") {
    const children = await childrenByParentUser(user.id);
    if (children.length === 0) return <EmptyState message="No linked children found." />;
    const blocks = await Promise.all(
      children.map(async (c) => ({ name: c.user.name, data: await buildPerf(c.id) }))
    );
    return (
      <>
        <PageTitle title="Performance" subtitle="Academic progress for your children." />
        <div className="space-y-10">
          {blocks.map((b, i) => (
            <div key={i}>
              <h2 className="mb-4 font-serif text-xl font-bold text-navy-700">{b.name}</h2>
              <PerfBlock data={b.data} />
            </div>
          ))}
        </div>
      </>
    );
  }
  return <EmptyState message="Performance view is for students and parents." />;
}

type Perf = Awaited<ReturnType<typeof buildPerf>>;

async function buildPerf(studentId: string) {
  const [marks, rank, att, fees, doubtCount] = await Promise.all([
    performanceData(studentId),
    rankInBatch(studentId),
    attendancePct(studentId),
    feeSummary(studentId),
    prisma.doubt.count({ where: { studentId } }),
  ]);

  const overall = marks.length ? marks.reduce((a, m) => a + m.pct, 0) / marks.length : null;

  // Subject-wise averages
  const subjMap = new Map<string, { sum: number; n: number }>();
  for (const m of marks) {
    const k = m.subject || "General";
    const cur = subjMap.get(k) ?? { sum: 0, n: 0 };
    cur.sum += m.pct;
    cur.n += 1;
    subjMap.set(k, cur);
  }
  const subjects = [...subjMap.entries()]
    .map(([subject, v]) => ({ subject, avg: v.sum / v.n }))
    .sort((a, b) => b.avg - a.avg);

  // Monthly averages
  const monthMap = new Map<string, { sum: number; n: number; label: string }>();
  for (const m of marks) {
    const key = `${m.date.getFullYear()}-${String(m.date.getMonth() + 1).padStart(2, "0")}`;
    const label = m.date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    const cur = monthMap.get(key) ?? { sum: 0, n: 0, label };
    cur.sum += m.pct;
    cur.n += 1;
    monthMap.set(key, cur);
  }
  const months = [...monthMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, v]) => ({ label: v.label, avg: v.sum / v.n }));

  const weak = subjects.filter((s) => s.avg < 50);

  // Derived achievement badges
  const badges: { icon: "trophy" | "medal" | "flame" | "check" | "spark" | "badge"; label: string }[] = [];
  if (rank && rank.rank <= 3) badges.push({ icon: "trophy", label: `Top ${rank.rank} in batch` });
  if (overall !== null && overall >= 75) badges.push({ icon: "medal", label: "High Achiever (75%+)" });
  if (att !== null && att >= 90) badges.push({ icon: "flame", label: "Regular (90%+ attendance)" });
  if (marks.some((m) => m.pct >= 90)) badges.push({ icon: "spark", label: "Star Scorer (90%+ exam)" });
  if (fees.billed > 0 && fees.due === 0) badges.push({ icon: "check", label: "Fees Cleared" });
  if (doubtCount > 0) badges.push({ icon: "badge", label: "Curious Mind" });

  return { marks, overall, rank, att, subjects, months, weak, badges };
}

function PerfBlock({ data }: { data: Perf }) {
  if (data.marks.length === 0) {
    return (
      <Panel>
        <EmptyState message="No exam marks recorded yet — performance will appear once results are entered." />
      </Panel>
    );
  }
  return (
    <div className="space-y-7">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Overall average"
          value={data.overall === null ? "—" : `${Math.round(data.overall)}%`}
          tone={data.overall !== null && data.overall >= 75 ? "green" : data.overall !== null && data.overall < 40 ? "red" : "navy"}
        />
        <StatCard
          label="Rank in batch"
          value={data.rank ? `#${data.rank.rank}` : "—"}
          hint={data.rank ? `of ${data.rank.total}` : undefined}
          tone="gold"
        />
        <StatCard label="Attendance" value={data.att === null ? "—" : `${data.att}%`} tone={data.att !== null && data.att < 75 ? "red" : "green"} />
        <StatCard label="Exams taken" value={data.marks.length} />
      </div>

      <Panel title="Subject-wise progress" className="p-0">
        <div className="space-y-4 p-5">
          {data.subjects.map((s) => (
            <Bar key={s.subject} label={s.subject} value={s.avg} />
          ))}
        </div>
      </Panel>

      <Panel title="Monthly performance" className="p-0">
        <div className="flex items-end gap-3 overflow-x-auto p-6" style={{ minHeight: 180 }}>
          {data.months.map((m, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="flex h-32 w-10 items-end rounded-lg bg-navy-700/5">
                <div
                  className="w-full rounded-lg bg-gradient-to-t from-gold-500 to-gold-400"
                  style={{ height: `${Math.max(4, Math.round(m.avg))}%` }}
                  title={`${Math.round(m.avg)}%`}
                />
              </div>
              <span className="text-[11px] font-semibold text-navy-600">{Math.round(m.avg)}%</span>
              <span className="text-[10px] text-navy-400">{m.label}</span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-7 lg:grid-cols-2">
        <Panel title="Weak topics" className="p-0">
          <div className="p-5">
            {data.weak.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 size={16} /> No weak areas — all subjects above 50%. Great job!
              </p>
            ) : (
              <ul className="space-y-3">
                {data.weak.map((s) => (
                  <li key={s.subject} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium text-navy-700">
                      <TrendingDown size={15} className="text-red-500" /> {s.subject}
                    </span>
                    <span className="text-sm font-semibold text-red-600">{Math.round(s.avg)}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>

        <Panel title="Achievement badges" className="p-0">
          <div className="p-5">
            {data.badges.length === 0 ? (
              <p className="text-sm text-navy-400">No badges yet — keep going!</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {data.badges.map((b, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 rounded-full bg-gold-500/15 px-4 py-2 text-sm font-semibold text-gold-700"
                  >
                    <BadgeIcon name={b.icon} /> {b.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  const v = Math.round(value);
  const tone = v >= 75 ? "from-emerald-500 to-emerald-400" : v >= 50 ? "from-gold-500 to-gold-400" : "from-red-500 to-red-400";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-navy-700">{label}</span>
        <span className="font-semibold text-navy-600">{v}%</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-navy-700/5">
        <div className={`h-2.5 rounded-full bg-gradient-to-r ${tone}`} style={{ width: `${Math.min(100, v)}%` }} />
      </div>
    </div>
  );
}

function BadgeIcon({ name }: { name: string }) {
  const size = 15;
  if (name === "trophy") return <Trophy size={size} />;
  if (name === "medal") return <Medal size={size} />;
  if (name === "flame") return <Flame size={size} />;
  if (name === "check") return <BadgeCheck size={size} />;
  if (name === "spark") return <Sparkles size={size} />;
  return <Award size={size} />;
}
