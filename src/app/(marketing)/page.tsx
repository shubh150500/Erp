import Link from "next/link";
import {
  GraduationCap,
  Trophy,
  Users,
  Target,
  BookOpen,
  ClipboardCheck,
  LineChart,
  ShieldCheck,
  ArrowRight,
  Star,
  Quote,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Card, SectionHeading, Badge } from "@/components/ui/Card";
import { courses, stats, site } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <WhyUs />
      <Courses />
      <Approach />
      <Results />
      <Testimonials />
      <CTA />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy-700 text-ivory">
      <div className="absolute inset-0 bg-grid opacity-60" aria-hidden />
      <div
        className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-gold-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-navy-400/30 blur-3xl"
        aria-hidden
      />
      <div className="container-page relative py-20 md:py-28 grid lg:grid-cols-2 gap-12 items-center">
        <div className="reveal">
          <Badge className="bg-gold-500/15 text-gold-300">
            <Star size={13} className="fill-gold-400 text-gold-400" />
            Trusted since {site.established}
          </Badge>
          <h1 className="mt-5 text-4xl md:text-6xl font-bold leading-[1.05]">
            Where focus meets
            <span className="block text-gradient-gold">remarkable results.</span>
          </h1>
          <p className="mt-6 text-lg text-navy-100/80 max-w-xl leading-relaxed">
            {site.name} mentors students of Foundation (Class 8–10) and Class 11–12
            with disciplined teaching, constant assessment, and personal attention —
            because <span className="text-gold-300 font-semibold">{site.tagline}</span>.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <ButtonLink href="/contact" variant="gold" size="lg">
              Book an Admission <ArrowRight size={18} />
            </ButtonLink>
            <ButtonLink
              href="/courses"
              variant="outline"
              size="lg"
              className="border-ivory/30 text-ivory hover:bg-white/10 hover:border-ivory/60"
            >
              Explore Courses
            </ButtonLink>
          </div>
          <div className="mt-10 flex items-center gap-6 text-sm text-navy-100/70">
            <div className="flex -space-x-2">
              {["A", "R", "S", "K"].map((c) => (
                <span
                  key={c}
                  className="grid h-9 w-9 place-items-center rounded-full bg-gold-500 text-navy-800 text-xs font-bold ring-2 ring-navy-700"
                >
                  {c}
                </span>
              ))}
            </div>
            <p>
              <span className="text-ivory font-semibold">1200+ students</span> have
              learned with us.
            </p>
          </div>
        </div>

        <div className="reveal relative" style={{ animationDelay: "120ms" }}>
          <div className="relative rounded-3xl bg-gradient-to-br from-navy-600 to-navy-800 border border-white/10 p-8 shadow-[var(--shadow-lift)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-gold-400">
                  Result Snapshot
                </p>
                <p className="mt-1 font-serif text-2xl text-ivory">Class XII · 2025</p>
              </div>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold-500 text-navy-800">
                <Trophy size={22} />
              </span>
            </div>
            <div className="mt-7 space-y-4">
              {[
                { label: "Scored above 90%", val: "62%", w: "62%" },
                { label: "Scored above 75%", val: "88%", w: "88%" },
                { label: "Subject distinctions", val: "320+", w: "94%" },
              ].map((r) => (
                <div key={r.label}>
                  <div className="flex justify-between text-sm text-navy-100/80">
                    <span>{r.label}</span>
                    <span className="text-gold-300 font-semibold">{r.val}</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-500"
                      style={{ width: r.w }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-7 grid grid-cols-3 gap-3">
              {[
                { icon: BookOpen, t: "Daily" , s: "practice" },
                { icon: ClipboardCheck, t: "Weekly", s: "tests" },
                { icon: LineChart, t: "Monthly", s: "review" },
              ].map((b) => (
                <div key={b.t} className="rounded-xl bg-white/5 p-3 text-center">
                  <b.icon size={18} className="mx-auto text-gold-400" />
                  <p className="mt-1.5 text-sm font-semibold text-ivory">{b.t}</p>
                  <p className="text-xs text-navy-100/60">{b.s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="bg-navy-800 border-y border-white/5">
      <div className="container-page py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-serif text-3xl md:text-4xl font-bold text-gold-400">
              {s.value}
            </p>
            <p className="mt-1 text-sm text-navy-100/70">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const reasons = [
  {
    icon: Target,
    title: "Concept-first teaching",
    body: "Every topic is built from fundamentals, so students understand the 'why' — not just the 'how'.",
  },
  {
    icon: ClipboardCheck,
    title: "Relentless assessment",
    body: "Weekly tests, instant feedback and doubt-clearing keep every learner exam-ready.",
  },
  {
    icon: Users,
    title: "Small, focused batches",
    body: "Personal attention for each student with mentors who know them by name.",
  },
  {
    icon: LineChart,
    title: "Data-driven progress",
    body: "Performance tracked test-over-test, shared transparently with students and parents.",
  },
  {
    icon: ShieldCheck,
    title: "Discipline & values",
    body: "A structured, distraction-free environment that builds lasting study habits.",
  },
  {
    icon: GraduationCap,
    title: "Board + beyond",
    body: "Strong board preparation with orientation toward competitive examinations.",
  },
];

function WhyUs() {
  return (
    <section className="py-20 md:py-28">
      <div className="container-page">
        <SectionHeading
          eyebrow="Why Triple Entente"
          title="A method built for measurable growth"
          subtitle="We pair rigorous academics with genuine mentorship — the combination that turns effort into results."
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r) => (
            <Card key={r.title} className="p-7 hover:shadow-[var(--shadow-lift)] hover:-translate-y-1 transition-all duration-300">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-navy-700 text-gold-400">
                <r.icon size={22} />
              </span>
              <h3 className="mt-5 text-lg font-bold text-navy-700">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-500">{r.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Courses() {
  return (
    <section className="py-20 md:py-28 bg-ivory-dark/50">
      <div className="container-page">
        <SectionHeading
          eyebrow="Our Programmes"
          title="Two focused tracks, one standard of excellence"
          subtitle="Whether laying the foundation or mastering the senior syllabus, every programme is built for depth and discipline."
        />
        <div className="mt-14 grid gap-7 md:grid-cols-2">
          {courses.map((c) => (
            <Card key={c.slug} className="p-8 flex flex-col hover:shadow-[var(--shadow-lift)] transition-shadow">
              <div className="flex items-center justify-between">
                <Badge>{c.classes}</Badge>
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy-700 text-gold-400">
                  <GraduationCap size={20} />
                </span>
              </div>
              <h3 className="mt-5 font-serif text-2xl font-bold text-navy-700">
                {c.name}
              </h3>
              <p className="mt-1 text-gold-600 font-medium text-sm">{c.tagline}</p>
              <p className="mt-3 text-sm leading-relaxed text-navy-500">
                {c.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {c.subjects.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-navy-700/5 px-3 py-1 text-xs font-medium text-navy-600"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <Link
                href={`/courses#${c.slug}`}
                className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:text-gold-600 group"
              >
                View programme details
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  { n: "01", t: "Diagnose", d: "We assess each student's current level and learning gaps." },
  { n: "02", t: "Teach", d: "Concept-first classes with worked examples and practice." },
  { n: "03", t: "Test", d: "Frequent assessments reveal exactly what needs work." },
  { n: "04", t: "Refine", d: "Targeted revision and mentoring until mastery is reached." },
];

function Approach() {
  return (
    <section className="py-20 md:py-28">
      <div className="container-page">
        <SectionHeading
          eyebrow="The Triple Entente Method"
          title="A simple loop that compounds into results"
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.n} className="relative">
              <Card className="p-7 h-full">
                <span className="font-serif text-4xl font-bold text-gold-500/30">
                  {s.n}
                </span>
                <h3 className="mt-2 text-lg font-bold text-navy-700">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-500">{s.d}</p>
              </Card>
              {i < steps.length - 1 && (
                <ArrowRight
                  size={20}
                  className="hidden lg:block absolute top-1/2 -right-4 -translate-y-1/2 text-gold-500/50"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const toppers = [
  { name: "Aarav Sharma", score: "96.4%", note: "Class XII · Science" },
  { name: "Riya Verma", score: "95.2%", note: "Class X · Foundation" },
  { name: "Sahil Kumar", score: "94.8%", note: "Class XII · Science" },
];

function Results() {
  return (
    <section className="py-20 md:py-28 bg-navy-700 text-ivory relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40" aria-hidden />
      <div className="container-page relative">
        <SectionHeading
          light
          eyebrow="Proven Results"
          title="Our students don't just pass — they stand out"
          subtitle="A consistent record of distinctions, toppers, and confident, well-prepared students."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {toppers.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl bg-white/5 border border-white/10 p-7 text-center backdrop-blur-sm"
            >
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold-500 text-navy-800 font-serif text-xl font-bold">
                {t.name.split(" ").map((w) => w[0]).join("")}
              </span>
              <p className="mt-4 font-serif text-3xl font-bold text-gold-400">
                {t.score}
              </p>
              <p className="mt-1 font-semibold text-ivory">{t.name}</p>
              <p className="text-sm text-navy-100/60">{t.note}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <ButtonLink href="/results" variant="gold">
            See all results <ArrowRight size={16} />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

const quotes = [
  {
    body: "The teachers genuinely care. The weekly tests kept me on track and my board score jumped beyond what I expected.",
    name: "Ananya P.",
    role: "Class XII Graduate",
  },
  {
    body: "My son's concepts became rock solid in the Foundation programme. The progress reports kept us informed every step.",
    name: "Mr. Deshmukh",
    role: "Parent, Class IX",
  },
  {
    body: "Small batches meant I could ask any doubt without hesitation. Triple Entente built my confidence.",
    name: "Rohit S.",
    role: "Class XI Student",
  },
];

function Testimonials() {
  return (
    <section className="py-20 md:py-28">
      <div className="container-page">
        <SectionHeading
          eyebrow="What families say"
          title="Trusted by students and parents alike"
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {quotes.map((q) => (
            <Card key={q.name} className="p-7 flex flex-col">
              <Quote size={28} className="text-gold-500/40" />
              <p className="mt-3 text-navy-600 leading-relaxed flex-1">“{q.body}”</p>
              <div className="mt-5 flex items-center gap-3 pt-5 border-t border-navy-100">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-navy-700 text-gold-400 text-sm font-bold">
                  {q.name[0]}
                </span>
                <div>
                  <p className="font-semibold text-navy-700 text-sm">{q.name}</p>
                  <p className="text-xs text-navy-500">{q.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="pb-20 md:pb-28">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-600 to-navy-800 px-8 py-14 md:px-16 md:py-20 text-center shadow-[var(--shadow-lift)]">
          <div className="absolute -top-16 -right-10 h-64 w-64 rounded-full bg-gold-500/20 blur-3xl" aria-hidden />
          <div className="relative">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-ivory">
              Admissions are open for the new session
            </h2>
            <p className="mt-4 text-navy-100/80 max-w-xl mx-auto">
              Seats in each batch are limited to protect personal attention. Reserve
              a spot or visit us for a free counselling session.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <ButtonLink href="/contact" variant="gold" size="lg">
                Enquire Now <ArrowRight size={18} />
              </ButtonLink>
              <ButtonLink
                href={`tel:${site.phone}`}
                variant="outline"
                size="lg"
                className="border-ivory/30 text-ivory hover:bg-white/10 hover:border-ivory/60"
              >
                Call {site.phoneDisplay}
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
