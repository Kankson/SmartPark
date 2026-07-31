import Link from "next/link";
import { BadgeCheck, Clock3, History, MapPinned, QrCode, Route, ScanLine, WalletCards } from "lucide-react";

import { MetricCard } from "@/components/metric-card";
import { StatusPill } from "@/components/status-pill";
import { Card, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { formatMoney } from "@/server/domain";
import { getActiveDriverBooking, getBookingDetails, getWallet, listDriverBookings } from "@/server/smartpark-service";

export default async function DriverDashboardPage() {
  const user = await requireRole(["driver"]);
  const wallet = getWallet(user.id);
  const active = getActiveDriverBooking(user.id);
  const activeDetails = active ? getBookingDetails(active.id) : undefined;
  const history = listDriverBookings(user.id);
  const flow = [
    { label: "Choose zone", value: "Map", icon: MapPinned },
    { label: "Reserve time", value: "Timer", icon: Clock3 },
    { label: "Pay safely", value: "Wallet", icon: WalletCards },
    { label: "Enter lot", value: "QR", icon: QrCode }
  ];

  return (
    <div className="space-y-6" data-motion="stagger">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-mint">Driver</p>
          <h1 className="mt-1 text-3xl font-bold text-ink">Parking dashboard</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/driver/scan"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-mint px-4 text-sm font-semibold text-white hover:bg-emerald-700"
            data-lift
          >
            <ScanLine size={17} aria-hidden="true" />
            Scan zone
          </Link>
          <Link
            href={active ? "/driver/active" : "/driver/map"}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-ink/15 bg-white px-4 text-sm font-semibold text-ink hover:bg-kerb"
            data-lift
          >
            {active ? <Clock3 size={17} aria-hidden="true" /> : <Route size={17} aria-hidden="true" />}
            {active ? "Active session" : "Find parking"}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden bg-ink p-0 text-white">
          <div className="relative p-5">
            <div className="absolute right-5 top-5 h-3 w-3 rounded-full bg-mint" data-motion="pulse" />
            <p className="text-sm font-semibold uppercase tracking-wide text-mint">Next move</p>
            <h2 className="mt-2 max-w-xl text-2xl font-bold">
              {active ? "Keep your active parking pass ready." : "Find a space, pay once, and arrive with a valid QR pass."}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
              {active && activeDetails
                ? `${activeDetails.zone?.name} is linked to ${activeDetails.vehicle?.plateNumber}. Wardens can verify the same booking with QR or plate search.`
                : "SmartPark follows a simple driver path: choose a zone, reserve a spot, pay from wallet, then present the QR ticket at entry or exit."}
            </p>
            <Link
              href={active ? `/driver/ticket/${active.id}` : "/driver/map"}
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-ink hover:bg-kerb"
              data-lift
            >
              {active ? "Open QR pass" : "Start booking"}
              <QrCode size={17} aria-hidden="true" />
            </Link>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <BadgeCheck className="text-mint" aria-hidden="true" />
            <h2 className="text-lg font-bold text-ink">Booking flow</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {flow.map(({ label, value, icon: Icon }, index) => (
              <div key={label} className="flex items-center gap-3 rounded-md border border-ink/10 bg-lane p-3">
                <span className="grid h-9 w-9 place-items-center rounded-md bg-white text-mint shadow-sm">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{label}</p>
                  <p className="text-xs uppercase text-asphalt/55">0{index + 1} - {value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Wallet balance" value={formatMoney(wallet.account?.balanceMinor ?? 0)} icon={WalletCards} />
        <MetricCard label="Active booking" value={active ? active.status.replace("_", " ") : "None"} icon={Clock3} />
        <MetricCard label="Booking history" value={history.length} icon={History} tone="text-signal" />
      </div>

      <Card>
        <CardTitle>Current parking</CardTitle>
        {active && activeDetails ? (
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xl font-semibold text-ink">{active.bookingReference}</p>
                <StatusPill status={active.status} />
              </div>
              <p className="mt-2 text-sm text-asphalt/75">
                {activeDetails.zone?.name} - {activeDetails.spot?.spotCode} - {activeDetails.vehicle?.plateNumber}
              </p>
            </div>
            <Link
              href={`/driver/ticket/${active.id}`}
              className="inline-flex h-11 items-center justify-center rounded-md border border-ink/15 bg-white px-4 text-sm font-semibold text-ink hover:bg-kerb"
            >
              View QR ticket
            </Link>
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-dashed border-ink/20 bg-lane p-8 text-center">
            <MapPinned className="mx-auto text-mint" aria-hidden="true" />
            <p className="mt-3 font-semibold text-ink">No active booking yet</p>
            <p className="mt-1 text-sm text-asphalt/70">Choose a parking zone and pay with the demo wallet.</p>
          </div>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/driver/vehicles" className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel hover:bg-lane" data-lift>
          <p className="font-semibold text-ink">Vehicles</p>
          <p className="mt-1 text-sm text-asphalt/70">Add or review plates linked to your bookings.</p>
        </Link>
        <Link href="/driver/wallet" className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel hover:bg-lane" data-lift>
          <p className="font-semibold text-ink">Wallet</p>
          <p className="mt-1 text-sm text-asphalt/70">Review demo balance and payment ledger entries.</p>
        </Link>
      </div>
    </div>
  );
}
