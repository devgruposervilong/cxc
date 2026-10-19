import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminCreateInvite,
  adminDeleteInvite,
  adminListInvites,
  adminListUsers,
  adminRegenerateInvite,
  adminUpdateUser,
} from "@/src/lib/api";
import { queryKeys } from "@/src/lib/query-keys";

export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.admin.users,
    queryFn: adminListUsers,
    staleTime: 30_000,
  });
}

export function useAdminInvites() {
  return useQuery({
    queryKey: queryKeys.admin.invites,
    queryFn: adminListInvites,
    staleTime: 15_000,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof adminUpdateUser>[1];
    }) => adminUpdateUser(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sellers.list });
    },
  });
}

export function useCreateInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminCreateInvite,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.invites });
    },
  });
}

export function useRegenerateInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminRegenerateInvite,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.invites });
    },
  });
}

export function useDeleteInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminDeleteInvite,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.invites });
    },
  });
}
