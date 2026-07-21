"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { navLinks, site } from "@/lib/site";
import { cn } from "@/lib/cn";

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-ivory/85 backdrop-blur-md border-b border-navy-100 shadow-[0_4px_20px_-12px_rgba(13,27,62,0.4)]"
          : "bg-transparent"
      )}
    >
      <nav className="container-page flex items-center justify-between h-20 py-3">
        <Logo />

        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-full transition-colors",
                  active
                    ? "text-navy-700"
                    : "text-navy-500 hover:text-navy-700"
                )}
              >
                {link.label}
                {active && (
                  <span className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-gold-500" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <a
            href={`tel:${site.phone}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-navy-700 hover:text-gold-600"
          >
            <Phone size={16} /> {site.phoneDisplay}
          </a>
          <ButtonLink href="/contact" variant="gold" size="sm">
            Admissions
          </ButtonLink>
        </div>

        <button
          className="lg:hidden grid h-11 w-11 place-items-center rounded-xl text-navy-700 hover:bg-navy-700/5"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "lg:hidden overflow-hidden transition-[max-height] duration-300 bg-ivory border-b border-navy-100",
          open ? "max-h-[28rem]" : "max-h-0"
        )}
      >
        <div className="container-page py-4 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-3 rounded-xl text-navy-600 font-medium hover:bg-navy-700/5"
            >
              {link.label}
            </Link>
          ))}
          <ButtonLink href="/contact" variant="gold" className="mt-2">
            Book an Admission
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
