import type { DataRow, DocumentType } from "@/lib/types";

export type SaveUploadInput = {
  fileName: string;
  loadedAt: string;
  rows: DataRow[];
};

export type SaveUploadResult = {
  uploadId: string;
  savedRows: number;
};

export type LoadedUpload = {
  uploadId: string;
  fileName: string;
  loadedAt: string;
  rows: DataRow[];
};

function formatLoadedAt(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const hora = String(d.getHours()).padStart(2, "0");
  const minutos = String(d.getMinutes()).padStart(2, "0");
  return `${dia}/${mes}/${d.getFullYear()} ${hora}:${minutos}`;
}

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

export async function getLatestUpload(): Promise<LoadedUpload | null> {
  const response = await fetch("/api/uploads");

  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(detail?.error ?? "Error al cargar los datos");
  }

  const data = (await response.json()) as (Omit<LoadedUpload, "loadedAt"> & { loadedAt: string }) | null;
  if (!data) return null;

  return { ...data, loadedAt: formatLoadedAt(data.loadedAt) };
}

export async function deleteUpload(id: string): Promise<void> {
  const response = await fetch(`/api/uploads/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(detail?.error ?? "Error al eliminar la carga");
  }
}

export async function deleteDocumentFromUpload(
  uploadId: string,
  type: DocumentType,
  number: string
): Promise<void> {
  const response = await fetch(`/api/uploads/${uploadId}/documents`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, number }),
  });

  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(detail?.error ?? "Error al eliminar el documento");
  }
}