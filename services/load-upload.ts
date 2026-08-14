import { PrismaUploadRepository } from "@/repositories/prisma-upload-repository";
import { PrismaDocumentRepository } from "@/repositories/prisma-document-repository";
import type { DataRow } from "@/lib/types";

export type LoadedUpload = {
  uploadId: string;
  fileName: string;
  loadedAt: string;
  rows: DataRow[];
};

const uploadRepository = new PrismaUploadRepository();
const documentRepository = new PrismaDocumentRepository();

// Devuelve la carga más reciente con sus documentos ya mapeados a DataRow.
// null si la base de datos no tiene ninguna carga.
export async function getLatestUploadWithDocuments(): Promise<LoadedUpload | null> {
  const upload = await uploadRepository.getLatestUpload();
  if (!upload) return null;

  const rows = await documentRepository.getDocumentsByUpload(upload.id);
  return {
    uploadId: upload.id,
    fileName: upload.fileName,
    loadedAt: upload.loadedAt,
    rows,
  };
}