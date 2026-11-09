import { and, asc, eq } from "drizzle-orm";
import type {
  DataRow,
  DocumentChanges,
  DocumentRepository,
  DocumentType,
} from "@/lib/types";
import type { Db } from "../db/client";
import { document } from "../db/schema";
import { dbRowToDataRow, domainTypeToDb } from "./mappers";

// D1 tiene un limite de parametros por sentencia. Cada documento usa 11
// columnas, asi que 8 filas = 88 parametros. Agrupamos varias sentencias en
// un batch para reducir round-trips sin acercarnos al limite.
const ROWS_PER_INSERT = 8;
const INSERTS_PER_BATCH = 20;

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

export class DrizzleDocumentRepository implements DocumentRepository {
  constructor(private readonly db: Db) {}

  async createDocuments(uploadId: string, rows: DataRow[]): Promise<void> {
    if (rows.length === 0) return;

    const values = rows.map((row) => ({
      uploadId,
      rank: row.rank,
      client: row.client ?? "SIN CLIENTE",
      rif: row.rif,
      type: domainTypeToDb(row.type),
      number: row.number,
      emission: row.emission,
      expiration: row.expiration,
      total: row.total,
      seller: row.seller,
    }));

    const inserts = chunk(values, ROWS_PER_INSERT).map((batch) =>
      this.db.insert(document).values(batch)
    );

    for (let index = 0; index < inserts.length; index += INSERTS_PER_BATCH) {
      await this.db.batch(
        inserts.slice(index, index + INSERTS_PER_BATCH) as any
      );
    }
  }

  async getDocumentsByUpload(uploadId: string): Promise<DataRow[]> {
    const rows = await this.db
      .select()
      .from(document)
      .where(eq(document.uploadId, uploadId))
      .orderBy(asc(document.rank));

    return rows.map(dbRowToDataRow);
  }

  async updateDocument(
    uploadId: string,
    type: DocumentType,
    number: string,
    changes: DocumentChanges
  ): Promise<boolean> {
    const rows = await this.db
      .update(document)
      .set({
        client: changes.client,
        type: domainTypeToDb(changes.type),
        number: changes.number,
        emission: changes.emission,
        expiration: changes.expiration,
        total: changes.total,
        seller: changes.seller,
      })
      .where(
        and(
          eq(document.uploadId, uploadId),
          eq(document.type, domainTypeToDb(type)),
          eq(document.number, number)
        )
      )
      .returning({ id: document.id });

    return rows.length > 0;
  }

  async deleteDocument(
    uploadId: string,
    type: DocumentType,
    number: string
  ): Promise<void> {
    await this.db
      .delete(document)
      .where(
        and(
          eq(document.uploadId, uploadId),
          eq(document.type, domainTypeToDb(type)),
          eq(document.number, number)
        )
      );
  }

  async deleteDocumentsByUpload(uploadId: string): Promise<void> {
    await this.db.delete(document).where(eq(document.uploadId, uploadId));
  }
}
