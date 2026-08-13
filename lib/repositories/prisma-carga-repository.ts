import { prisma } from "@/lib/prisma";
import type {
  CargaModel,
  CargaRepository,
  CrearCargaInput,
} from "@/lib/types";
import { cargaAModelo, parsearCargadoEn } from "./mappers";

export class PrismaCargaRepository implements CargaRepository {
  async crearCarga(input: CrearCargaInput): Promise<CargaModel> {
    const carga = await prisma.carga.create({
      data: {
        nombreArchivo: input.nombreArchivo,
        cargadoEn: parsearCargadoEn(input.cargadoEn),
      },
    });
    return cargaAModelo(carga);
  }

  async obtenerCargas(): Promise<CargaModel[]> {
    const cargas = await prisma.carga.findMany({
      orderBy: { cargadoEn: "desc" },
    });
    return cargas.map(cargaAModelo);
  }

  async obtenerCargaMasReciente(): Promise<CargaModel | null> {
    const carga = await prisma.carga.findFirst({
      orderBy: { cargadoEn: "desc" },
    });
    return carga ? cargaAModelo(carga) : null;
  }

  async eliminarCarga(id: string): Promise<void> {
    await prisma.carga.delete({ where: { id } });
  }
}