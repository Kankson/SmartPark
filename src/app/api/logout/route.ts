import { NextResponse } from "next/server";

export async function POST() {
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: "/login" }
  });
  response.cookies.set("smartpark_user_id", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  return response;
}
