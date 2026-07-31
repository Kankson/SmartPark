import { NextResponse } from "next/server";
import { z } from "zod";

import { jsonError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { extendBookingSession } from "@/server/smartpark-service";

const extendSchema = z.object({
  extensionMinutes: z.coerce.number().int()
});

export async function POST(request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "driver") {
      return NextResponse.json({ error: "Driver login required." }, { status: 401 });
    }

    const parsed = extendSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Choose a valid extension duration." }, { status: 400 });
    }

    const { bookingId } = await params;
    return NextResponse.json(
      await extendBookingSession({
        bookingId,
        driverId: user.id,
        extensionMinutes: parsed.data.extensionMinutes
      }),
    );
  } catch (error) {
    return jsonError(error);
  }
}
