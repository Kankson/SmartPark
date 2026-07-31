import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { resolveZoneQrPayload } from "@/server/smartpark-service";

const schema = z.object({ payload: z.string().min(20) });

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "driver") {
      return NextResponse.json({ error: "Driver login required." }, { status: 401 });
    }

    const { payload } = schema.parse(await request.json());
    const zone = resolveZoneQrPayload(payload);
    return NextResponse.json({
      zone: { id: zone.id, code: zone.code, name: zone.name, address: zone.address }
    });
  } catch (error) {
    return jsonError(error);
  }
}
