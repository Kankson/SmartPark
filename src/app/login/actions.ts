"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { homeForRole, setDemoSession } from "@/lib/auth";
import { getUserByEmail } from "@/server/smartpark-service";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function loginAction(_previousState: { error?: string }, formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const user = getUserByEmail(parsed.data.email);
  if (!user || user.password !== parsed.data.password || !user.isActive) {
    return { error: "Invalid email or password." };
  }

  await setDemoSession(user.id);
  redirect(homeForRole(user.role));
}
