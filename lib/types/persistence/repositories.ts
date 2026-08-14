import type { DocumentType } from "../domain/documento";
import type { ClientModel, DocumentModel, SellerModel, UploadModel } from "./models";

export type CreateUploadInput = {
  fileName: string;
  loadedAt: string;
};

export type CreateDocumentInput = {
  uploadId: string;
  clientId: string | null;
  sellerId: string | null;
  type: DocumentType;
  numero: string;
  emision: string | null;
  vencimiento: string | null;
  morosidad: number;
  total: number | null;
};

export type CreateClientInput = {
  rif: string | null;
  name: string;
};

export type CreateSellerInput = {
  code: string;
  name: string;
};

export interface UploadRepository {
  createUpload(input: CreateUploadInput): Promise<UploadModel>;
  getUploads(): Promise<UploadModel[]>;
  getLatestUpload(): Promise<UploadModel | null>;
  deleteUpload(id: string): Promise<void>;
}

export interface DocumentRepository {
  createDocuments(inputs: CreateDocumentInput[]): Promise<DocumentModel[]>;
  getDocumentsByUpload(uploadId: string): Promise<DocumentModel[]>;
  deleteDocument(id: string): Promise<void>;
  deleteDocumentsByUpload(uploadId: string): Promise<void>;
}

export interface ClientRepository {
  createClients(inputs: CreateClientInput[]): Promise<ClientModel[]>;
  getClients(): Promise<ClientModel[]>;
}

export interface SellerRepository {
  createSellers(inputs: CreateSellerInput[]): Promise<SellerModel[]>;
  getSellers(): Promise<SellerModel[]>;
}