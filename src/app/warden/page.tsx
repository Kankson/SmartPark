import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CarFront,
  Clock3,
  Grid3X3,
  ParkingCircle,
  QrCode,
  Search,
  ShieldCheck,
  TimerReset
} from "lucide-react";

import { AutoRefresh } from "@/components/auto-refresh";
import { MetricCard } from "@/components/metric-card";
import { StatusPill } from "@/components/status-pill";
import { Card } from "@/components/ui/card";
import { getViolationPriority } from "@/server/domain";
import { getBookingDetails, getWardenDashboard } from "@/server/smartpark-service";

export default function WardenDashboardPage() {
  const dashboard = getWardenDashboard();
  const zones = dashboard.zones.map((zone) => ({
    ...zone,
    occupancyRate: Math.round(((zone.occupiedSpaces + zone.reservedSpaces + zone.heldSpaces) / zone.totalSpaces) * 100)
  }));

  return (
    <div className="space-y-6" data-motion="stagger">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-mint">Warden</p>
          <h1 className="mt-1 text-3xl font-bold text-ink">Parking dashboard</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <AutoRefresh />
          <Link
            href="/warden/scanner"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-mint px-4 text-sm font-semibold text-white hover:bg-emerald-700"
            data-lift
          >
            <QrCode size={17} aria-hidden="true" />
            Open scanner
          </Link>
          <Link
            href="/warden/plates"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-ink/15 bg-white px-4 text-sm font-semibold text-ink hover:bg-kerb"
            data-lift
          >
            <Search size={17} aria-hidden="true" />
            Plate check
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total spaces" value={dashboard.summary.totalSpaces} icon={Grid3X3} />
        <MetricCard label="Available" value={dashboard.summary.available} icon={ParkingCircle} />
        <MetricCard label="Occupied" value={dashboard.summary.occupied} icon={CarFront} tone="text-signal" />
        <MetricCard label="Open violations" value={dashboard.summary.openViolations} icon={AlertTriangle} tone="text-breach" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex items-center gap-2">
            <Activity className="text-signal" aria-hidden="true" />
            <h2 className="text-xl font-bold text-ink">Zone occupancy</h2>
          </div>
          <div className="mt-4 grid gap-4">
            {zones.map((zone) => (
              <div key={zone.id} className="rounded-md border border-ink/10 bg-lane p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">{zone.name}</p>
                    <p className="text-sm text-asphalt/70">{zone.availableSpaces} available of {zone.totalSpaces}</p>
                  </div>
                  <span className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-asphalt shadow-sm">
                    {zone.occupancyRate}% used
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className={`h-full rounded-full ${zone.occupancyRate > 80 ? "bg-breach" : zone.occupancyRate > 55 ? "bg-caution" : "bg-mint"}`}
                    style={{ width: `${zone.occupancyRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-ink text-white">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-mint">Enforcement queue</p>
              <h2 className="mt-1 text-2xl font-bold">Focus on overdue sessions first</h2>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-md bg-white/10 text-red-200">
              <AlertTriangle aria-hidden="true" />
            </span>
          </div>
          <div className="mt-5 grid gap-3">
            {dashboard.openViolations.length === 0 ? (
              <p className="rounded-md border border-white/10 bg-white/10 p-4 text-sm text-white/70">
                No open violations right now.
              </p>
            ) : (
              dashboard.openViolations.slice(0, 3).map((violation) => {
                const details = getBookingDetails(violation.bookingId);
                const priority = getViolationPriority(violation.overstayMinutes);
                return (
                  <Link
                    key={violation.id}
                    href="/warden/violations"
                    className="rounded-md border border-breach/30 bg-breach/20 p-4 text-white hover:bg-breach/25"
                    data-lift
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold">{details?.vehicle?.plateNumber ?? "Unknown plate"}</p>
                      <span className="text-right text-xs font-semibold text-red-100">
                        <span className="block uppercase">{priority}</span>
                        {violation.overstayMinutes} min over
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-white/70">
                      {details?.zone?.name} - {details?.spot?.spotCode}
                    </p>
                  </Link>
                );
              })
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2">
            <Clock3 className="text-signal" aria-hidden="true" />
            <h2 className="text-xl font-bold text-ink">Active sessions</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {dashboard.activeBookings.map((booking) => {
              const details = getBookingDetails(booking.id);
              return (
                <div key={booking.id} className="rounded-lg border border-ink/10 p-4" data-lift>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-ink">{booking.bookingReference}</p>
                    <StatusPill status={booking.status} />
                  </div>
                  <p className="mt-1 text-sm text-asphalt/70">
                    {details?.vehicle?.plateNumber} - {details?.zone?.name} - {details?.spot?.spotCode}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <TimerReset className="text-breach" aria-hidden="true" />
            <h2 className="text-xl font-bold text-ink">Expired sessions</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {dashboard.expiredBookings.map((booking) => {
              const details = getBookingDetails(booking.id);
              return (
                <div key={booking.id} className="rounded-lg border border-red-200 bg-red-50 p-4" data-lift>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-ink">{booking.bookingReference}</p>
                    <StatusPill status={booking.status} />
                  </div>
                  <p className="mt-1 text-sm text-asphalt/70">
                    {details?.vehicle?.plateNumber} - {details?.zone?.name} - {details?.spot?.spotCode}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-mint" aria-hidden="true" />
          <h2 className="text-xl font-bold text-ink">Recent verification activity</h2>
        </div>
        <div className="mt-4 grid gap-3">
          {dashboard.recentVerificationEvents.length === 0 ? (
            <p className="text-sm text-asphalt/70">No verification events yet.</p>
          ) : (
            dashboard.recentVerificationEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between rounded-lg border border-ink/10 p-4">
                <div>
                  <p className="font-semibold capitalize text-ink">{event.verificationType.replace("_", " ")}</p>
                  <p className="text-sm text-asphalt/60">{new Date(event.createdAt).toLocaleString()}</p>
                </div>
                <StatusPill status={event.result} />
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
