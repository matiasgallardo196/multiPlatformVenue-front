// Simple API client for the admin dashboard

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  console.log("[v0] Making API request to:", url);

  const config: RequestInit = {
    mode: "cors",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    console.log("[v0] API response status:", response.status);

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
      console.log(
        "[v0] API error response:",
        parsed || rawText || response.statusText
      );
      throw new ApiError(
        response.status,
        String(serverMessage),
        parsed || rawText
      );
    }

    // Handle no-content responses gracefully
    if (response.status === 204) {
      console.log("[v0] API response: 204 No Content");
      return null as unknown as any;
    }

    // Some endpoints may return empty body with 200/201
    const contentLength = response.headers.get("content-length");
    if (contentLength === "0") {
      console.log("[v0] API response: empty body");
      return null as unknown as any;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      // Attempt text fallback
      const text = await response.text();
      console.log("[v0] API response (non-JSON):", text);
      return text as unknown as any;
    }

    try {
      const data = await response.json();
      console.log("[v0] API response data:", data);
      return data;
    } catch (e) {
      console.log("[v0] Failed to parse JSON response, returning null");
      return null as unknown as any;
    }
  } catch (error) {
    console.log("[v0] API request failed:", error);
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
