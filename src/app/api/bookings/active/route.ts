import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getActiveDriverBooking, getBookingDetails } from "@/server/smartpark-service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "driver") {
    return NextResponse.json({ error: "Driver login required." }, { status: 401 });
  }

  const booking = getActiveDriverBooking(user.id);
  return NextResponse.json({ booking, details: booking ? getBookingDetails(booking.id) : null });
}
