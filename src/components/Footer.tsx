import Link from "next/link";
import { MapPin, Phone, Mail, Clock, Camera, Share2, Play } from "lucide-react";
import { Logo } from "@/components/Logo";
import { navLinks, courses, site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-auto bg-navy-700 text-navy-100">
      <div className="container-page py-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Logo light />
          <p className="mt-4 text-sm leading-relaxed text-navy-100/70 max-w-xs">
            {site.description}
          </p>
          <div className="mt-5 flex gap-3">
            <a href={site.social.instagram} aria-label="Instagram" className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 hover:bg-gold-500 hover:text-navy-800 transition-colors">
              <Camera size={17} />
            </a>
            <a href={site.social.facebook} aria-label="Facebook" className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 hover:bg-gold-500 hover:text-navy-800 transition-colors">
              <Share2 size={17} />
            </a>
            <a href={site.social.youtube} aria-label="YouTube" className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 hover:bg-gold-500 hover:text-navy-800 transition-colors">
              <Play size={17} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-ivory font-semibold text-sm uppercase tracking-wider mb-4">
            Explore
          </h4>
          <ul className="space-y-2.5 text-sm">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-navy-100/70 hover:text-gold-400 transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-ivory font-semibold text-sm uppercase tracking-wider mb-4">
            Programmes
          </h4>
          <ul className="space-y-2.5 text-sm">
            {courses.map((c) => (
              <li key={c.slug}>
                <Link href={`/courses#${c.slug}`} className="text-navy-100/70 hover:text-gold-400 transition-colors">
                  {c.name} <span className="text-navy-100/40">· {c.classes}</span>
                </Link>
              </li>
            ))}
            <li>
              <Link href="/login" className="text-navy-100/70 hover:text-gold-400 transition-colors">
                Student / Parent Login
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-ivory font-semibold text-sm uppercase tracking-wider mb-4">
            Reach Us
          </h4>
          <ul className="space-y-3 text-sm text-navy-100/70">
            <li className="flex gap-3">
              <MapPin size={17} className="text-gold-400 shrink-0 mt-0.5" />
              <span>{site.address.full}, {site.address.city}</span>
            </li>
            <li className="flex gap-3">
              <Phone size={17} className="text-gold-400 shrink-0 mt-0.5" />
              <a href={`tel:${site.phone}`} className="hover:text-gold-400">{site.phoneDisplay}</a>
            </li>
            <li className="flex gap-3">
              <Mail size={17} className="text-gold-400 shrink-0 mt-0.5" />
              <a href={`mailto:${site.email}`} className="hover:text-gold-400 break-all">{site.email}</a>
            </li>
            <li className="flex gap-3">
              <Clock size={17} className="text-gold-400 shrink-0 mt-0.5" />
              <span>{site.hours}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-navy-100/60">
          <p>© {site.established}–{new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p>“{site.tagline}”</p>
        </div>
      </div>
    </footer>
  );
}
