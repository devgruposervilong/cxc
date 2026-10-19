import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DocumentType } from "@/lib/types";
import {
  deleteDocumentFromUpload,
  deleteUpload,
  getLatestUpload,
  saveUpload,
  type SaveUploadInput,
} from "@/src/lib/api";
import { uploadQueryOptions } from "@/src/lib/queries";
import { queryKeys } from "@/src/lib/query-keys";

// Carga activa del dashboard.
export function useLatestUpload() {
  return useQuery(uploadQueryOptions());
}

export type SaveUploadOutcome = {
  result: Awaited<ReturnType<typeof saveUpload>>;
  latest: Awaited<ReturnType<typeof getLatestUpload>>;
};

// Guarda la carga y refresca el cache con la version enriquecida del servidor.
export function useSaveUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveUploadInput): Promise<SaveUploadOutcome> => {
      const result = await saveUpload(input);
      const latest = await getLatestUpload();
      return { result, latest };
    },
    onSuccess: ({ latest }) => {
      queryClient.setQueryData(queryKeys.uploads.latest, latest);
    },
  });
}

export function useDeleteUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUpload,
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.uploads.latest, null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.uploads.latest });
    },
  });
}

export type DeleteDocumentInput = {
  uploadId: string;
  type: DocumentType;
  number: string;
};

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uploadId, type, number }: DeleteDocumentInput) =>
      deleteDocumentFromUpload(uploadId, type, number),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.uploads.latest });
    },
  });
}
