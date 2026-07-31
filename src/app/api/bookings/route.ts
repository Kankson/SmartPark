import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { createBooking } from "@/server/smartpark-service";

const createBookingSchema = z.object({
  vehicleId: z.string().min(1),
  zoneId: z.string().min(1),
  spotId: z.string().min(1),
  durationMinutes: z.coerce.number().int().positive()
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "driver") {
      return NextResponse.json({ error: "Driver login required." }, { status: 401 });
    }

    const body = createBookingSchema.parse(await request.json());
    const result = await createBooking({ ...body, driverId: user.id });
    return NextResponse.json({
      bookingId: result.booking.id,
      paymentStatus: result.payment.status,
      redirectUrl: result.redirectUrl
    });
  } catch (error) {
    return jsonError(error);
  }
}
