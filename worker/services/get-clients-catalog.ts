import type { Client } from "@/lib/types";
import type { Db } from "../db/client";
import { DrizzleClientRepository } from "../repositories/drizzle-client-repository";

export type ClientsCatalog = {
  clients: Client[];
  businessUnits: string[];
};

// Maestro completo de clientes. Las unidades de negocio se derivan del propio
// maestro para que el filtro del frontend no dependa de otra fuente.
export async function getClientsCatalog(db: Db): Promise<ClientsCatalog> {
  const clients = await new DrizzleClientRepository(db).getClients();

  const businessUnits = Array.from(
    new Set(
      clients.map((client) => client.businessUnit.trim()).filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, "es"));

  return { clients, businessUnits };
}
