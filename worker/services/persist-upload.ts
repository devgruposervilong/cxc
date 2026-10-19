import type { DataRow, DocumentType } from "@/lib/types";
import type { Db } from "../db/client";
import { DrizzleDocumentRepository } from "../repositories/drizzle-document-repository";
import { DrizzleUploadRepository } from "../repositories/drizzle-upload-repository";

export type PersistUploadInput = {
  fileName: string;
  loadedAt: string;
  rows: DataRow[];
};

export type PersistUploadResult = {
  uploadId: string;
  savedRows: number;
};

export async function persistUpload(
  db: Db,
  input: PersistUploadInput
): Promise<PersistUploadResult> {
  const uploadRepository = new DrizzleUploadRepository(db);
  const documentRepository = new DrizzleDocumentRepository(db);

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

export async function deleteDocumentFromUpload(
  db: Db,
  uploadId: string,
  type: DocumentType,
  number: string
): Promise<void> {
  const documentRepository = new DrizzleDocumentRepository(db);
  await documentRepository.deleteDocument(uploadId, type, number);
}

export async function deleteUploadById(db: Db, id: string): Promise<boolean> {
  const uploadRepository = new DrizzleUploadRepository(db);
  return uploadRepository.deleteUpload(id);
}
