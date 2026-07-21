import type { Metadata } from "next";
import { Camera } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Gallery",
  description: "A glimpse into life at Triple Entente — classes, events and celebrations.",
};

// Placeholder gallery tiles — swap captions/images with real photos later.
const tiles = [
  { t: "Classroom in session", h: "tall", grad: "from-navy-600 to-navy-800" },
  { t: "Felicitation day", h: "short", grad: "from-gold-500 to-gold-600" },
  { t: "Doubt-clearing hour", h: "short", grad: "from-navy-500 to-navy-700" },
  { t: "Toppers of 2025", h: "tall", grad: "from-navy-700 to-navy-900" },
  { t: "Science practicals", h: "short", grad: "from-gold-400 to-gold-500" },
  { t: "Parent–teacher meet", h: "short", grad: "from-navy-600 to-navy-800" },
  { t: "Annual test drive", h: "tall", grad: "from-navy-500 to-navy-700" },
  { t: "Independence Day", h: "short", grad: "from-gold-500 to-gold-600" },
];

export default function GalleryPage() {
  return (
    <>
      <PageHeader
        eyebrow="Gallery"
        title="Moments from our campus"
        subtitle="Learning, milestones and the everyday energy that makes Triple Entente special."
      />

      <section className="py-20 md:py-24">
        <div className="container-page">
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 [&>*]:mb-5">
            {tiles.map((tile, i) => (
              <div
                key={i}
                className={`break-inside-avoid rounded-2xl bg-gradient-to-br ${tile.grad} ${
                  tile.h === "tall" ? "h-72" : "h-52"
                } relative overflow-hidden group shadow-[var(--shadow-card)]`}
              >
                <div className="absolute inset-0 bg-grid opacity-30" aria-hidden />
                <div className="absolute inset-0 flex flex-col justify-between p-5">
                  <Camera size={22} className="text-white/60" />
                  <p className="font-serif text-lg font-semibold text-white">
                    {tile.t}
                  </p>
                </div>
                <div className="absolute inset-0 bg-navy-900/0 group-hover:bg-navy-900/20 transition-colors" />
              </div>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-navy-400">
            Photos are illustrative placeholders — real campus photos can be added here.
          </p>

          <div className="mt-8 text-center">
            <ButtonLink href="/contact" variant="primary">
              Schedule a campus visit
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
