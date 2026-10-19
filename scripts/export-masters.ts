// Exporta los maestros (client + seller) desde Postgres via Prisma/Accelerate
// a un archivo SQL idempotente para D1.
//
// Uso:
//   1. npx prisma generate            (genera el cliente en ./generated)
//   2. npm run export:masters         (genera ./d1-masters.sql)
//   3. npx wrangler d1 execute cxc-db --remote --file d1-masters.sql
//
// Reglas:
//   - Los ids existentes nunca se sobrescriben (ON CONFLICT ... DO UPDATE sin id).
//   - seller.keyUrl se genera con cuid2 en D1 y no se sobrescribe en conflictos:
//     el enlace publico existente de cada vendedor se conserva aunque Postgres
//     siga guardando un uuid.
//   - No se toca seller.userId: los enlaces con usuarios ya creados se conservan.
//   - upload/document no se migran: arrancan vacios.

import "dotenv/config";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { createId } from "@paralleldrive/cuid2";
import { PrismaClient } from "../generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL no esta definida en el archivo .env");
}

const prisma = new PrismaClient({ accelerateUrl: url });

function sqlString(value: string | null | undefined): string {
  if (value === null || value === undefined) return "NULL";
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlEnum(value: string): string {
  return sqlString(value);
}

async function main() {
  const [clients, sellers] = await Promise.all([
    prisma.client.findMany({ orderBy: { code: "asc" } }),
    prisma.seller.findMany({ orderBy: { code: "asc" } }),
  ]);

  const statements: string[] = [
    "-- Maestros exportados desde Postgres (Prisma/Accelerate) para D1.",
    `-- Generado: ${new Date().toISOString()}`,
    `-- client: ${clients.length} filas | seller: ${sellers.length} filas`,
  ];

  for (const client of clients) {
    statements.push(
      [
        "INSERT INTO client (id, code, name, rif, seller, businessUnit)",
        `VALUES (${sqlString(createId())}, ${sqlString(client.code)}, ${sqlString(client.name)}, ${sqlString(client.rif)}, ${sqlString(client.seller)}, ${sqlString(client.businessUnit)})`,
        "ON CONFLICT(code) DO UPDATE SET",
        "  name = excluded.name,",
        "  rif = excluded.rif,",
        "  seller = excluded.seller,",
        "  businessUnit = excluded.businessUnit;",
      ].join("\n")
    );
  }

  for (const seller of sellers) {
    statements.push(
      [
        "INSERT INTO seller (id, code, name, surname, zone, keyUrl, status)",
        `VALUES (${sqlString(createId())}, ${sqlString(seller.code)}, ${sqlString(seller.name)}, ${sqlString(seller.surname)}, ${sqlString(seller.zone)}, ${sqlString(createId())}, ${sqlEnum(seller.status)})`,
        "ON CONFLICT(code) DO UPDATE SET",
        "  name = excluded.name,",
        "  surname = excluded.surname,",
        "  zone = excluded.zone,",
        "  status = excluded.status;",
      ].join("\n")
    );
  }

  const outputPath = join(process.cwd(), "d1-masters.sql");
  writeFileSync(outputPath, statements.join("\n"), "utf8");

  console.log(`Listo: ${outputPath}`);
  console.log(`  client: ${clients.length}`);
  console.log(`  seller: ${sellers.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
