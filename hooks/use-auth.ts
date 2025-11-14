"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthMe } from "@/hooks/queries";
import { useQueryClient } from "@tanstack/react-query";
import { ensureAuthSubscription } from "@/lib/auth-subscription";
import { useAuthContext } from "@/lib/auth-provider";

export type AuthUser = {
  userId: string;
  userName: string;
  role: "manager" | "staff" | "head-manager" | string;
  email: string;
  placeId: string | null;
  city: string | null;
} | null;

export function useAuth() {
  // Intentar usar el contexto primero (si está disponible)
  const context = useAuthContext();

  // Fallback: ejecutar la lógica original si el contexto no está disponible
  // Esto permite compatibilidad con componentes fuera del AuthProvider
  // Nota: Los hooks siempre se ejecutan, pero si el contexto está disponible,
  // simplemente ignoramos estos valores y retornamos el contexto
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const supabase = createClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Si el contexto está disponible, no ejecutar la lógica del fallback
    if (context !== undefined) return;

    let mounted = true;

    // Obtener sesión inicial
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      const loggedIn = !!session?.user;
      setHasSession(loggedIn);
      if (!loggedIn) setUser(null);

      setLoading(false);
    };

    initAuth();

    // Garantizar una única suscripción global
    ensureAuthSubscription(queryClient);

    return () => {
      mounted = false;
    };
  }, [supabase, queryClient, context]);

  // Vincular con la query compartida para evitar múltiples llamadas
  // Solo ejecutar si el contexto no está disponible
  const { data: meData, isFetching: meFetching, isLoading: meLoading } = useAuthMe(
    context === undefined ? hasSession : false
  );

  useEffect(() => {
    // Si el contexto está disponible, no actualizar el estado local
    if (context !== undefined) return;
    setUser(meData ?? null);
  }, [meData, context]);

  // Si el contexto está disponible, retornar esos valores
  if (context !== undefined) {
    return context;
  }

  // Fallback: retornar valores locales
  const isManager = user?.role === "manager" || user?.role === "head-manager";
  const isHeadManager = user?.role === "head-manager";
  const isReadOnly = !isManager;

  const effectiveLoading = loading || (hasSession && (meLoading || meFetching));

  return { user, loading: effectiveLoading, isManager, isHeadManager, isReadOnly, hasSession };
}
