// Lightweight fetch logger for client-side debugging
// Patches global fetch to log method, URL, status, and duration.

// Only enable in development or when explicitly toggled on
const ENABLED =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ENABLE_API_LOGGER === "true") ||
  (typeof window !== "undefined" && process.env.NODE_ENV !== "production");

// Función para obtener el color según el código de estado HTTP
function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) {
    // 2xx: Éxito - Verde
    return "color: #10b981; font-weight: bold;"; // green-500
  } else if (status >= 300 && status < 400) {
    // 3xx: Redirección - Azul/Cian
    return "color: #3b82f6; font-weight: bold;"; // blue-500
  } else if (status >= 400 && status < 500) {
    // 4xx: Error del cliente - Amarillo/Naranja
    return "color: #f59e0b; font-weight: bold;"; // amber-500
  } else if (status >= 500) {
    // 5xx: Error del servidor - Rojo
    return "color: #ef4444; font-weight: bold;"; // red-500
  }
  // Otros códigos - Gris
  return "color: #6b7280; font-weight: bold;"; // gray-500
}

if (typeof window !== "undefined" && typeof fetch === "function" && ENABLED) {
  // Avoid double-patching
  const globalAny = window as any;
  if (!globalAny.__FETCH_LOGGER_INSTALLED__) {
    globalAny.__FETCH_LOGGER_INSTALLED__ = true;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      try {
        // Normalize URL
        let url: string;
        if (typeof input === "string") {
          url = input;
        } else if (typeof URL !== "undefined" && input instanceof URL) {
          url = input.toString();
        } else if (typeof Request !== "undefined" && input instanceof Request) {
          url = input.url;
        } else {
          url = String((input as any)?.url ?? input ?? "");
        }

        const method = (
          init?.method ||
          (typeof Request !== "undefined" && input instanceof Request ? input.method : undefined) ||
          "GET"
        ).toUpperCase();

        // Skip noisy internal requests
        if (
          typeof url === "string" &&
          (url.includes("/_next/") ||
            url.includes("/__nextjs_") ||
            url.includes("vercel-analytics"))
        ) {
          return originalFetch(input as any, init);
        }

        const id = Math.random().toString(36).slice(2, 8);
        const label = `[API ${id}] ${method} ${url}`;

        const start = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();

        // Shallow-log request body safely
        let bodyInfo: string | undefined;
        const body = init?.body;
        if (typeof body === "string") {
          bodyInfo = `${body.length} chars`;
        } else if (body instanceof Blob) {
          bodyInfo = `Blob ${body.size} bytes`;
        } else if (body instanceof FormData) {
          bodyInfo = `FormData(${Array.from(body.keys()).length} fields)`;
        } else if (body && typeof (body as any).byteLength === "number") {
          bodyInfo = `Buffer ${String((body as any).byteLength)} bytes`;
        }

        // Grouped, collapsed log for readability
        // Color para peticiones salientes (sending) - Azul claro/Cian
        const sendingColor = "color: #06b6d4; font-weight: bold;"; // cyan-500
        // eslint-disable-next-line no-console
        console.groupCollapsed(`${label} • %csending%c`, sendingColor, "color: inherit; font-weight: normal;");
        // eslint-disable-next-line no-console
        console.log({ method, url, headers: init?.headers, body: bodyInfo });
        // eslint-disable-next-line no-console
        console.groupEnd();

        const res = await originalFetch(input as any, init);

        const end = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
        const ms = Math.round(end - start);

        // Clone to peek response without consuming it
        let preview: string | undefined;
        try {
          const clone = res.clone();
          const ct = clone.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            const text = await clone.text();
            preview = text.length > 500 ? `${text.slice(0, 500)}… (${text.length} chars)` : text;
          } else if (ct.startsWith("text/")) {
            const text = await clone.text();
            preview = text.length > 300 ? `${text.slice(0, 300)}… (${text.length} chars)` : text;
          } else {
            const len = clone.headers.get("content-length");
            preview = len ? `binary ${len} bytes` : "binary";
          }
        } catch {
          // ignore preview errors
        }

        // Obtener color según el código de estado
        const statusColor = getStatusColor(res.status);
        
        // Log con código de estado coloreado
        // eslint-disable-next-line no-console
        console.groupCollapsed(`${label} • %c${res.status}%c • ${ms}ms`, statusColor, "color: inherit; font-weight: normal;");
        // eslint-disable-next-line no-console
        console.log({ status: res.status, ok: res.ok, headers: Object.fromEntries(res.headers.entries()), preview });
        // eslint-disable-next-line no-console
        console.groupEnd();

        // Simple métricas locales para depurar nº de requests y última latencia
        try {
          const w: any = window as any;
          w.__API_REQUEST_COUNT__ = (w.__API_REQUEST_COUNT__ || 0) + 1;
          w.__API_LAST_REQUEST_MS__ = ms;
        } catch {
          // ignore metrics errors
        }

        return res;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("[API] fetch logger error:", e);
        return originalFetch(input as any, init);
      }
    };

    // eslint-disable-next-line no-console
    console.info("[API] Fetch logger enabled");
  }
}
