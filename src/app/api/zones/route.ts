import { NextResponse } from "next/server";

import { listZones } from "@/server/smartpark-service";

export async function GET() {
  return NextResponse.json({ zones: listZones() });
}
