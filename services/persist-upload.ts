import { PrismaUploadRepository } from "@/repositories/prisma-upload-repository";
import { PrismaDocumentRepository } from "@/repositories/prisma-document-repository";
import type { DataRow } from "@/lib/types";

export type PersistUploadInput = {
  fileName: string;
  loadedAt: string;
  rows: DataRow[];
};

export type PersistUploadResult = {
  uploadId: string;
  savedRows: number;
};

const uploadRepository = new PrismaUploadRepository();
const documentRepository = new PrismaDocumentRepository();

// Orquesta la cadena de repositorios: crea la carga y persiste sus documentos.
// Si falla la persistencia de documentos, se revierte la carga para no dejar
// cargas huérfanas en la base de datos.
export async function persistUpload(input: PersistUploadInput): Promise<PersistUploadResult> {
  const upload = await uploadRepository.createUpload({
    fileName: input.fileName,
    loadedAt: input.loadedAt,
  });

  try {
    await documentRepository.createDocuments(upload.id, input.rows);
  } catch (error) {
    await uploadRepository.deleteUpload(upload.id);
    throw error;
  }

  return { uploadId: upload.id, savedRows: input.rows.length };
}

// Borra la carga y, por cascade (onDelete: Cascade), todos sus documentos.
// Devuelve false si la carga no existía.
export async function deleteUploadById(id: string): Promise<boolean> {
  return uploadRepository.deleteUpload(id);
}