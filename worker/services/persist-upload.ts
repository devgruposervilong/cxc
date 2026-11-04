import {
  normalizeClientName,
  type DataRow,
  type DocumentType,
  type EnsureClientInput,
} from "@/lib/types";
import type { Db } from "../db/client";
import { DrizzleClientRepository } from "../repositories/drizzle-client-repository";
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
  createdClients: number;
};

// Los documentos traen el nombre y el RIF del cliente resueltos por la
// limpieza del Excel. Si ese cliente no existe en el maestro, se crea con
// esos datos minimos; seller/businessUnit se completan si el archivo los trae.
function collectClients(rows: DataRow[]): EnsureClientInput[] {
  const clients = new Map<string, EnsureClientInput>();

  for (const row of rows) {
    const name = row.client?.trim();
    const rif = row.rif?.trim();
    if (!name || !rif) continue;

    const key = normalizeClientName(name);
    if (!key) continue;

    const existing = clients.get(key);
    if (existing) {
      // El vendedor/unidad puede venir vacio en la primera fila del cliente
      // y completo en otra; se conserva el primer dato disponible.
      existing.seller ??= row.seller;
      existing.businessUnit ??= row.businessUnit;
      continue;
    }

    clients.set(key, {
      name,
      rif,
      seller: row.seller,
      businessUnit: row.businessUnit,
    });
  }

  return Array.from(clients.values());
}

export async function persistUpload(
  db: Db,
  input: PersistUploadInput
): Promise<PersistUploadResult> {
  const uploadRepository = new DrizzleUploadRepository(db);
  const documentRepository = new DrizzleDocumentRepository(db);
  const clientRepository = new DrizzleClientRepository(db);

  const upload = await uploadRepository.createUpload({
    fileName: input.fileName,
    loadedAt: input.loadedAt,
  });

  try {
    const createdClients = await clientRepository.ensureClients(
      collectClients(input.rows)
    );
    await documentRepository.createDocuments(upload.id, input.rows);

    return {
      uploadId: upload.id,
      savedRows: input.rows.length,
      createdClients,
    };
  } catch (error) {
    await uploadRepository.deleteUpload(upload.id);
    throw error;
  }
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
