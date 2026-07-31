import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { confirmViolation, dismissViolation } from "@/server/smartpark-service";

const schema = z.object({
  action: z.enum(["confirm", "dismiss"]),
  notes: z.string().optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ violationId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "warden") {
      return NextResponse.json({ error: "Warden login required." }, { status: 401 });
    }

    const { violationId } = await params;
    const body = schema.parse(await request.json());
    const violation =
      body.action === "confirm"
        ? confirmViolation(violationId, user.id, body.notes)
        : dismissViolation(violationId, user.id, body.notes);

    return NextResponse.json({ violation });
  } catch (error) {
    return jsonError(error);
  }
}
