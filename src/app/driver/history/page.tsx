import Link from "next/link";

import { StatusPill } from "@/components/status-pill";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { formatMoney } from "@/server/domain";
import { getBookingDetails, listDriverBookings } from "@/server/smartpark-service";

export default async function HistoryPage() {
  const user = await requireRole(["driver"]);
  const bookings = listDriverBookings(user.id);

  return (
    <Card>
      <h1 className="text-2xl font-bold text-ink">Booking history</h1>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-asphalt/60">
            <tr>
              <th className="py-3">Reference</th>
              <th>Zone</th>
              <th>Space</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {bookings.map((booking) => {
              const details = getBookingDetails(booking.id);
              return (
                <tr key={booking.id}>
                  <td className="py-3 font-semibold text-ink">{booking.bookingReference}</td>
                  <td>{details?.zone?.name}</td>
                  <td>{details?.spot?.spotCode}</td>
                  <td>{formatMoney(booking.amountMinor, booking.currency)}</td>
                  <td>
                    <StatusPill status={booking.status} />
                  </td>
                  <td>
                    <Link href={`/driver/ticket/${booking.id}`} className="font-semibold text-mint">
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
