import "dotenv/config";
import * as XLSX from "xlsx";
import { prisma } from "../lib/prisma";

const FILE_PATH = process.env.VENDEDORES_PATH ?? "C:\\Users\\finanzas_4\\Desktop\\VENDEDORES.xlsx";

type Row = {
  COGIGO: string | number;
  NOMBRE?: string;
  APELLIDO?: string;
  ZONA?: string;
  KEY_URL?: string;
};

function cell(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s === "" ? null : s;
}

async function main() {
  const workbook = XLSX.readFile(FILE_PATH);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" });

  let count = 0;
  for (const row of rows) {
    const code = cell(row.COGIGO);
    const name = cell(row.NOMBRE);
    const keyUrl = cell(row.KEY_URL);
    if (!code || !name || !keyUrl) {
      console.warn(`Fila omitida (faltan datos): ${JSON.stringify(row)}`);
      continue;
    }

    await prisma.seller.upsert({
      where: { code },
      update: {
        name,
        surname: cell(row.APELLIDO),
        zone: cell(row.ZONA),
        keyUrl,
      },
      create: {
        code,
        name,
        surname: cell(row.APELLIDO),
        zone: cell(row.ZONA),
        keyUrl,
        status: "ACTIVO",
      },
    });
    count++;
    console.log(`OK ${code} ${name} -> /vendedor/${keyUrl}`);
  }
  console.log(`\n${count} vendedores sincronizados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
