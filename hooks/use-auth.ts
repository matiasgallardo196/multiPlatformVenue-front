"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthMe } from "@/hooks/queries";
import { useQueryClient } from "@tanstack/react-query";

export type AuthUser = {
  userId: string;
  userName: string;
  role: "manager" | "staff" | "head-manager" | string;
  email: string;
} | null;

export function useAuth() {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);
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

      if (!session?.user) {
        setUser(null);
      }

      setLoading(false);
    };

    initAuth();

    // Escuchar cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        // Invalida la cache de /auth/me para reconsultar una vez
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, queryClient]);

  // Vincular con la query compartida para evitar múltiples llamadas
  const { data: meData } = useAuthMe(true);

  useEffect(() => {
    setUser(meData ?? null);
  }, [meData]);

  const isManager = user?.role === "manager" || user?.role === "head-manager";
  const isHeadManager = user?.role === "head-manager";
  const isReadOnly = !isManager;

  return { user, loading, isManager, isHeadManager, isReadOnly };
}

