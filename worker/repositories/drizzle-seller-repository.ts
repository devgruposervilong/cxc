import { createId } from "@paralleldrive/cuid2";
import { asc, eq } from "drizzle-orm";
import type {
  Seller,
  SellerInput,
  SellerRecord,
  SellerRepository,
} from "@/lib/types";
import type { Db } from "../db/client";
import { seller } from "../db/schema";

function toSeller(row: typeof seller.$inferSelect): Seller {
  return {
    code: row.code,
    name: row.name,
    surname: row.surname,
    zone: row.zone,
    keyUrl: row.keyUrl,
    status: row.status,
  };
}

function toSellerRecord(row: typeof seller.$inferSelect): SellerRecord {
  return {
    id: row.id,
    ...toSeller(row),
    hasUser: row.userId !== null,
  };
}

export class DrizzleSellerRepository implements SellerRepository {
  constructor(private readonly db: Db) {}

  async getSellerByKeyUrl(keyUrl: string): Promise<Seller | null> {
    const [row] = await this.db
      .select()
      .from(seller)
      .where(eq(seller.keyUrl, keyUrl))
      .limit(1);

    return row ? toSeller(row) : null;
  }

  async getSellers(): Promise<Seller[]> {
    const rows = await this.db.select().from(seller).orderBy(asc(seller.code));
    return rows.map(toSeller);
  }

  async getSellerRecords(): Promise<SellerRecord[]> {
    const rows = await this.db.select().from(seller).orderBy(asc(seller.code));
    return rows.map(toSellerRecord);
  }

  async createSeller(input: SellerInput): Promise<SellerRecord> {
    const [row] = await this.db
      .insert(seller)
      .values({
        code: input.code,
        name: input.name,
        surname: input.surname,
        zone: input.zone,
        status: input.status,
        // La URL del portal no se captura en el formulario: se genera una
        // clave aleatoria como las del maestro original.
        keyUrl: createId(),
      })
      .returning();

    return toSellerRecord(row);
  }

  async updateSeller(
    id: string,
    input: SellerInput
  ): Promise<SellerRecord | null> {
    const [row] = await this.db
      .update(seller)
      .set({
        code: input.code,
        name: input.name,
        surname: input.surname,
        zone: input.zone,
        status: input.status,
      })
      .where(eq(seller.id, id))
      .returning();

    return row ? toSellerRecord(row) : null;
  }

  async deleteSeller(id: string): Promise<boolean> {
    const rows = await this.db
      .delete(seller)
      .where(eq(seller.id, id))
      .returning({ id: seller.id });

    return rows.length > 0;
  }

  async getSellerByUserId(userId: string) {
    const [row] = await this.db
      .select()
      .from(seller)
      .where(eq(seller.userId, userId))
      .limit(1);

    return row ?? null;
  }

  async getSellerById(id: string) {
    const [row] = await this.db
      .select()
      .from(seller)
      .where(eq(seller.id, id))
      .limit(1);

    return row ?? null;
  }

  async getSellersWithoutUser() {
    const rows = await this.db
      .select()
      .from(seller)
      .where(eq(seller.status, "ACTIVO"))
      .orderBy(asc(seller.code));

    return rows.filter((row) => row.userId === null);
  }
}
