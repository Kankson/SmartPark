import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import {
  checkAzaConnectionFromEnv,
  getAzaConfigurationStatus
} from "@/server/payment-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin login required." }, { status: 401 });
    }

    const status = getAzaConfigurationStatus();
    if (!status.ready) {
      return NextResponse.json(
        {
          ok: false,
          message: "AZA is not fully configured on this server.",
          status
        },
        { status: 400 },
      );
    }

    const connected = await checkAzaConnectionFromEnv();
    return NextResponse.json({
      ok: true,
      message: `AZA ${connected.apiKeyMode} connection verified.`,
      status: connected
    });
  } catch (error) {
    return jsonError(error);
  }
}
