import type { Metadata } from "next";
import { Target, Eye, Heart, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, SectionHeading } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { stats, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Triple Entente — our mission, values, and the disciplined teaching philosophy behind our results.",
};

const values = [
  { icon: Target, t: "Mission", d: "To help every student reach their academic best through structured teaching, honest feedback, and steady mentorship." },
  { icon: Eye, t: "Vision", d: "To be the most trusted name in our region for foundation and senior-secondary coaching — known for results and integrity." },
  { icon: Heart, t: "Values", d: "Discipline, transparency, and genuine care for each learner's growth — academically and personally." },
];

const principles = [
  "Concept clarity before speed or shortcuts",
  "Every student known by name, not by number",
  "Regular, honest communication with parents",
  "Assessment-driven, personalised improvement",
  "A calm, focused, distraction-free environment",
  "Affordable, high-quality coaching for all",
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About Us"
        title="Mentoring with method and heart"
        subtitle={`Since ${site.established}, ${site.name} has been guiding students of Foundation and senior classes toward results they're proud of.`}
      />

      <section className="py-20 md:py-24">
        <div className="container-page grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Our Story"
              title="Built on a simple belief"
            />
            <div className="mt-6 space-y-4 text-navy-500 leading-relaxed">
              <p>
                {site.name} began with one conviction — that consistent effort,
                guided well, beats raw talent left unattended. Our name reflects the
                alliance at the centre of every success story: the{" "}
                <span className="font-semibold text-navy-700">student</span>, the{" "}
                <span className="font-semibold text-navy-700">teacher</span>, and the{" "}
                <span className="font-semibold text-navy-700">parent</span>, working
                together.
              </p>
              <p>
                We focus on two stages where strong mentoring matters most: the
                Foundation years (Class 8–10), where habits and fundamentals are
                set, and Class 11–12, where mastery and exam temperament decide
                outcomes. In both, our promise is the same — <span className="italic">{site.tagline}</span>.
              </p>
            </div>
            <div className="mt-8">
              <ButtonLink href="/contact" variant="primary">
                Visit our campus
              </ButtonLink>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {stats.map((s) => (
              <Card key={s.label} className="p-7 text-center">
                <p className="font-serif text-4xl font-bold text-gold-500">{s.value}</p>
                <p className="mt-2 text-sm text-navy-500">{s.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24 bg-ivory-dark/50">
        <div className="container-page">
          <SectionHeading
            eyebrow="What drives us"
            title="Mission, vision & values"
          />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {values.map((v) => (
              <Card key={v.t} className="p-8">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-navy-700 text-gold-400">
                  <v.icon size={22} />
                </span>
                <h3 className="mt-5 font-serif text-xl font-bold text-navy-700">{v.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-500">{v.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="container-page grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <div className="rounded-3xl bg-gradient-to-br from-navy-600 to-navy-800 p-10 text-ivory shadow-[var(--shadow-lift)]">
              <p className="font-serif text-2xl leading-relaxed">
                “We don't chase marks. We build understanding — and the marks follow.”
              </p>
              <p className="mt-6 text-gold-400 font-semibold">— The {site.name} Faculty</p>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <SectionHeading
              align="left"
              eyebrow="Our Principles"
              title="The standards we hold ourselves to"
            />
            <ul className="mt-7 space-y-3.5">
              {principles.map((p) => (
                <li key={p} className="flex gap-3 text-navy-600">
                  <CheckCircle2 size={20} className="text-gold-500 shrink-0 mt-0.5" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
