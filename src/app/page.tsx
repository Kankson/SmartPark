import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  Clock3,
  CreditCard,
  MapPinned,
  QrCode,
  ScanLine,
  ShieldCheck,
  WalletCards
} from "lucide-react";

import { MobilityCommandPreview } from "@/components/mobility-command-preview";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: MapPinned,
    title: "Live zone view",
    text: "Drivers see available spaces, price, and the zone closest to their destination."
  },
  {
    icon: WalletCards,
    title: "Wallet payment",
    text: "Bookings are paid through the demo wallet before a QR ticket is issued."
  },
  {
    icon: QrCode,
    title: "Gate-ready QR",
    text: "Wardens validate entry, status, and exit using the generated ticket."
  },
  {
    icon: ShieldCheck,
    title: "Warden control",
    text: "Expired sessions, plate checks, and verification history stay visible."
  }
];

const workflow = [
  { label: "Find zone", value: "map" },
  { label: "Set time", value: "timer" },
  { label: "Pay wallet", value: "paid" },
  { label: "Show QR", value: "valid" }
];

// Every figure here is countable in the source, so the page cannot drift away
// from the system it describes.
const stats = [
  { value: "3", label: "roles in one app", detail: "Driver, warden and admin" },
  { value: "10 min", label: "space hold", detail: "Released automatically if unpaid" },
  { value: "6", label: "booking durations", detail: "30 minutes through to 4 hours" },
  { value: "3", label: "QR validation modes", detail: "Entry, status check and exit" }
];

const steps = [
  {
    icon: MapPinned,
    title: "Pick a zone and space",
    text: "Compare live availability and price on the map, or scan the QR sign on a zone board. The chosen space is held while you pay."
  },
  {
    icon: CreditCard,
    title: "Pay at the official rate",
    text: "The server prices the booking from the zone rate and your chosen duration. Nothing the browser sends can change the amount."
  },
  {
    icon: QrCode,
    title: "Carry a QR ticket",
    text: "A reserved booking issues a ticket whose token is stored only as a hash. The code itself carries no plate, name or amount."
  },
  {
    icon: ScanLine,
    title: "Get validated on the spot",
    text: "A warden scans for entry, a status check, or exit. Overstays expire on their own and raise a violation for review."
  }
];

const roles = [
  {
    icon: MapPinned,
    name: "Driver",
    href: "/driver",
    summary: "Book a space, pay, and carry proof.",
    points: ["Map and live zone availability", "Vehicles and demo wallet", "Extend or cancel a session", "QR ticket and booking history"]
  },
  {
    icon: ScanLine,
    name: "Warden",
    href: "/warden",
    summary: "Verify what was paid for, on the street.",
    points: ["Scan tickets in entry, status or exit mode", "Search a plate when there is no ticket", "Live occupancy per zone", "Confirm or dismiss violations"]
  },
  {
    icon: ClipboardCheck,
    name: "Admin",
    href: "/admin",
    summary: "Run the zones behind the operation.",
    points: ["Zones with printable QR signs", "Spaces and capacity", "Warden accounts", "System settings"]
  }
];

