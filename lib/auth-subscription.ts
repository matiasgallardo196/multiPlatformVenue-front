"use client";

import { createClient } from "@/lib/supabase/client";
import type { QueryClient } from "@tanstack/react-query";

let started = false;

export function ensureAuthSubscription(queryClient: QueryClient) {
  if (started) return;
  started = true;

  const supabase = createClient();
  supabase.auth.onAuthStateChange((event, session) => {
    switch (event) {
      case "SIGNED_OUT":
        queryClient.removeQueries({ queryKey: ["auth", "me"] });
        break;
      case "SIGNED_IN":
      case "TOKEN_REFRESHED":
      case "USER_UPDATED":
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        break;
      default:
        break;
    }
  });
}

