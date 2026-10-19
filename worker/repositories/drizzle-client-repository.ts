import { asc } from "drizzle-orm";
import type { Client, ClientRepository } from "@/lib/types";
import type { Db } from "../db/client";
import { client } from "../db/schema";

export class DrizzleClientRepository implements ClientRepository {
  constructor(private readonly db: Db) {}

  async getClients(): Promise<Client[]> {
    const rows = await this.db.select().from(client).orderBy(asc(client.code));
    return rows.map((row) => ({
      code: row.code,
      name: row.name,
      rif: row.rif,
      seller: row.seller,
      businessUnit: row.businessUnit,
    }));
  }
}
