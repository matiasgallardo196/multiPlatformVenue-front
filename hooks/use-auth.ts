"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";

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

  // Función para obtener el usuario desde el backend (que consulta la BD)
  const fetchUserFromBackend = async () => {
    try {
      const userData = await api.get("/auth/me");
      return {
        userId: userData.userId,
        userName: userData.userName,
        role: userData.role,
        email: userData.email,
      };
    } catch (error) {
      console.error("Error fetching user from backend:", error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Obtener sesión inicial y datos del backend
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session?.user) {
        // Obtener los datos desde el backend (PostgreSQL)
        const userData = await fetchUserFromBackend();
        if (mounted && userData) {
          setUser(userData);
        } else if (mounted) {
          setUser(null);
        }
      } else {
        if (mounted) setUser(null);
      }

      if (mounted) setLoading(false);
    };

    initAuth();

    // Escuchar cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        // Obtener los datos desde el backend (PostgreSQL)
        const userData = await fetchUserFromBackend();
        if (mounted && userData) {
          setUser(userData);
        }
      } else {
        if (mounted) setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const isManager = user?.role === "manager" || user?.role === "head-manager";
  const isHeadManager = user?.role === "head-manager";
  const isReadOnly = !isManager;

  return { user, loading, isManager, isHeadManager, isReadOnly };
}
