import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL no está definida en el archivo .env");
}

const prisma = new PrismaClient({ accelerateUrl: url });

export { prisma };
