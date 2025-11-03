"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthMe } from "@/hooks/queries";
import { useQueryClient } from "@tanstack/react-query";
import { ensureAuthSubscription } from "@/lib/auth-subscription";

export type AuthUser = {
  userId: string;
  userName: string;
  role: "manager" | "staff" | "head-manager" | string;
  email: string;
  placeId: string | null;
  city: string | null;
} | null;

export function useAuth() {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const supabase = createClient();
  const queryClient = useQueryClient();

  useEffect(() => {
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
  }, [supabase, queryClient]);

  // Vincular con la query compartida para evitar múltiples llamadas
  const { data: meData, isFetching: meFetching, isLoading: meLoading } = useAuthMe(hasSession);

  useEffect(() => {
    setUser(meData ?? null);
  }, [meData]);

  const isManager = user?.role === "manager" || user?.role === "head-manager";
  const isHeadManager = user?.role === "head-manager";
  const isReadOnly = !isManager;

  const effectiveLoading = loading || (hasSession && (meLoading || meFetching));

  return { user, loading: effectiveLoading, isManager, isHeadManager, isReadOnly };
}
