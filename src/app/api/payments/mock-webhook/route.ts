import { NextResponse } from "next/server";

import { jsonError } from "@/lib/api";
import { processMockPaymentWebhook } from "@/server/smartpark-service";

export async function POST(request: Request) {
  try {
    const result = await processMockPaymentWebhook(await request.text(), request.headers);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
