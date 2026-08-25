import { prisma } from "@/lib/prisma";
import type { Seller, SellerRepository } from "@/lib/types";

export class PrismaSellerRepository implements SellerRepository {
  async getSellerByKeyUrl(keyUrl: string): Promise<Seller | null> {
    const seller = await prisma.seller.findUnique({ where: { keyUrl } });
    return seller ? this.toSeller(seller) : null;
  }

  async getSellers(): Promise<Seller[]> {
    const sellers = await prisma.seller.findMany({ orderBy: { code: "asc" } });
    return sellers.map((s) => this.toSeller(s));
  }

  private toSeller(s: { code: string; name: string; surname: string | null; zone: string | null; keyUrl: string }): Seller {
    return {
      code: s.code,
      name: s.name,
      surname: s.surname,
      zone: s.zone,
      keyUrl: s.keyUrl,
    };
  }
}
