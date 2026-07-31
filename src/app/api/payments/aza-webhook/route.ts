import { NextResponse } from "next/server";

import { jsonError } from "@/lib/api";
import { processAzaPaymentWebhook } from "@/server/smartpark-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // AZA signs the exact request bytes, so read text before parsing JSON.
    const result = await processAzaPaymentWebhook(await request.text(), request.headers);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
