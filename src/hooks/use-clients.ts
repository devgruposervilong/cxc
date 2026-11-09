import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateClient, type UpdateClientInput } from "@/src/lib/api";
import { clientsQueryOptions } from "@/src/lib/queries";
import { queryKeys } from "@/src/lib/query-keys";

// Maestro de clientes para la vista de clientes.
export function useClients() {
  return useQuery(clientsQueryOptions());
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clients.list });
      // El maestro enriquece vendedor/unidad de negocio en la data de CxC.
      void queryClient.invalidateQueries({ queryKey: queryKeys.uploads.latest });
    },
  });
}
