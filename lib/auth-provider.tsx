"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthMe } from "@/hooks/queries";
import { useQueryClient } from "@tanstack/react-query";
import { ensureAuthSubscription } from "@/lib/auth-subscription";
import type { AuthUser } from "@/hooks/use-auth";

type AuthContextValue = {
  user: AuthUser;
  loading: boolean;
  isManager: boolean;
  isHeadManager: boolean;
  isReadOnly: boolean;
  hasSession: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
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

  const value: AuthContextValue = {
    user,
    loading: effectiveLoading,
    isManager,
    isHeadManager,
    isReadOnly,
    hasSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  return context;
}

