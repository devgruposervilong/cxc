import { queryOptions } from "@tanstack/react-query";
import { ApiError, getMe, type Me } from "./api";

export const SESSION_QUERY_KEY = ["session"] as const;

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async (): Promise<Me | null> => {
      try {
        return await getMe();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 30_000,
    retry: false,
  });
}
