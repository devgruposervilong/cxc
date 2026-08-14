import { useQuery } from "@tanstack/react-query";
import { getLatestUpload } from "@/lib/api/uploads";

export const UPLOAD_QUERY_KEY = ["uploads", "latest"] as const;

// Hook entre la UI y el servicio de frontend: detecta si existe data cargada
// en la base de datos para mostrarla al abrir la aplicación.
export function useUploadData() {
  return useQuery({
    queryKey: UPLOAD_QUERY_KEY,
    queryFn: getLatestUpload,
    staleTime: 5 * 60 * 1000,
  });
}