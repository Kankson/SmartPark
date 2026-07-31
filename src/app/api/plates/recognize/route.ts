import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { MockPlateRecognitionProvider } from "@/server/plate-recognition-provider";

const maxUploadBytes = 3 * 1024 * 1024;
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "warden") {
      return NextResponse.json({ error: "Warden login required." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }
    if (!acceptedTypes.has(file.type) || file.size > maxUploadBytes) {
      return NextResponse.json({ error: "Upload a JPEG, PNG, or WebP image under 3 MB." }, { status: 400 });
    }

    const provider = new MockPlateRecognitionProvider();
    const recognition = await provider.recognize(file);
    return NextResponse.json({ recognition });
  } catch (error) {
    return jsonError(error);
  }
}
