import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:3001";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const backendRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      // Do not forward cookies for login
      redirect: "manual",
    });

    const contentType = backendRes.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await backendRes.json()
      : await backendRes.text();

    const res = NextResponse.json(data as any, { status: backendRes.status });

    // Mirror the accessToken cookie into the frontend domain
    const setCookie = backendRes.headers.get("set-cookie") || "";
    const match = /accessToken=([^;]+)/i.exec(setCookie);
    if (match && match[1] && backendRes.ok) {
      const token = match[1];
      const isProd = process.env.NODE_ENV === "production";
      res.cookies.set("accessToken", token, {
        httpOnly: true,
        sameSite: (isProd ? "none" : "lax") as any,
        secure: isProd,
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // seconds
      });
    }

    return res;
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message || "Login failed" },
      { status: 500 }
    );
  }
}
