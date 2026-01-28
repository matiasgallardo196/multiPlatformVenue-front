"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePlace } from "@/hooks/queries";

export function DynamicTitle() {
  const { user, isAdmin } = useAuth();
  const { data: userPlace } = usePlace(user?.placeId || "");
  const placeName = userPlace?.name || null;

  useEffect(() => {
    // Para ADMIN sin place, mostrar "Venues Hub - Ban List"
    // Para otros, mostrar "{nombreDelLocal} - Ban List"
    const title = placeName ? `${placeName} - Ban List` : "Venues Hub - Ban List";
    document.title = title;
  }, [placeName]);

  return null;
}
