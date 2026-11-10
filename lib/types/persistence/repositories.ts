import type {
  DataRow,
  DocumentChanges,
  DocumentType,
} from "../application/data-row";
import type { Client } from "../application/client";
import type {
  Seller,
  SellerInput,
  SellerRecord,
} from "../application/seller";
import type { UploadModel } from "./models";

export type CreateUploadInput = {
  fileName: string;
  loadedAt: string;
};

export interface UploadRepository {
  createUpload(input: CreateUploadInput): Promise<UploadModel>;
  getUploads(): Promise<UploadModel[]>;
  getLatestUpload(): Promise<UploadModel | null>;
  deleteUpload(id: string): Promise<boolean>;
}

export interface DocumentRepository {
  createDocuments(uploadId: string, rows: DataRow[]): Promise<void>;
  getDocumentsByUpload(uploadId: string): Promise<DataRow[]>;
  // Identifica el documento por su tipo/numero originales para permitir
  // corregir esos mismos campos sin perder la fila.
  updateDocument(
    uploadId: string,
    type: DocumentType,
    number: string,
    changes: DocumentChanges
  ): Promise<boolean>;
  deleteDocument(uploadId: string, type: DocumentType, number: string): Promise<void>;
  deleteDocumentsByUpload(uploadId: string): Promise<void>;
}

export type EnsureClientInput = {
  name: string;
  rif: string;
  seller?: string | null;
  businessUnit?: string | null;
};

// Maestro de clientes: fuente de verdad de seller y businessUnit.
export interface ClientRepository {
  getClients(): Promise<Client[]>;
  // Crea solo los clientes que no existan (por nombre o RIF) y devuelve
  // cuantos se insertaron. Es idempotente: guardar la misma carga dos veces
  // no duplica el maestro.
  ensureClients(clients: EnsureClientInput[]): Promise<number>;
  createClient(input: Client): Promise<Client>;
  // Actualiza el maestro usando el codigo actual como identificador.
  updateClient(code: string, input: Client): Promise<Client | null>;
  deleteClient(code: string): Promise<boolean>;
}

// Maestro de vendedores: keyUrl es la clave de la URL pública por vendedor.
export interface SellerRepository {
  getSellerByKeyUrl(keyUrl: string): Promise<Seller | null>;
  getSellers(): Promise<Seller[]>;
  getSellerRecords(): Promise<SellerRecord[]>;
  createSeller(input: SellerInput): Promise<SellerRecord>;
  updateSeller(id: string, input: SellerInput): Promise<SellerRecord | null>;
  deleteSeller(id: string): Promise<boolean>;
}
