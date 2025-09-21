import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:3001";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("accessToken")?.value;
    const backendRes = await fetch(`${BACKEND_URL}/auth/me`, {
      method: "GET",
      headers: {
        // Forward cookie so backend can verify
        Cookie: token ? `accessToken=${token}` : "",
        Accept: "application/json",
      },
    });

    const contentType = backendRes.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await backendRes.json()
      : await backendRes.text();
    return NextResponse.json(data as any, { status: backendRes.status });
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message || "Failed" },
      { status: 500 }
    );
  }
}
