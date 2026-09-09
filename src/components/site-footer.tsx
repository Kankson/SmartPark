import Link from "next/link";
import { ParkingCircle } from "lucide-react";

const columns = [
  {
    heading: "Product",
    links: [
      { href: "#features", label: "Features" },
      { href: "#how-it-works", label: "How it works" },
      { href: "#roles", label: "Roles" },
      { href: "#faq", label: "FAQ" }
    ]
  },
  {
    heading: "Sign in as",
    links: [
      { href: "/driver", label: "Driver" },
      { href: "/warden", label: "Warden" },
      { href: "/admin", label: "Admin" },
      { href: "/register", label: "Register a driver" }
    ]
  },
  {
    heading: "Account",
    links: [
      { href: "/login", label: "Log in" },
      { href: "/forgot-password", label: "Forgot password" },
      { href: "/terms", label: "Terms of use" },
      { href: "/privacy", label: "Privacy" }
    ]
  }
];

export function SiteFooter() {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 font-bold text-white">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-white/10">
                <ParkingCircle className="text-mint" aria-hidden="true" size={23} />
              </span>
              SmartPark
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/60">
              City-centre parking control: real-time zone booking, wallet payment, timer-based sessions, QR validation
              and plate checks, all decided server-side.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70">
              <span className="h-2 w-2 rounded-full bg-mint" aria-hidden="true" />
              Demo build &mdash; no real payments are taken
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="text-xs font-bold uppercase tracking-wide text-mint">{column.heading}</h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/65 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} SmartPark. Built as a smart parking management MVP.</p>
          <p>Role links lead to the login screen until you are signed in.</p>
        </div>
      </div>
    </footer>
  );
}
