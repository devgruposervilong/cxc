import { queryOptions } from "@tanstack/react-query";
import {
  getClients,
  getLatestUpload,
  getSellerPortal,
  getSellers,
  getSetupStatus,
  type ClientsCatalog,
  type LoadedUpload,
  type SetupStatus,
} from "./api";
import { queryKeys } from "./query-keys";

export function uploadQueryOptions() {
  return queryOptions<LoadedUpload | null>({
    queryKey: queryKeys.uploads.latest,
    queryFn: getLatestUpload,
    staleTime: 5 * 60 * 1000,
  });
}

export function sellersQueryOptions(enabled = true) {
  return queryOptions({
    queryKey: queryKeys.sellers.list,
    queryFn: getSellers,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function clientsQueryOptions() {
  return queryOptions<ClientsCatalog>({
    queryKey: queryKeys.clients.list,
    queryFn: getClients,
    staleTime: 5 * 60 * 1000,
  });
}

export function sellerPortalQueryOptions(keyUrl: string) {
  return queryOptions({
    queryKey: queryKeys.sellers.portal(keyUrl),
    queryFn: () => getSellerPortal(keyUrl),
    staleTime: 60 * 1000,
  });
}

export function setupStatusQueryOptions() {
  return queryOptions<SetupStatus>({
    queryKey: queryKeys.setupStatus,
    queryFn: getSetupStatus,
    staleTime: 0,
    retry: false,
  });
}
