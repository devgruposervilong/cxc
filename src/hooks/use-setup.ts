import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setupAdmin } from "@/src/lib/api";
import { queryKeys } from "@/src/lib/query-keys";
import { sessionQueryOptions } from "@/src/lib/session";

export type SetupAdminInput = {
  token: string;
  name: string;
  email: string;
  password: string;
};

// Crea el primer administrador y deja la sesion hidratada.
export function useSetupAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SetupAdminInput) => {
      await setupAdmin(input);
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
      return queryClient.fetchQuery(sessionQueryOptions());
    },
  });
}
