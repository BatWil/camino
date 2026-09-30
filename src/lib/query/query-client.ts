import { QueryClient } from "@tanstack/react-query";
import { AppError } from "@/types/result";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
        // Do not hammer the API on permission errors; retry transient failures twice.
        retry: (failureCount, error) => {
          if (error instanceof AppError && ["unauthorized", "unconfigured", "not_found"].includes(error.code)) {
            return false;
          }
          return failureCount < 2;
        },
      },
      mutations: { retry: 0 },
    },
  });
}
