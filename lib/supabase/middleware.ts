import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refrescar la sesión si existe (esto también maneja automáticamente
  // el intercambio de códigos PKCE si el paquete @supabase/ssr está configurado correctamente)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Rutas públicas que no requieren autenticación
  const publicRoutes = [
    "/",
    "/login",
    "/auth/set-password",
    "/auth/reset-password",
    "/auth/update-password",
    "/auth/callback",
    "/auth/confirm",
  ];

  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Si el usuario está autenticado, verificar si necesita cambiar su contraseña
  if (user) {
    const requiresPasswordChange =
      request.cookies.get("requires_password_change")?.value === "true";
    const isOnUpdatePasswordPage =
      request.nextUrl.pathname === "/auth/update-password";
    const isOnSetPasswordPage =
      request.nextUrl.pathname === "/auth/set-password";
    const isClearingPasswordCookieApi =
      request.nextUrl.pathname.startsWith("/api/auth/clear-password-cookie");

    // Si requiere cambio de contraseña y no está en las páginas de password
    if (
      requiresPasswordChange &&
      !isOnUpdatePasswordPage &&
      !isOnSetPasswordPage &&
      request.nextUrl.pathname !== "/auth/callback" &&
      !isClearingPasswordCookieApi
    ) {
      console.log(
        "[Middleware] User requires password change, redirecting to update-password"
      );
      const url = request.nextUrl.clone();
      url.pathname = "/auth/update-password";
      return NextResponse.redirect(url);
    }
  }

  // Proteger rutas
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirigir a dashboard si ya está autenticado e intenta acceder a login
  // (pero permitir rutas de auth como set-password y update-password)
  if (
    user &&
    request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth/")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
