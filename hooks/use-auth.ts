"use client";

import { useEffect, useState } from "react";

export type AuthUser = {
  userId: string;
  userName: string;
  role: "manager" | "staff" | string;
} | null;

export function useAuth() {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(
          (process.env.NEXT_PUBLIC_API_URL || "/api") + "/auth/me",
          {
            credentials: "include",
          }
        );
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          setUser({
            userId: data.userId,
            userName: data.userName,
            role: data.role,
          });
        } else {
          setUser(null);
        }
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const isManager = user?.role === "manager";
  const isReadOnly = !isManager;

  return { user, loading, isManager, isReadOnly };
}
