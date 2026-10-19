import { useQuery } from "@tanstack/react-query";
import { sellersQueryOptions } from "@/src/lib/queries";

// Vendedores activos para la navegacion del dashboard.
export function useSellers(enabled = true) {
  return useQuery(sellersQueryOptions(enabled));
}
