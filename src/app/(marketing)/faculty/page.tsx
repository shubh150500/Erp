import type { Metadata } from "next";
import { GraduationCap, Award } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, SectionHeading } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Faculty",
  description:
    "Meet the experienced, dedicated teachers behind Triple Entente's results.",
};

const faculty = [
  { name: "Ayush Anand", subject: "Physics & Mathematics", exp: "10+ yrs", role: "Founder & Lead Mentor", note: "Known for making the hardest concepts feel effortless." },
  { name: "S. Priya", subject: "Chemistry", exp: "8 yrs", role: "Senior Faculty", note: "Turns reactions and mechanisms into clear, memorable logic." },
  { name: "R. Kumar", subject: "Biology", exp: "9 yrs", role: "Senior Faculty", note: "Diagrams, mnemonics, and crystal-clear NEET-style teaching." },
  { name: "M. Sinha", subject: "Mathematics (Foundation)", exp: "7 yrs", role: "Foundation Faculty", note: "Builds rock-solid arithmetic and reasoning from the ground up." },
  { name: "N. Gupta", subject: "Science (Foundation)", exp: "6 yrs", role: "Foundation Faculty", note: "Hands-on, curiosity-led teaching for Classes 8–10." },
  { name: "A. Verma", subject: "English & Mentoring", exp: "8 yrs", role: "Faculty & Counsellor", note: "Communication skills plus the pastoral support students need." },
];

export default function FacultyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Our Faculty"
        title="Teachers who make the difference"
        subtitle="Experienced, approachable mentors who care as much about your child's habits as their marks."
      />

      <section className="py-20 md:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Meet the team"
            title="The people behind the results"
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {faculty.map((f) => (
              <Card key={f.name} className="p-7 text-center hover:shadow-[var(--shadow-lift)] hover:-translate-y-1 transition-all duration-300">
                <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-navy-600 to-navy-800 text-gold-400 font-serif text-2xl font-bold">
                  {f.name.split(" ").map((w) => w[0]).join("")}
                </span>
                <h3 className="mt-4 font-serif text-xl font-bold text-navy-700">{f.name}</h3>
                <p className="text-sm font-semibold text-gold-600">{f.subject}</p>
                <div className="mt-3 flex items-center justify-center gap-4 text-xs text-navy-500">
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap size={14} className="text-gold-500" /> {f.role}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Award size={14} className="text-gold-500" /> {f.exp}
                  </span>
                </div>
                <p className="mt-4 text-sm text-navy-500 leading-relaxed border-t border-navy-100 pt-4">
                  {f.note}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
