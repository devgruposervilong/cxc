import type { DataRow } from "../application/data-row";
import type { UploadModel } from "./models";

export type CreateUploadInput = {
  fileName: string;
  loadedAt: string;
};

export interface UploadRepository {
  createUpload(input: CreateUploadInput): Promise<UploadModel>;
  getUploads(): Promise<UploadModel[]>;
  getLatestUpload(): Promise<UploadModel | null>;
  deleteUpload(id: string): Promise<void>;
}

export interface DocumentRepository {
  createDocuments(uploadId: string, rows: DataRow[]): Promise<void>;
  getDocumentsByUpload(uploadId: string): Promise<DataRow[]>;
  deleteDocumentsByUpload(uploadId: string): Promise<void>;
}
