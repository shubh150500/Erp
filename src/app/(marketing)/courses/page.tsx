import type { Metadata } from "next";
import { CheckCircle2, Clock, BookOpen, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { courses } from "@/lib/site";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Explore Triple Entente's programmes — Foundation (Class 8–10) and Class 11–12 — with subjects, highlights and structure.",
};

export default function CoursesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Our Programmes"
        title="Courses designed for depth"
        subtitle="Two focused tracks, each built around concept mastery, constant assessment, and personal mentoring."
      />

      <section className="py-20 md:py-24">
        <div className="container-page space-y-12">
          {courses.map((c, i) => (
            <Card
              key={c.slug}
              id={c.slug}
              className="overflow-hidden scroll-mt-24"
            >
              <div className="grid lg:grid-cols-5">
                <div
                  className={`lg:col-span-2 bg-gradient-to-br from-navy-600 to-navy-800 text-ivory p-9 flex flex-col justify-between ${
                    i % 2 ? "lg:order-2" : ""
                  }`}
                >
                  <div>
                    <Badge className="bg-gold-500/20 text-gold-300">{c.classes}</Badge>
                    <h2 className="mt-4 font-serif text-3xl font-bold">{c.name}</h2>
                    <p className="mt-2 text-gold-300 font-medium">{c.tagline}</p>
                    <p className="mt-4 text-sm text-navy-100/80 leading-relaxed">
                      {c.description}
                    </p>
                  </div>
                  <div className="mt-8 flex items-center gap-2 text-sm text-navy-100/70">
                    <Clock size={16} className="text-gold-400" />
                    {c.duration}
                  </div>
                </div>

                <div className="lg:col-span-3 p-9">
                  <div className="flex items-center gap-2 text-navy-700">
                    <BookOpen size={18} className="text-gold-500" />
                    <h3 className="font-semibold">Subjects covered</h3>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {c.subjects.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-navy-700/5 px-3.5 py-1.5 text-sm font-medium text-navy-600"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  <h3 className="mt-7 font-semibold text-navy-700">Programme highlights</h3>
                  <ul className="mt-3 grid sm:grid-cols-2 gap-3">
                    {c.highlights.map((h) => (
                      <li key={h} className="flex gap-2.5 text-sm text-navy-600">
                        <CheckCircle2 size={18} className="text-gold-500 shrink-0 mt-0.5" />
                        {h}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <ButtonLink href="/contact" variant="gold">
                      Enquire about this programme <ArrowRight size={16} />
                    </ButtonLink>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
