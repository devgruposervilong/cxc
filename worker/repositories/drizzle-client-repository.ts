import { asc, eq } from "drizzle-orm";
import {
  normalizeClientName,
  normalizeClientRif,
  type Client,
  type ClientRepository,
  type EnsureClientInput,
} from "@/lib/types";
import type { Db } from "../db/client";
import { client } from "../db/schema";

// D1 tiene un limite de parametros por sentencia. Cada cliente usa 5 columnas,
// asi que 16 filas = 80 parametros. El maestro se lee completo porque es
// pequeno (cientos de filas) y se compara en memoria.
const ROWS_PER_INSERT = 16;

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

function toClient(row: typeof client.$inferSelect): Client {
  return {
    code: row.code,
    name: row.name,
    rif: row.rif,
    seller: row.seller,
    businessUnit: row.businessUnit,
  };
}

export class DrizzleClientRepository implements ClientRepository {
  constructor(private readonly db: Db) {}

  async getClients(): Promise<Client[]> {
    const rows = await this.db.select().from(client).orderBy(asc(client.code));
    return rows.map(toClient);
  }

  async createClient(input: Client): Promise<Client> {
    const [row] = await this.db
      .insert(client)
      .values({
        code: input.code,
        name: input.name,
        rif: input.rif,
        seller: input.seller,
        businessUnit: input.businessUnit,
      })
      .returning();

    return toClient(row);
  }

  async updateClient(code: string, input: Client): Promise<Client | null> {
    const [row] = await this.db
      .update(client)
      .set({
        code: input.code,
        name: input.name,
        rif: input.rif,
        seller: input.seller,
        businessUnit: input.businessUnit,
      })
      .where(eq(client.code, code))
      .returning();

    return row ? toClient(row) : null;
  }

  async deleteClient(code: string): Promise<boolean> {
    const rows = await this.db
      .delete(client)
      .where(eq(client.code, code))
      .returning({ id: client.id });

    return rows.length > 0;
  }

  async ensureClients(inputs: EnsureClientInput[]): Promise<number> {
    if (inputs.length === 0) return 0;

    const existing = await this.getClients();
    const names = new Set(existing.map((row) => normalizeClientName(row.name)));
    const rifs = new Set(
      existing.map((row) => normalizeClientRif(row.rif)).filter(Boolean)
    );
    const codes = new Set(
      existing.map((row) => normalizeClientRif(row.code)).filter(Boolean)
    );

    const pending: (typeof client.$inferInsert)[] = [];

    for (const input of inputs) {
      const name = input.name.trim();
      const rif = input.rif.trim().toUpperCase();
      const nameKey = normalizeClientName(name);
      const rifKey = normalizeClientRif(rif);

      if (!nameKey || !rifKey) continue;
      if (names.has(nameKey) || rifs.has(rifKey) || codes.has(rifKey)) continue;

      names.add(nameKey);
      rifs.add(rifKey);
      codes.add(rifKey);

      pending.push({
        // El maestro del ERP usa el RIF como codigo de cliente. Para los
        // clientes nuevos no hay otro codigo disponible.
        code: rif,
        name,
        rif,
        seller: input.seller?.trim() || "SIN VENDEDOR",
        businessUnit: input.businessUnit?.trim() ?? "",
      });
    }

    let created = 0;
    for (const batch of chunk(pending, ROWS_PER_INSERT)) {
      const inserted = await this.db
        .insert(client)
        .values(batch)
        .onConflictDoNothing()
        .returning({ id: client.id });
      created += inserted.length;
    }

    return created;
  }
}
