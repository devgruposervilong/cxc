import { prisma } from "@/lib/prisma";
import type {
  CreateDocumentInput,
  DocumentModel,
  DocumentRepository,
} from "@/lib/types";
import { documentToModel, domainTypeToDb } from "./mappers";

export class PrismaDocumentRepository implements DocumentRepository {
  async createDocuments(inputs: CreateDocumentInput[]): Promise<DocumentModel[]> {
    if (inputs.length === 0) return [];
    const created = await prisma.documento.createManyAndReturn({
      data: inputs.map((input) => ({
        cargaId: input.uploadId,
        clienteId: input.clientId,
        vendedorId: input.sellerId,
        tipo: domainTypeToDb(input.type),
        numero: input.numero,
        emision: input.emision,
        vencimiento: input.vencimiento,
        morosidad: input.morosidad,
        total: input.total,
      })),
    });
    return created.map(documentToModel);
  }

  async getDocumentsByUpload(uploadId: string): Promise<DocumentModel[]> {
    const documents = await prisma.documento.findMany({
      where: { cargaId: uploadId },
    });
    return documents.map(documentToModel);
  }

  async deleteDocument(id: string): Promise<void> {
    await prisma.documento.delete({ where: { id } });
  }

  async deleteDocumentsByUpload(uploadId: string): Promise<void> {
    await prisma.documento.deleteMany({ where: { cargaId: uploadId } });
  }
}