const faqs = [
  {
    question: "Does SmartPark take real payments?",
    answer:
      "Not in this build. The demo wallet settles instantly so the whole flow can be shown offline. A hosted checkout provider sits behind the same interface and is enabled by configuration, but it needs merchant onboarding and a public HTTPS endpoint before real money moves."
  },
  {
    question: "What stops someone forging a QR ticket?",
    answer:
      "The ticket carries a random token and nothing else. Only a hash of that token is stored, so a forged code fails the lookup and a copy of the database does not yield working tickets."
  },
  {
    question: "What happens when a session runs out?",
    answer:
      "An expiry sweep moves the booking to expired and opens a violation with the overstay already counted. The warden confirms or dismisses it; the space returns to the pool on exit."
  },
  {
    question: "Can a driver reach the warden or admin screens?",
    answer:
      "No. Each role area checks the signed-in role on the server before any of its markup is produced. A driver who types an admin URL is redirected, not merely shown a page without links."
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main data-motion="page">
        <section className="relative isolate min-h-[88vh] overflow-hidden bg-ink text-white">
          <MobilityCommandPreview />
          <div className="absolute inset-0 bg-ink/70" />
          <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-end px-4 pb-12 pt-28 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-mint">Simplified smart parking</p>
              <h1 className="mt-3 text-5xl font-bold tracking-normal text-white sm:text-7xl">SmartPark</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/80">
                City-centre parking control for real-time zone booking, wallet payment, timer-based sessions, QR
                validation, violation alerts, and plate checks.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-mint px-4 text-sm font-semibold text-white hover:bg-emerald-700"
                data-lift
              >
                Open demo
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link
                href="/register"
                className="inline-flex h-11 items-center rounded-md border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
                data-lift
              >
                Register driver
              </Link>
            </div>

            <div className="mt-10 grid max-w-3xl gap-2 sm:grid-cols-4" data-motion="stagger">
              {workflow.map((item, index) => (
                <div key={item.label} className="rounded-md border border-white/15 bg-white/10 p-3 backdrop-blur">
                  <p className="text-xs text-white/55">0{index + 1}</p>
                  <p className="mt-1 text-sm font-bold text-white">{item.label}</p>
                  <p className="text-xs uppercase text-mint">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section aria-label="At a glance" className="border-b border-ink/10 bg-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8" data-motion="stagger">
            {stats.map((stat) => (
              <div key={stat.label} data-motion="metric">
                <p className="text-3xl font-bold text-ink">{stat.value}</p>
                <p className="mt-1 text-sm font-semibold text-ink">{stat.label}</p>
                <p className="mt-0.5 text-xs leading-5 text-asphalt/60">{stat.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-mint">Core experience</p>
              <h2 className="mt-1 text-3xl font-bold text-ink">Built around payment and verification</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-md border border-ink/10 bg-white px-3 py-2 text-sm font-semibold text-asphalt shadow-panel">
              <BadgeCheck className="text-mint" size={17} aria-hidden="true" />
              MVP ready for demo scenarios
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-motion="stagger">
            {features.map(({ icon: Icon, title, text }) => (
              <Card key={title}>
                <Icon className="text-mint" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-asphalt/75">{text}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 bg-white py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-mint">How it works</p>
            <h2 className="mt-1 max-w-2xl text-3xl font-bold text-ink">
              One loop, from an empty bay to a validated exit
            </h2>

            <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-motion="stagger">
              {steps.map(({ icon: Icon, title, text }, index) => (
                <li key={title} className="relative rounded-lg border border-ink/10 bg-lane p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-ink">
                      <Icon className="text-mint" size={19} aria-hidden="true" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wide text-asphalt/45">
                      Step {index + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-asphalt/75">{text}</p>
                </li>
              ))}
            </ol>

            <p className="mt-6 inline-flex items-center gap-2 text-sm text-asphalt/70">
              <Clock3 size={16} className="text-mint" aria-hidden="true" />
              An unpaid hold is released after ten minutes, so a space is never blocked by an abandoned checkout.
            </p>
          </div>
        </section>

        <section id="roles" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-mint">Three roles</p>
          <h2 className="mt-1 max-w-2xl text-3xl font-bold text-ink">The same record of truth, three ways in</h2>

          <div className="mt-8 grid gap-4 lg:grid-cols-3" data-motion="stagger">
            {roles.map(({ icon: Icon, name, href, summary, points }) => (
              <Card key={name} className="flex flex-col">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-md bg-mint/10">
                    <Icon className="text-mint" size={19} aria-hidden="true" />
                  </span>
                  <h3 className="text-lg font-semibold text-ink">{name}</h3>
                </div>
                <p className="mt-3 text-sm font-semibold text-asphalt">{summary}</p>
                <ul className="mt-3 flex-1 space-y-2">
                  {points.map((point) => (
                    <li key={point} className="flex gap-2 text-sm leading-6 text-asphalt/75">
                      <BadgeCheck className="mt-1 shrink-0 text-mint" size={14} aria-hidden="true" />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link
                  href={href}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-mint hover:text-emerald-700"
                >
                  Open {name.toLowerCase()} view
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </Card>
            ))}
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-4xl scroll-mt-24 px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-mint">Questions</p>
          <h2 className="mt-1 text-3xl font-bold text-ink">The four things people ask first</h2>

          <div className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-ink marker:content-none">
                  {faq.question}
                  <span
                    aria-hidden="true"
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-ink/15 text-asphalt/60 transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-6 text-asphalt/75">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-ink px-6 py-10 text-white sm:px-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold">See the whole loop end to end</h2>
                <p className="mt-3 text-base leading-7 text-white/70">
                  Sign in with a demo account and run it end to end: book a space, pay, carry the QR ticket, then switch
                  to the warden view and validate it.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-mint px-4 text-sm font-semibold text-white hover:bg-emerald-700"
                  data-lift
                >
                  Open demo
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-11 items-center rounded-md border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/20"
                  data-lift
                >
                  Register driver
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
