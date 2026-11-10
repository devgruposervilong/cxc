import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSeller,
  deleteSeller,
  updateSeller,
} from "@/src/lib/api";
import {
  sellersCatalogQueryOptions,
  sellersQueryOptions,
} from "@/src/lib/queries";
import { queryKeys } from "@/src/lib/query-keys";
import type { SellerInput } from "@/lib/types";

// Vendedores activos para la navegacion del dashboard.
export function useSellers(enabled = true) {
  return useQuery(sellersQueryOptions(enabled));
}

// Maestro completo (incluye inactivos) para la seccion Tablas.
export function useSellersCatalog() {
  return useQuery(sellersCatalogQueryOptions());
}

function invalidateSellerQueries(
  queryClient: ReturnType<typeof useQueryClient>
) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.sellers.list });
  void queryClient.invalidateQueries({ queryKey: queryKeys.sellers.catalog });
  // El nombre del vendedor tambien aparece en la data de CxC.
  void queryClient.invalidateQueries({ queryKey: queryKeys.uploads.latest });
}

export function useCreateSeller() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SellerInput) => createSeller(input),
    onSuccess: () => invalidateSellerQueries(queryClient),
  });
}

export function useUpdateSeller() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SellerInput }) =>
      updateSeller(id, input),
    onSuccess: () => invalidateSellerQueries(queryClient),
  });
}

export function useDeleteSeller() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSeller(id),
    onSuccess: () => invalidateSellerQueries(queryClient),
  });
}
