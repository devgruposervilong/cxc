import type { DocumentType } from "../domain/documento";

export type UploadModel = {
  id: string;
  fileName: string;
  loadedAt: string;
};

export type ClientModel = {
  id: string;
  rif: string | null;
  name: string;
};

export type SellerModel = {
  id: string;
  code: string;
  name: string;
};

export type DocumentModel = {
  id: string;
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