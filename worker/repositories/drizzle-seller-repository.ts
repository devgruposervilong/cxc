import { asc, eq } from "drizzle-orm";
import type { Seller, SellerRepository } from "@/lib/types";
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
