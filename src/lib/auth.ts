import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { type DemoUser, type UserRole } from "@/server/domain";
import { getUserById } from "@/server/smartpark-service";

const sessionCookieName = "smartpark_user_id";

export async function getCurrentUser(): Promise<DemoUser | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(sessionCookieName)?.value;

  if (!userId) {
    return null;
  }

  return getUserById(userId) ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    redirect("/unauthorized");
  }
  return user;
}

export async function setDemoSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export async function clearDemoSession() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export function homeForRole(role: UserRole) {
  if (role === "warden") {
    return "/warden";
  }
  if (role === "admin") {
    return "/admin";
  }
  return "/driver";
}
