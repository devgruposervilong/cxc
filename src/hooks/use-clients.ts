import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createClient,
  deleteClient,
  updateClient,
  type UpdateClientInput,
} from "@/src/lib/api";
import { clientsQueryOptions } from "@/src/lib/queries";
import { queryKeys } from "@/src/lib/query-keys";
import type { Client } from "@/lib/types";

// Maestro de clientes para la vista de tablas.
export function useClients() {
  return useQuery(clientsQueryOptions());
}

function invalidateClientQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.clients.list });
  // El maestro enriquece vendedor/unidad de negocio en la data de CxC.
  void queryClient.invalidateQueries({ queryKey: queryKeys.uploads.latest });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Client) => createClient(input),
    onSuccess: () => invalidateClientQueries(queryClient),
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      code,
      input,
    }: {
      code: string;
      input: UpdateClientInput;
    }) => updateClient(code, input),
    onSuccess: () => invalidateClientQueries(queryClient),
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => deleteClient(code),
    onSuccess: () => invalidateClientQueries(queryClient),
  });
}
