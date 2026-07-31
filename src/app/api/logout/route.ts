import { NextResponse, type NextRequest } from "next/server";

import { clearDemoSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  await clearDemoSession();
  return NextResponse.redirect(new URL("/login", request.url));
}
