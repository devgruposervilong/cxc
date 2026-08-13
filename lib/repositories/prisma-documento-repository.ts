import { prisma } from "@/lib/prisma";
import type {
  CrearDocumentoInput,
  DocumentoModel,
  DocumentoRepository,
} from "@/lib/types";
import { documentoAModelo, tipoDominioADb } from "./mappers";

export class PrismaDocumentoRepository implements DocumentoRepository {
  async crearDocumentos(inputs: CrearDocumentoInput[]): Promise<DocumentoModel[]> {
    if (inputs.length === 0) return [];
    const creados = await prisma.documento.createManyAndReturn({
      data: inputs.map((input) => ({
        cargaId: input.cargaId,
        clienteId: input.clienteId,
        vendedorId: input.vendedorId,
        tipo: tipoDominioADb(input.tipo),
        numero: input.numero,
        emision: input.emision,
        vencimiento: input.vencimiento,
        morosidad: input.morosidad,
        total: input.total,
      })),
    });
    return creados.map(documentoAModelo);
  }

  async obtenerDocumentosPorCarga(cargaId: string): Promise<DocumentoModel[]> {
    const documentos = await prisma.documento.findMany({
      where: { cargaId },
    });
    return documentos.map(documentoAModelo);
  }

  async eliminarDocumento(id: string): Promise<void> {
    await prisma.documento.delete({ where: { id } });
  }

  async eliminarDocumentosPorCarga(cargaId: string): Promise<void> {
    await prisma.documento.deleteMany({ where: { cargaId } });
  }
}