"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ParkingCircle } from "lucide-react";

import { cn } from "@/lib/utils";

const sections = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#roles", label: "Roles" },
  { href: "#faq", label: "FAQ" }
];

/**
 * Public header for the landing page. It sits over the dark hero while the page
 * is at the top and turns solid once the hero scrolls away, so the links stay
 * readable against both backgrounds.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-colors duration-300",
        scrolled ? "border-b border-ink/10 bg-white/95 backdrop-blur" : "border-b border-transparent"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className={cn("flex items-center gap-2 font-bold", scrolled ? "text-ink" : "text-white")}>
          <span className="relative grid h-9 w-9 place-items-center rounded-md bg-ink text-white">
            <ParkingCircle className="text-mint" aria-hidden="true" size={23} />
            <span
              className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-mint ring-2 ring-white"
              data-motion="pulse"
            />
          </span>
          <span>
            SmartPark
            <span
              className={cn(
                "block text-[11px] font-semibold uppercase",
                scrolled ? "text-asphalt/55" : "text-white/60"
              )}
            >
              city centre
            </span>
          </span>
        </Link>

        <nav aria-label="Page sections" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {sections.map((section) => (
              <li key={section.href}>
                <Link
                  href={section.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                    scrolled ? "text-asphalt/80 hover:bg-kerb hover:text-ink" : "text-white/75 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {section.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(
              "hidden h-10 items-center rounded-md px-3 text-sm font-semibold transition-colors sm:inline-flex",
              scrolled ? "text-ink hover:bg-kerb" : "text-white hover:bg-white/10"
            )}
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-mint px-3.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            data-lift
          >
            Get started
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
