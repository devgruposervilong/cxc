import { prisma } from "@/lib/prisma";
import type {
  CreateSellerInput,
  SellerModel,
  SellerRepository,
} from "@/lib/types";

export class PrismaSellerRepository implements SellerRepository {
  async createSellers(inputs: CreateSellerInput[]): Promise<SellerModel[]> {
    const created: SellerModel[] = [];
    for (const input of inputs) {
      const seller = await prisma.vendedor.upsert({
        where: { codigo: input.code },
        create: { codigo: input.code, nombre: input.name },
        update: {},
      });
      created.push({
        id: seller.id,
        code: seller.codigo,
        name: seller.nombre,
      });
    }
    return created;
  }

  async getSellers(): Promise<SellerModel[]> {
    const sellers = await prisma.vendedor.findMany({
      orderBy: { codigo: "asc" },
    });
    return sellers.map((v) => ({
      id: v.id,
      code: v.codigo,
      name: v.nombre,
    }));
  }
}