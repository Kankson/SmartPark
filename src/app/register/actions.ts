"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { setDemoSession } from "@/lib/auth";
import { registerDriver } from "@/server/smartpark-service";

const registerSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email(),
  password: z.string().min(8)
});

export async function registerDriverAction(_previousState: { error?: string }, formData: FormData) {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Complete all fields. Password must be at least 8 characters." };
  }

  try {
    const user = registerDriver(parsed.data);
    await setDemoSession(user.id);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create driver account." };
  }

  redirect("/driver");
}
