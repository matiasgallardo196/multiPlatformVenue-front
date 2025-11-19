"use client";

import { createClient } from "@/lib/supabase/client";
import type { QueryClient } from "@tanstack/react-query";

let started = false;
let hasLoadedSession = false; // Rastrear si ya se cargó una sesión

export function ensureAuthSubscription(queryClient: QueryClient) {
  if (started) return;
  started = true;

  const supabase = createClient();
  
  // Verificar sesión inicial para marcar que ya se cargó
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      hasLoadedSession = true;
    }
  });
  
  supabase.auth.onAuthStateChange((event, session) => {
    switch (event) {
      case "SIGNED_OUT":
        hasLoadedSession = false;
        // Cancelar todas las queries activas cuando el usuario se desloguea
        // Esto evita que las queries sigan ejecutándose y fallen con 401
        queryClient.cancelQueries();
        // Limpiar todas las queries del cache para evitar datos obsoletos
        queryClient.removeQueries();
        break;
      case "SIGNED_IN":
        // Si ya se cargó una sesión antes, este SIGNED_IN es probablemente un falso positivo
        // de Supabase cuando refresca el token al volver a la pestaña
        if (hasLoadedSession) {
          // Ignorar - no es un nuevo inicio de sesión, solo refresco de token
          return;
        }
        hasLoadedSession = true;
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        break;
      case "USER_UPDATED":
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        break;
      case "TOKEN_REFRESHED":
        // No invalidar la query cuando solo se refresca el token
        // Los datos del usuario no han cambiado, solo el token de acceso
        break;
      default:
        break;
    }
  });
}

