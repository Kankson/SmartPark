import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getWardenDashboard } from "@/server/smartpark-service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !["warden", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Warden or admin login required." }, { status: 401 });
  }

  return NextResponse.json(getWardenDashboard());
}
