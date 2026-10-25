import { NextResponse } from "next/server";
import { expiredSessionCookie } from "@/server/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.headers.append("Set-Cookie", expiredSessionCookie());
  return response;
}