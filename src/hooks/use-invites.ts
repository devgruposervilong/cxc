import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptInvite, getInvite } from "@/src/lib/api";
import { queryKeys } from "@/src/lib/query-keys";
import { sessionQueryOptions } from "@/src/lib/session";

// Datos publicos de una invitacion (correo, rol, vencimiento).
export function useInvite(token: string) {
  return useQuery({
    queryKey: queryKeys.invites.detail(token),
    queryFn: () => getInvite(token),
    retry: false,
  });
}

// Acepta la invitacion, crea la cuenta y deja la sesion hidratada.
export function useAcceptInvite(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; password: string }) => {
      await acceptInvite(token, input);
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
      return queryClient.fetchQuery(sessionQueryOptions());
    },
  });
}
