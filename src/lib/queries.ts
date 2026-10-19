import { queryOptions } from "@tanstack/react-query";
import {
  getLatestUpload,
  getSellerPortal,
  getSellers,
  type LoadedUpload,
} from "./api";

export const UPLOAD_QUERY_KEY = ["uploads", "latest"] as const;
export const SELLERS_QUERY_KEY = ["sellers"] as const;

export function uploadQueryOptions() {
  return queryOptions<LoadedUpload | null>({
    queryKey: UPLOAD_QUERY_KEY,
    queryFn: getLatestUpload,
    staleTime: 5 * 60 * 1000,
  });
}

export function sellersQueryOptions(enabled = true) {
  return queryOptions({
    queryKey: SELLERS_QUERY_KEY,
    queryFn: getSellers,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function sellerPortalQueryOptions(keyUrl: string) {
  return queryOptions({
    queryKey: ["sellers", "portal", keyUrl] as const,
    queryFn: () => getSellerPortal(keyUrl),
    staleTime: 60 * 1000,
  });
}
