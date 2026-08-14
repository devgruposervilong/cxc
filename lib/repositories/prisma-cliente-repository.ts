import { prisma } from "@/lib/prisma";
import type {
  ClientModel,
  ClientRepository,
  CreateClientInput,
} from "@/lib/types";

export class PrismaClientRepository implements ClientRepository {
  async createClients(inputs: CreateClientInput[]): Promise<ClientModel[]> {
    const created: ClientModel[] = [];
    for (const input of inputs) {
      if (input.rif) {
        const client = await prisma.cliente.upsert({
          where: { rif: input.rif },
          create: { rif: input.rif, nombre: input.name },
          update: {},
        });
        created.push({ id: client.id, rif: client.rif, name: client.nombre });
      } else {
        const client = await prisma.cliente.create({
          data: { rif: null, nombre: input.name },
        });
        created.push({ id: client.id, rif: client.rif, name: client.nombre });
      }
    }
    return created;
  }

  async getClients(): Promise<ClientModel[]> {
    const clients = await prisma.cliente.findMany({
      orderBy: { nombre: "asc" },
    });
    return clients.map((c) => ({ id: c.id, rif: c.rif, name: c.nombre }));
  }
}