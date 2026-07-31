import Link from "next/link";

import { BookingForm } from "@/app/driver/book/[zoneId]/booking-form";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getZone, listAvailableSpots, listDriverVehicles } from "@/server/smartpark-service";

export default async function BookingPage({ params }: { params: Promise<{ zoneId: string }> }) {
  const user = await requireRole(["driver"]);
  const { zoneId } = await params;
  const zone = getZone(zoneId);
  const spots = listAvailableSpots(zoneId);
  const vehicles = listDriverVehicles(user.id);

  if (!zone) {
    return <Card>Parking zone was not found.</Card>;
  }

  if (vehicles.length === 0) {
    return (
      <Card>
        <h1 className="text-2xl font-bold text-ink">Add a vehicle first</h1>
        <p className="mt-2 text-sm text-asphalt/75">A booking must be linked to a driver vehicle.</p>
        <Link href="/driver/vehicles" className="mt-5 inline-flex font-semibold text-mint">
          Add vehicle
        </Link>
      </Card>
    );
  }

  return <BookingForm zone={zone} spots={spots} vehicles={vehicles} />;
}
