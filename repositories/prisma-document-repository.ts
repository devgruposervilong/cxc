import { prisma } from "@/lib/prisma";
import type { DataRow, DocumentRepository } from "@/lib/types";
import { dbRowToDataRow, domainTypeToDb } from "./mappers";

export class PrismaDocumentRepository implements DocumentRepository {
  async createDocuments(uploadId: string, rows: DataRow[]): Promise<void> {
    if (rows.length === 0) return;
    await prisma.document.createMany({
      data: rows.map((row) => ({
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
      })),
    });
  }

  async getDocumentsByUpload(uploadId: string): Promise<DataRow[]> {
    const documents = await prisma.document.findMany({
      where: { uploadId },
      orderBy: { rank: "asc" },
    });
    return documents.map(dbRowToDataRow);
  }

  async deleteDocumentsByUpload(uploadId: string): Promise<void> {
    await prisma.document.deleteMany({ where: { uploadId } });
  }
}
