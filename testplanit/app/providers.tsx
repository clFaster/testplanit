"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "~/components/theme-provider";
import { Provider as ZenStackProvider } from "@zenstackhq/tanstack-query/runtime-v5/react";
import type { ReactNode } from "react";
import { SearchStateProvider } from "~/lib/contexts/SearchStateContext";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      staleTime: 10000,
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Maximum safe URL length before converting GET to POST.
// Browsers/servers typically limit URLs to ~8KB, but we use a conservative
// threshold to account for additional headers and encoding overhead.
const MAX_URL_LENGTH = 4000;

// Custom fetch that converts large GET requests to POST to avoid 414 URI Too Long errors.
// ZenStack serializes query args into URL query parameters for read operations (findMany, etc.),
// which can exceed URL length limits for complex queries with deeply nested selects/includes.
// The server-side API handler detects the x-zenstack-query-post header and transforms
// the request back to GET format before passing it to ZenStack's RPC handler.
const zenStackFetch = async (
  url: string,
  options?: RequestInit
): Promise<Response> => {
  const method = options?.method?.toUpperCase() || "GET";

  if (method === "GET" && url.length > MAX_URL_LENGTH) {
    const urlObj = new URL(url);
    const q = urlObj.searchParams.get("q");
    const meta = urlObj.searchParams.get("meta");

    // Strip query params from URL to keep it short
    urlObj.searchParams.delete("q");
    urlObj.searchParams.delete("meta");

    return fetch(urlObj.toString(), {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-zenstack-query-post": "1",
      },
      body: JSON.stringify({ q, meta }),
    });
  }

  return fetch(url, options);
};

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ZenStackProvider value={{ endpoint: "/api/model", fetch: zenStackFetch }}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            themes={["light", "dark", "green", "orange", "purple"]}
          >
            <SearchStateProvider>{children}</SearchStateProvider>
          </ThemeProvider>
        </ZenStackProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
