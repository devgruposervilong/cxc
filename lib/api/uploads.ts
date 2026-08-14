import type { DataRow } from "@/lib/types";

export type SaveUploadInput = {
  fileName: string;
  loadedAt: string;
  rows: DataRow[];
};

export type SaveUploadResult = {
  uploadId: string;
  savedRows: number;
};

// Servicio frontend: la capa que se ejecuta en el navegador y llama a la API.
export async function saveUpload(input: SaveUploadInput): Promise<SaveUploadResult> {
  const response = await fetch("/api/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(detail?.error ?? "Error al guardar la carga");
  }

  return (await response.json()) as SaveUploadResult;
}