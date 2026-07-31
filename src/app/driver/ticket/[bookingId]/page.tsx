import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

import { StatusPill } from "@/components/status-pill";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { formatMoney } from "@/server/domain";
import { getBookingDetails } from "@/server/smartpark-service";

export default async function TicketPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const user = await requireRole(["driver"]);
  const { bookingId } = await params;
  const details = getBookingDetails(bookingId);

  if (!details || details.booking.driverId !== user.id) {
    return <Card>Booking was not found.</Card>;
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-mint">
          {details.qrPayload ? "QR parking ticket" : "Payment confirmation"}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-ink">{details.booking.bookingReference}</h1>
        {details.qrPayload ? (
          <>
            <div className="mx-auto mt-6 inline-flex rounded-lg border border-ink/10 bg-white p-4">
              <QRCodeSVG value={details.qrPayload} size={240} />
            </div>
            <p className="mt-4 text-sm text-asphalt/75">
              The QR contains only a secure random ticket token. No payment or personal data is embedded.
            </p>
          </>
        ) : (
          <div className="mt-6 rounded-md border border-amber-300 bg-amber-50 p-5 text-left">
            <p className="font-semibold text-ink">Waiting for payment confirmation</p>
            <p className="mt-2 text-sm leading-6 text-asphalt/75">
              Your space is temporarily held. SmartPark will issue the ticket after AZA sends a verified payment
              confirmation.
            </p>
            {details.checkoutUrl ? (
              <a
                href={details.checkoutUrl}
                className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-mint px-4 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Continue to AZA checkout
              </a>
            ) : null}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-ink">Booking details</h2>
          <StatusPill status={details.booking.status} />
        </div>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-asphalt/60">Zone</dt>
            <dd className="font-semibold text-ink">{details.zone?.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-asphalt/60">Space</dt>
            <dd className="font-semibold text-ink">{details.spot?.spotCode}</dd>
          </div>
          <div>
            <dt className="text-sm text-asphalt/60">Vehicle</dt>
            <dd className="font-semibold text-ink">{details.vehicle?.plateNumber}</dd>
          </div>
          <div>
            <dt className="text-sm text-asphalt/60">
              {details.payment?.status === "successful" ? "Amount paid" : "Amount due"}
            </dt>
            <dd className="font-semibold text-ink">
              {formatMoney(details.booking.amountMinor, details.booking.currency)}
            </dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          {details.qrPayload ? (
            <Link
              href="/driver/active"
              className="inline-flex h-11 items-center justify-center rounded-md bg-mint px-4 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Active session
            </Link>
          ) : null}
          <Link
            href="/driver/history"
            className="inline-flex h-11 items-center justify-center rounded-md border border-ink/15 bg-white px-4 text-sm font-semibold text-ink hover:bg-kerb"
          >
            Booking history
          </Link>
        </div>
      </Card>
    </div>
  );
}
