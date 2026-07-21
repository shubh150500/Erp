import type { Metadata } from "next";
import { Trophy, TrendingUp, Star } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, SectionHeading, Badge } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Results",
  description:
    "Triple Entente's track record — toppers, distinctions and year-on-year academic excellence.",
};

const toppers = [
  { name: "Aarav Sharma", score: "96.4%", cls: "Class XII · Science", year: "2025" },
  { name: "Riya Verma", score: "95.2%", cls: "Class X · Foundation", year: "2025" },
  { name: "Sahil Kumar", score: "94.8%", cls: "Class XII · Science", year: "2025" },
  { name: "Ishita Roy", score: "94.1%", cls: "Class X · Foundation", year: "2024" },
  { name: "Karan Mehta", score: "93.6%", cls: "Class XII · Science", year: "2024" },
  { name: "Pooja Nair", score: "93.0%", cls: "Class X · Foundation", year: "2024" },
];

const highlights = [
  { icon: Trophy, value: "30+", label: "District-level toppers" },
  { icon: Star, value: "95%", label: "Students with distinction" },
  { icon: TrendingUp, value: "+18%", label: "Avg. score improvement" },
];

const bands = [
  { label: "Above 90%", pct: 62 },
  { label: "75% – 90%", pct: 31 },
  { label: "60% – 75%", pct: 7 },
];

export default function ResultsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Our Results"
        title="A record we're proud of"
        subtitle="Consistent, year-on-year excellence — driven by method, mentoring and effort."
      />

      <section className="py-16 md:py-20">
        <div className="container-page grid gap-6 sm:grid-cols-3">
          {highlights.map((h) => (
            <Card key={h.label} className="p-8 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-navy-700 text-gold-400">
                <h.icon size={24} />
              </span>
              <p className="mt-4 font-serif text-4xl font-bold text-gold-500">{h.value}</p>
              <p className="mt-1 text-sm text-navy-500">{h.label}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="pb-4">
        <div className="container-page">
          <Card className="p-8 md:p-10">
            <SectionHeading
              align="left"
              eyebrow="Class XII · 2025"
              title="How our latest batch performed"
            />
            <div className="mt-8 space-y-6 max-w-2xl">
              {bands.map((b) => (
                <div key={b.label}>
                  <div className="flex justify-between text-sm font-medium text-navy-600">
                    <span>{b.label}</span>
                    <span className="text-gold-600">{b.pct}%</span>
                  </div>
                  <div className="mt-2 h-3 rounded-full bg-navy-700/8 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-500"
                      style={{ width: `${b.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container-page">
          <SectionHeading eyebrow="Our Toppers" title="Faces of hard work" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {toppers.map((t) => (
              <Card key={t.name} className="p-7 flex items-center gap-4 hover:shadow-[var(--shadow-lift)] transition-shadow">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-navy-600 to-navy-800 text-gold-400 font-serif text-lg font-bold">
                  {t.name.split(" ").map((w) => w[0]).join("")}
                </span>
                <div className="min-w-0">
                  <p className="font-serif text-2xl font-bold text-gold-500">{t.score}</p>
                  <p className="font-semibold text-navy-700 truncate">{t.name}</p>
                  <p className="text-xs text-navy-500">{t.cls}</p>
                </div>
                <Badge className="ml-auto shrink-0">{t.year}</Badge>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20 md:pb-24">
        <div className="container-page text-center">
          <p className="text-navy-500">Want your child to be on this wall next year?</p>
          <div className="mt-5">
            <ButtonLink href="/contact" variant="gold" size="lg">
              Start the admission process
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
