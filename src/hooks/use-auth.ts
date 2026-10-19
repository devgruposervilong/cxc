import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/src/lib/auth-client";
import { queryKeys } from "@/src/lib/query-keys";
import { sessionQueryOptions } from "@/src/lib/session";

export type SignInInput = {
  email: string;
  password: string;
};

// Inicia sesion y deja la sesion hidratada en el cache de TanStack Query.
export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SignInInput) => {
      const result = await authClient.signIn.email(input);

      if (result.error) {
        throw new Error(result.error.message ?? "Credenciales invalidas");
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
      return queryClient.fetchQuery(sessionQueryOptions());
    },
  });
}

// Cierra sesion, limpia el cache y devuelve al login.
export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await authClient.signOut();
      queryClient.clear();
    },
    onSuccess: () => {
      window.location.assign("/login");
    },
  });
}
