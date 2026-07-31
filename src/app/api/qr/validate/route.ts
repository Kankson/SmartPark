import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { validateQrTicket } from "@/server/smartpark-service";

const schema = z.object({
  payload: z.string().min(1),
  mode: z.enum(["entry", "verify", "exit"]),
  notes: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "warden") {
      return NextResponse.json({ error: "Warden login required." }, { status: 401 });
    }

    const body = schema.parse(await request.json());
    return NextResponse.json(validateQrTicket({ ...body, wardenId: user.id }));
  } catch (error) {
    return jsonError(error);
  }
}
