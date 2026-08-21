import { PrismaUploadRepository } from "@/repositories/prisma-upload-repository";
import { PrismaDocumentRepository } from "@/repositories/prisma-document-repository";
import { PrismaClientRepository } from "@/repositories/prisma-client-repository";
import type { Client, DataRow } from "@/lib/types";

export type LoadedUpload = {
  uploadId: string;
  fileName: string;
  loadedAt: string;
  rows: DataRow[];
};

const uploadRepository = new PrismaUploadRepository();
const documentRepository = new PrismaDocumentRepository();
const clientRepository = new PrismaClientRepository();

// Normaliza el nombre para que el join Document.client ↔ Client.name no
// dependa de espacios sobrantes ni de mayúsculas/minúsculas del ERP.
function normalizeName(value: string | null): string {
  return value?.trim().toUpperCase() ?? "";
}

function buildClientIndex(clients: Client[]): Map<string, Client> {
  return new Map(clients.map((client) => [normalizeName(client.name), client]));
}

// Une cada documento con su cliente del maestro: el vendedor sale de Client
// (fuente de verdad) y se adjunta la unidad de negocio. Si el documento no
// tiene par en el maestro, conserva el seller del archivo y la unidad queda
// null; al actualizar el maestro, la próxima lectura lo resuelve sin tener
// que re-subir la CxC.
function enrichRows(rows: DataRow[], clients: Client[]): DataRow[] {
  const index = buildClientIndex(clients);
  return rows.map((row) => {
    const master = index.get(normalizeName(row.client));
    return {
      ...row,
      seller: master?.seller ?? row.seller,
      businessUnit: master?.businessUnit ?? null,
    };
  });
}

// Devuelve la carga más reciente con sus documentos ya mapeados a DataRow
// y enriquecidos contra el maestro de clientes.
// null si la base de datos no tiene ninguna carga.
export async function getLatestUploadWithDocuments(): Promise<LoadedUpload | null> {
  const upload = await uploadRepository.getLatestUpload();
  if (!upload) return null;

  const [rows, clients] = await Promise.all([
    documentRepository.getDocumentsByUpload(upload.id),
    clientRepository.getClients(),
  ]);

  return {
    uploadId: upload.id,
    fileName: upload.fileName,
    loadedAt: upload.loadedAt,
    rows: enrichRows(rows, clients),
  };
}