"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface RouteGuardProps {
  children: React.ReactNode;
  requireManager?: boolean;
  requireHeadManager?: boolean;
  redirectTo?: string;
}

export function RouteGuard({
  children,
  requireManager = false,
  requireHeadManager = false,
  redirectTo = "/dashboard",
}: RouteGuardProps) {
  const { user, loading, isManager, isHeadManager } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Si no hay usuario autenticado, redirigir al login (el middleware debería manejar esto)
    if (!user) {
      console.warn("[RouteGuard] No user found, redirecting to login");
      router.replace("/login");
      return;
    }

    // Si requiere head-manager y no lo es
    if (requireHeadManager && !isHeadManager) {
      console.warn(
        "[RouteGuard] User is not head-manager, redirecting to",
        redirectTo
      );
      router.replace(redirectTo);
      return;
    }

    // Si requiere manager y no lo es
    if (requireManager && !isManager) {
      console.warn(
        "[RouteGuard] User is not manager, redirecting to",
        redirectTo
      );
      router.replace(redirectTo);
      return;
    }
  }, [
    user,
    loading,
    isManager,
    isHeadManager,
    requireManager,
    requireHeadManager,
    redirectTo,
    router,
  ]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Verificando permisos...
          </p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, no mostrar nada (ya se está redirigiendo)
  if (!user) {
    return null;
  }

  // Si requiere head-manager y no lo es, no mostrar nada
  if (requireHeadManager && !isHeadManager) {
    return null;
  }

  // Si requiere manager y no lo es, no mostrar nada
  if (requireManager && !isManager) {
    return null;
  }

  // Todo OK, mostrar el contenido
  return <>{children}</>;
}
