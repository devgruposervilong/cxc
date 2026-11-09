import { useQuery } from "@tanstack/react-query";
import { clientsQueryOptions } from "@/src/lib/queries";

// Maestro de clientes para la vista de clientes.
export function useClients() {
  return useQuery(clientsQueryOptions());
}
