import { NextResponse } from "next/server";

import { listAvailableSpots } from "@/server/smartpark-service";

export async function GET(_request: Request, { params }: { params: Promise<{ zoneId: string }> }) {
  const { zoneId } = await params;
  return NextResponse.json({ spots: listAvailableSpots(zoneId) });
}
