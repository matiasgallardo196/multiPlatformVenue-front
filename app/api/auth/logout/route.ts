import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:3001";

export async function POST() {
  try {
    // Call backend to clear cookie there too (optional)
    await fetch(`${BACKEND_URL}/auth/logout`, { method: "POST" }).catch(
      () => {}
    );
    const res = NextResponse.json({ ok: true });
    // Clear cookie on frontend domain
    const isProd = process.env.NODE_ENV === "production";
    res.cookies.set("accessToken", "", {
      httpOnly: true,
      sameSite: (isProd ? "none" : "lax") as any,
      secure: isProd,
      path: "/",
      maxAge: 0,
    });
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message || "Logout failed" },
      { status: 500 }
    );
  }
}
