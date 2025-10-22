import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/auth/update-password";

  console.log("[Auth Callback] Processing callback...");
  console.log("[Auth Callback] Code:", !!code);
  console.log("[Auth Callback] Next:", next);

  let response = NextResponse.redirect(`${requestUrl.origin}${next}`);

  if (code) {
    const supabase = await createClient();

    console.log("[Auth Callback] Exchanging code for session...");
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[Auth Callback] Error exchanging code:", error);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/update-password?error=${encodeURIComponent(
          error.message
        )}`
      );
    }

    console.log("[Auth Callback] Code exchanged successfully");

    // Si es un flujo de recovery o invite, marcar que requiere cambio de contraseña
    const isPasswordFlow =
      next === "/auth/update-password" || next === "/auth/set-password";
    if (isPasswordFlow) {
      console.log("[Auth Callback] Setting requires_password_change cookie");
      response.cookies.set("requires_password_change", "true", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60, // 1 hora
      });
    }
  }

  // URL to redirect to after sign in process completes
  return response;
}
