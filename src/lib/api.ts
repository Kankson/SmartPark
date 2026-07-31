import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { DomainError } from "@/server/domain";

export function jsonError(error: unknown) {
  if (error instanceof DomainError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Invalid request input.", issues: error.flatten() }, { status: 400 });
  }
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
}
