import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Page not found"
};

const destinations = [
  { href: "/driver", label: "Driver home", description: "Book a space, view your ticket or session." },
  { href: "/warden", label: "Warden home", description: "Scan tickets, search plates, review violations." },
  { href: "/admin", label: "Admin home", description: "Manage zones, spaces and wardens." }
];

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <p className="text-sm font-semibold uppercase tracking-wide text-mint">Error 404</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-asphalt/75">
          That SmartPark page does not exist. It may have been moved, or the link may be out of date.
        </p>

        <nav aria-label="Suggested pages" className="mt-6 flex flex-col gap-2">
          {destinations.map((destination) => (
            <Link
              key={destination.href}
              href={destination.href}
              className="rounded-md border border-ink/10 px-4 py-3 transition hover:border-mint/40 hover:bg-kerb"
            >
              <span className="block text-sm font-semibold text-ink">{destination.label}</span>
              <span className="mt-0.5 block text-xs text-asphalt/70">{destination.description}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-5 flex justify-between text-sm">
          <Link href="/" className="font-semibold text-mint">
            Back to start
          </Link>
          <Link href="/login" className="font-semibold text-ink hover:text-mint">
            Sign in
          </Link>
        </div>
      </Card>
    </main>
  );
}
