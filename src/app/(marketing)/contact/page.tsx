import type { Metadata } from "next";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { InquiryForm } from "./InquiryForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact & Admissions",
  description:
    "Get in touch with Triple Entente for admissions, counselling or a campus visit.",
};

const details = [
  { icon: MapPin, label: "Visit us", value: `${site.address.full}, ${site.address.city}` },
  { icon: Phone, label: "Call us", value: site.phoneDisplay, href: `tel:${site.phone}` },
  { icon: Mail, label: "Email us", value: site.email, href: `mailto:${site.email}` },
  { icon: Clock, label: "Hours", value: site.hours },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact & Admissions"
        title="Let's talk about your goals"
        subtitle="Reach out for admissions, a free counselling session, or just to see the campus. We'd love to meet you."
      />

      <section className="py-20 md:py-24">
        <div className="container-page grid lg:grid-cols-2 gap-10">
          <div>
            <div className="space-y-4">
              {details.map((d) => (
                <Card key={d.label} className="p-5 flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-navy-700 text-gold-400">
                    <d.icon size={20} />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-navy-400 font-semibold">
                      {d.label}
                    </p>
                    {d.href ? (
                      <a href={d.href} className="text-navy-700 font-medium hover:text-gold-600">
                        {d.value}
                      </a>
                    ) : (
                      <p className="text-navy-700 font-medium">{d.value}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <a
              href={site.social.whatsapp}
              className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-gold-500 text-navy-800 font-semibold py-4 hover:bg-gold-400 transition-colors shadow-[var(--shadow-card)]"
            >
              <MessageCircle size={18} /> Chat with us on WhatsApp
            </a>

            <div className="mt-4 rounded-2xl overflow-hidden border border-navy-100 h-56 bg-gradient-to-br from-navy-600 to-navy-800 relative">
              <div className="absolute inset-0 bg-grid opacity-30" aria-hidden />
              <div className="absolute inset-0 grid place-items-center text-center text-ivory">
                <div>
                  <MapPin size={28} className="mx-auto text-gold-400" />
                  <p className="mt-2 font-serif text-lg">{site.address.full}</p>
                  <p className="text-sm text-navy-100/70">{site.address.city}</p>
                </div>
              </div>
            </div>
          </div>

          <InquiryForm />
        </div>
      </section>
    </>
  );
}
