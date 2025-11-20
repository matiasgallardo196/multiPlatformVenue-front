"use client";

import { createContext, useContext, useEffect, useState, useRef, useMemo, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthMe, queryKeys } from "@/hooks/queries";
import { useQueryClient } from "@tanstack/react-query";
import { ensureAuthSubscription } from "@/lib/auth-subscription";
import type { AuthUser } from "@/hooks/use-auth";
import { isAdmin, isHeadManagerOrAbove, isManagerOrAbove } from "@/lib/role-utils";

type AuthContextValue = {
  user: AuthUser;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isHeadManager: boolean;
  isReadOnly: boolean;
  hasSession: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  // Inicializar hasSession verificando si ya hay datos en el cache para evitar refetches innecesarios
  const cachedAuthData = queryClient.getQueryData(queryKeys.authMe);
  const initialHasSession = !!cachedAuthData;
  const [hasSession, setHasSession] = useState(initialHasSession);
  const hasSessionRef = useRef(initialHasSession); // Para evitar actualizaciones innecesarias
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    // Obtener sesión inicial
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      const loggedIn = !!session?.user;
      // Solo actualizar si el valor realmente cambió
      if (hasSessionRef.current !== loggedIn) {
        hasSessionRef.current = loggedIn;
        setHasSession(loggedIn);
      }
      if (!loggedIn) setUser(null);

      setLoading(false);
    };

    initAuth();

    // Escuchar cambios de autenticación para actualizar hasSession
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      const loggedIn = !!session?.user;
      
      // No actualizar hasSession cuando solo se refresca el token
      // Esto evita refetches innecesarios de useAuthMe
      if (event === "TOKEN_REFRESHED") {
        return;
      }
      
      // Solo actualizar si el valor realmente cambió
      if (hasSessionRef.current !== loggedIn) {
        hasSessionRef.current = loggedIn;
        setHasSession(loggedIn);
      }
      
      if (!loggedIn) {
        setUser(null);
      }

      // Si acabamos de iniciar sesión, refrescar la sesión para asegurar que las cookies estén actualizadas
      if (event === "SIGNED_IN") {
        // Pequeño delay para asegurar que las cookies se hayan establecido
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (mounted) {
              const newLoggedIn = !!session?.user;
              if (hasSessionRef.current !== newLoggedIn) {
                hasSessionRef.current = newLoggedIn;
                setHasSession(newLoggedIn);
              }
            }
          });
        }, 100);
      }
    });

    // Garantizar una única suscripción global
    ensureAuthSubscription(queryClient);

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, queryClient]);

  // Vincular con la query compartida para evitar múltiples llamadas
  const { data: meData, isFetching: meFetching, isLoading: meLoading } = useAuthMe(hasSession);

  useEffect(() => {
    setUser(meData ?? null);
  }, [meData]);

  // Usar helpers de jerarquía de roles
  const userRole = user?.role || "";
  const userIsAdmin = isAdmin(userRole);
  const userIsHeadManager = isHeadManagerOrAbove(userRole);
  const userIsManager = isManagerOrAbove(userRole);
  const isReadOnly = !userIsManager;

  // Solo mostrar loading si:
  // 1. Estamos cargando inicialmente (loading), O
  // 2. Tenemos sesión pero NO tenemos datos de usuario Y estamos cargando
  // No mostrar loading si solo estamos haciendo refetch en background (meFetching pero tenemos datos)
  const effectiveLoading = loading || (hasSession && !user && (meLoading || meFetching));

  const value: AuthContextValue = {
    user,
    loading: effectiveLoading,
    isAdmin: userIsAdmin,
    isManager: userIsManager,
    isHeadManager: userIsHeadManager,
    isReadOnly,
    hasSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  return context;
}

