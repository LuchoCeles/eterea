import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, readSessionToken } from "@/server/session-token";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/auth" && request.nextUrl.searchParams.get("session-check") === "1") {
    return;
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  // La sesión se crea solo para admins; el layout confirma que el rol siga vigente.
  if (readSessionToken(token)) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
}

export const config = {
  matcher: ["/auth", "/login"],
};
