import { prisma } from "@/lib/prisma";
import type { Client, ClientRepository } from "@/lib/types";

export class PrismaClientRepository implements ClientRepository {
  // El maestro es pequeño (cientos de filas): se lee completo y el join
  // contra Document se hace en memoria al servir la data.
  async getClients(): Promise<Client[]> {
    const clients = await prisma.client.findMany({ orderBy: { code: "asc" } });
    return clients.map((c) => ({
      code: c.code,
      name: c.name,
      rif: c.rif,
      seller: c.seller,
      businessUnit: c.businessUnit,
    }));
  }
}