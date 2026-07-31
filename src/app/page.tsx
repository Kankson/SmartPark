import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPinned, QrCode, ShieldCheck, WalletCards } from "lucide-react";

import { MobilityCommandPreview } from "@/components/mobility-command-preview";
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

export default function LandingPage() {
  return (
    <main className="min-h-screen" data-motion="page">
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

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
              <h2 className="mt-4 text-lg font-semibold text-ink">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-asphalt/75">{text}</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
