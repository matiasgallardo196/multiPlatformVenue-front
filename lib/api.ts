// Simple API client for the admin dashboard
import { createClient } from "./supabase/client";

// En cliente siempre usamos el proxy "/api" (Next rewrites → BACKEND_API_URL)
// En servidor permitimos URL absoluta si está definida
const isServer = typeof window === "undefined";
const API_BASE_URL = isServer
  ? process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "/api"
  : "/api";

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const start = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();

  // Obtener el token de Supabase
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  const config: RequestInit = {
    mode: "cors",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    // Si recibimos un 401, intentar refrescar el token y reintentar una vez
    if (response.status === 401 && token) {
      console.log("[api] 401 received, attempting token refresh...");
      const { data: { session: refreshedSession }, error: refreshError } = 
        await supabase.auth.refreshSession();
      
      if (!refreshError && refreshedSession?.access_token) {
        console.log("[api] Token refreshed, retrying request...");
        
        // Reintentar la petición con el nuevo token
        const retryConfig: RequestInit = {
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${refreshedSession.access_token}`,
          },
        };
        
        const retryResponse = await fetch(url, retryConfig);
        
        if (!retryResponse.ok) {
          // Manejar el error de la petición reintentada
          let parsed: any = null;
          let rawText = "";
          try {
            const ct = retryResponse.headers.get("content-type") || "";
            if (ct.includes("application/json")) {
              parsed = await retryResponse.json();
            } else {
              rawText = await retryResponse.text();
            }
          } catch {
            // ignore parse errors
          }

          const serverMessage =
            parsed?.message || parsed?.error || rawText || retryResponse.statusText;
          console.log("[api] ✖ error: ", parsed || rawText || retryResponse.statusText);
          throw new ApiError(
            retryResponse.status,
            String(serverMessage),
            parsed || rawText
          );
        }

        // Si la petición reintentada fue exitosa, continuar con el procesamiento normal
        const retryContentLength = retryResponse.headers.get("content-length");
        if (retryResponse.status === 204 || retryContentLength === "0") {
          return null as unknown as any;
        }

        const retryContentType = retryResponse.headers.get("content-type") || "";
        if (!retryContentType.includes("application/json")) {
          const text = await retryResponse.text();
          return text as unknown as any;
        }

        try {
          const data = await retryResponse.json();
          return data;
        } catch (e) {
          return null as unknown as any;
        }
      } else {
        console.log("[api] Failed to refresh token:", refreshError);
        // Si no se pudo refrescar el token, continuar con el manejo de error normal
      }
    }

    if (!response.ok) {
      // Try to parse JSON error first for clearer messages
      let parsed: any = null;
      let rawText = "";
      try {
        const ct = response.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          parsed = await response.json();
        } else {
          rawText = await response.text();
        }
      } catch {
        // ignore parse errors
      }

      const serverMessage =
        parsed?.message || parsed?.error || rawText || response.statusText;
      console.log("[api] ✖ error: ", parsed || rawText || response.statusText);
      throw new ApiError(
        response.status,
        String(serverMessage),
        parsed || rawText
      );
    }

    // Handle no-content responses gracefully
    if (response.status === 204) {
      return null as unknown as any;
    }

    // Some endpoints may return empty body with 200/201
    const contentLength = response.headers.get("content-length");
    if (contentLength === "0") {
      return null as unknown as any;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      // Attempt text fallback
      const text = await response.text();
      return text as unknown as any;
    }

    try {
      const data = await response.json();
      return data;
    } catch (e) {
      return null as unknown as any;
    }
  } catch (error) {
    console.log("[api] request failed:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(
      `Network error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export const api = {
  get: (endpoint: string) => apiRequest(endpoint),
  post: (endpoint: string, data: any) =>
    apiRequest(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  patch: (endpoint: string, data: any) =>
    apiRequest(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (endpoint: string) =>
    apiRequest(endpoint, {
      method: "DELETE",
    }),
};
