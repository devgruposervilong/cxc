import {
  normalizeClientName,
  type Client,
  type DataRow,
} from "@/lib/types";
import type { Db } from "../db/client";
import { DrizzleClientRepository } from "../repositories/drizzle-client-repository";
import { DrizzleDocumentRepository } from "../repositories/drizzle-document-repository";
import { DrizzleUploadRepository } from "../repositories/drizzle-upload-repository";

export type LoadedUpload = {
  uploadId: string;
  fileName: string;
  loadedAt: string;
  rows: DataRow[];
};

function buildClientIndex(clients: Client[]): Map<string, Client> {
  return new Map(
    clients.map((client) => [normalizeClientName(client.name), client])
  );
}

// El vendedor sale del maestro de clientes (fuente de verdad); si el
// documento no tiene par en el maestro, conserva el vendedor del archivo.
function enrichRows(rows: DataRow[], clients: Client[]): DataRow[] {
  const index = buildClientIndex(clients);
  return rows.map((row) => {
    const master = index.get(normalizeClientName(row.client));
    return {
      ...row,
      seller: master?.seller ?? row.seller,
      businessUnit: master?.businessUnit ?? null,
    };
  });
}

export async function getLatestUploadWithDocuments(
  db: Db
): Promise<LoadedUpload | null> {
  const uploadRepository = new DrizzleUploadRepository(db);
  const documentRepository = new DrizzleDocumentRepository(db);
  const clientRepository = new DrizzleClientRepository(db);

  const latest = await uploadRepository.getLatestUpload();
  if (!latest) return null;

  const [rows, clients] = await Promise.all([
    documentRepository.getDocumentsByUpload(latest.id),
    clientRepository.getClients(),
  ]);

  return {
    uploadId: latest.id,
    fileName: latest.fileName,
    loadedAt: latest.loadedAt,
    rows: enrichRows(rows, clients),
  };
}
