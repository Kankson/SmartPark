import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { cancelReservation } from "@/server/smartpark-service";

export async function POST(_request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "driver") {
      return NextResponse.json({ error: "Driver login required." }, { status: 401 });
    }

    const { bookingId } = await params;
    return NextResponse.json({ booking: cancelReservation(bookingId, user.id) });
  } catch (error) {
    return jsonError(error);
  }
}
