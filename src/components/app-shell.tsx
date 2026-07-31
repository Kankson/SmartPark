import Link from "next/link";
import { LogOut, ParkingCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { type DemoUser } from "@/server/domain";

export function AppShell({
  user,
  nav,
  children
}: {
  user: DemoUser;
  nav: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-white/95 shadow-[0_8px_26px_rgba(23,33,43,0.05)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-ink">
            <span className="relative grid h-9 w-9 place-items-center rounded-md bg-ink text-white">
              <ParkingCircle className="text-mint" aria-hidden="true" size={23} />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-mint ring-2 ring-white" data-motion="pulse" />
            </span>
            <span>
              SmartPark
              <span className="block text-[11px] font-semibold uppercase text-asphalt/55">city centre</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-semibold text-asphalt transition hover:bg-kerb hover:text-ink"
                data-lift
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-sm sm:block">
              <p className="font-semibold text-ink">{user.fullName}</p>
              <p className="capitalize text-asphalt/70">{user.role} mode</p>
            </div>
            <span className="hidden rounded-md border border-mint/20 bg-mint/10 px-2.5 py-1 text-xs font-bold uppercase text-mint sm:inline-flex">
              live
            </span>
            <form action="/api/logout" method="post">
              <Button variant="secondary" className="h-10 px-3" title="Log out" aria-label="Log out">
                <LogOut size={16} aria-hidden="true" />
              </Button>
            </form>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-ink/10 px-4 py-2 md:hidden" aria-label="Mobile">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold text-asphalt hover:bg-kerb"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8" data-motion="page">
        {children}
      </main>
    </div>
  );
}
