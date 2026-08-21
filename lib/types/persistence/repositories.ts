import type { DataRow, DocumentType } from "../application/data-row";
import type { Client } from "../application/client";
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
  deleteDocument(uploadId: string, type: DocumentType, number: string): Promise<void>;
  deleteDocumentsByUpload(uploadId: string): Promise<void>;
}

// Maestro de clientes: fuente de verdad de seller y businessUnit.
export interface ClientRepository {
  getClients(): Promise<Client[]>;
}
