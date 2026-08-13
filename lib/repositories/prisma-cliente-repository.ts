import { prisma } from "@/lib/prisma";
import type {
  ClienteModel,
  ClienteRepository,
  CrearClienteInput,
} from "@/lib/types";

export class PrismaClienteRepository implements ClienteRepository {
  async crearClientes(inputs: CrearClienteInput[]): Promise<ClienteModel[]> {
    const creados: ClienteModel[] = [];
    for (const input of inputs) {
      if (input.rif) {
        const cliente = await prisma.cliente.upsert({
          where: { rif: input.rif },
          create: { rif: input.rif, nombre: input.nombre },
          update: {},
        });
        creados.push({ id: cliente.id, rif: cliente.rif, nombre: cliente.nombre });
      } else {
        const cliente = await prisma.cliente.create({
          data: { rif: null, nombre: input.nombre },
        });
        creados.push({ id: cliente.id, rif: cliente.rif, nombre: cliente.nombre });
      }
    }
    return creados;
  }

  async obtenerClientes(): Promise<ClienteModel[]> {
    const clientes = await prisma.cliente.findMany({
      orderBy: { nombre: "asc" },
    });
    return clientes.map((c) => ({ id: c.id, rif: c.rif, nombre: c.nombre }));
  }
}