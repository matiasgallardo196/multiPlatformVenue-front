import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // Skip auth middleware in development to avoid cross-site cookie issues
  // when the API is on a different domain (e.g., onrender) and the cookie
  // is not available under the frontend's domain (localhost).
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }
  const { pathname } = req.nextUrl;

  // Public routes: root login page, Next assets, favicon
  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico";

  if (isPublic) {
    return NextResponse.next();
  }

  const token = req.cookies.get("accessToken")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  // Role-based guard for Places: only allow managers
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
    const role = payload?.role;
    if (role === "staff" && pathname.startsWith("/places")) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  } catch {}
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api).*)"],
};
