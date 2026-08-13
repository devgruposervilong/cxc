import { prisma } from "@/lib/prisma";
import type {
  CrearVendedorInput,
  VendedorModel,
  VendedorRepository,
} from "@/lib/types";

export class PrismaVendedorRepository implements VendedorRepository {
  async crearVendedores(inputs: CrearVendedorInput[]): Promise<VendedorModel[]> {
    const creados: VendedorModel[] = [];
    for (const input of inputs) {
      const vendedor = await prisma.vendedor.upsert({
        where: { codigo: input.codigo },
        create: { codigo: input.codigo, nombre: input.nombre },
        update: {},
      });
      creados.push({
        id: vendedor.id,
        codigo: vendedor.codigo,
        nombre: vendedor.nombre,
      });
    }
    return creados;
  }

  async obtenerVendedores(): Promise<VendedorModel[]> {
    const vendedores = await prisma.vendedor.findMany({
      orderBy: { codigo: "asc" },
    });
    return vendedores.map((v) => ({
      id: v.id,
      codigo: v.codigo,
      nombre: v.nombre,
    }));
  }
}