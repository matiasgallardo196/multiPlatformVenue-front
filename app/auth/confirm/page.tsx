"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function AuthConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const next = searchParams.get("next") || "/dashboard";

        // Parse hash fragments (#access_token, #refresh_token, #type)
        const hashParams = new URLSearchParams(
          typeof window !== "undefined" ? window.location.hash.substring(1) : ""
        );
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token") || undefined;

        if (!accessToken) {
          setError("No access_token found in the link. The link may have expired.");
          return;
        }

        const { error: setErr } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        });

        if (setErr) {
          setError(setErr.message);
          return;
        }

        router.replace(next);
        router.refresh();
      } catch (e: any) {
        setError(e?.message || "Unknown error while confirming session");
      }
    };

    run();
  }, [router, searchParams, supabase]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-2 text-center">
          <p className="text-destructive">{error}</p>
          <p className="text-sm text-muted-foreground">
            Try requesting a new link or go back to login.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Processing link...
      </div>
    </div>
  );
}

