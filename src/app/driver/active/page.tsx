import Link from "next/link";

import { ExtendSessionPanel } from "@/app/driver/active/extend-session-panel";
import { SessionAlerts } from "@/app/driver/active/session-alerts";
import { Countdown } from "@/components/countdown";
import { StatusPill } from "@/components/status-pill";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getActiveDriverBooking, getBookingDetails } from "@/server/smartpark-service";

export default async function ActiveSessionPage() {
  const user = await requireRole(["driver"]);
  const active = getActiveDriverBooking(user.id);
  const details = active ? getBookingDetails(active.id) : undefined;

  if (!active || !details) {
    return (
      <Card>
        <h1 className="text-2xl font-bold text-ink">No active session</h1>
        <p className="mt-2 text-sm text-asphalt/75">Book a space, pay, and validate entry to start the timer.</p>
        <Link href="/driver/map" className="mt-5 inline-flex font-semibold text-mint">
          Open parking map
        </Link>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-mint">Active parking</p>
            <h1 className="mt-1 text-3xl font-bold text-ink">{active.bookingReference}</h1>
          </div>
          <StatusPill status={active.status} />
        </div>
        <div className="mt-8 rounded-lg bg-ink p-6 text-white">
          <p className="text-sm text-white/70">Remaining time</p>
          <p className="mt-2 text-5xl font-bold">
            {active.status === "active" ? <Countdown endTime={active.endTime} /> : "Waiting"}
          </p>
          <p className="mt-3 text-sm text-white/70">
            Official status is calculated on the server. This display refreshes locally for convenience.
          </p>
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-asphalt/60">Zone</dt>
            <dd className="font-semibold text-ink">{details.zone?.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-asphalt/60">Space</dt>
            <dd className="font-semibold text-ink">{details.spot?.spotCode}</dd>
          </div>
          <div>
            <dt className="text-sm text-asphalt/60">Plate</dt>
            <dd className="font-semibold text-ink">{details.vehicle?.plateNumber}</dd>
          </div>
        </dl>
        {active.status === "active" ? (
          <SessionAlerts endTime={active.endTime} bookingReference={active.bookingReference} />
        ) : null}
        {active.status === "active" && details.zone ? (
          <ExtendSessionPanel
            bookingId={active.id}
            hourlyRateMinor={details.zone.hourlyRateMinor}
            currency={details.zone.currency}
          />
        ) : null}
        <Link
          href={`/driver/ticket/${active.id}`}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-mint px-4 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Show QR ticket
        </Link>
      </Card>
    </div>
  );
}
