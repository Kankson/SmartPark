import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { addDriverVehicle, listDriverVehicles } from "@/server/smartpark-service";

const vehicleSchema = z.object({
  plateNumber: z.string().min(3),
  vehicleType: z.enum(["car", "motorcycle", "van", "accessible"]),
  make: z.string().min(1),
  model: z.string().min(1),
  colour: z.string().min(1)
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "driver") {
    return NextResponse.json({ error: "Driver login required." }, { status: 401 });
  }

  return NextResponse.json({ vehicles: listDriverVehicles(user.id) });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "driver") {
      return NextResponse.json({ error: "Driver login required." }, { status: 401 });
    }

    const body = vehicleSchema.parse(await request.json());
    const vehicle = addDriverVehicle({ ...body, ownerId: user.id });
    return NextResponse.json({ vehicle });
  } catch (error) {
    return jsonError(error);
  }
}
