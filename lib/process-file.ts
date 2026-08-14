import * as XLSX from "xlsx";
import { rankRows } from "@/lib/ranking";
import type { DataRow, DocumentType } from "@/lib/types";

const COLUMN_NAMES = [
  "TIPO", "NUMERO", "EMISION", "VENCIMIENTO", "OBSERVACION",
  "VACIO_1", "COD_VENDEDOR", "TASA_1", "MONEDA", "VACIO_2",
  "TASA_2", "TOTAL", "SALDO",
];

const IGNORED_TIPOS = [
  "FACT", "N/CR",
  "* La moneda del documento mostrado guarda relación inversa.",
  "Totales del Cliente:",
];

const SELLERS: Record<string, string> = {
  "000046": "SUGEIDY",
  "000065": "SOL",
  "000077": "ADRIANA",
  "000075": "ANGEL",
  "000078": "MI VAQUITA",
  "000079": "MARIELISA",
};

function serialToDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    const utcDays = Math.floor(value - 25569);
    return new Date(utcDays * 86400 * 1000);
  }
  const parsed = new Date(String(value));
  return isNaN(parsed.getTime()) ? null : parsed;
}

function serialToDateString(value: unknown): string | null {
  const date = serialToDate(value);
  if (!date) return null;
  const dia = String(date.getUTCDate()).padStart(2, "0");
  const mes = String(date.getUTCMonth() + 1).padStart(2, "0");
  const anio = date.getUTCFullYear();
  return `${dia}/${mes}/${anio}`;
}

function extractRif(observacion: unknown): string | null {
  const texto = String(observacion ?? "");
  const match = texto.match(/Cliente (.{10})/);
  return match ? match[1].trim() : null;
}

// Convierte a número sin redondear ni truncar decimales: el monto debe
// coincidir tal cual con el ERP. Solo se descarta si viene vacío o no numérico.
function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  return isNaN(num) ? null : num;
}

function cleanRow(row: Record<string, unknown>, today: Date) {
  const sellerCode = String(row.COD_VENDEDOR ?? "").trim();
  const seller = SELLERS[sellerCode] ?? null;
  const type = String(row.TIPO ?? "").trim() as DocumentType;

  let overdueDays = 0;
  if (type === "FACT") {
    const expiration = serialToDate(row.VENCIMIENTO);
    if (expiration) {
      overdueDays = Math.floor(
        (today.getTime() - expiration.getTime()) / (1000 * 60 * 60 * 24)
      );
    }
    // Las facturas aún no vencidas tendrían morosidad negativa (-1, -2, ...).
    // Se lleva a cero para que en la tabla todas las facturas aparezcan antes
    // que las notas de crédito.
    overdueDays = Math.max(0, overdueDays);
  }

  return {
    type,
    number: String(row.NUMERO ?? ""),
    emission: serialToDateString(row.EMISION),
    expiration: serialToDateString(row.VENCIMIENTO),
    overdueDays,
    total: toNumber(row.TOTAL),
    seller,
    rif: extractRif(row.OBSERVACION),
  };
}

// Las filas "cliente" del archivo traen el RIF en TIPO y el nombre en NUMERO.
function buildClientMap(data: Record<string, unknown>[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of data) {
    if (IGNORED_TIPOS.includes(String(row.TIPO ?? "").trim())) continue;
    const rif = String(row.TIPO ?? "").trim();
    const name = String(row.NUMERO ?? "").trim();
    if (rif && name) map.set(rif.slice(1), name);
  }
  return map;
}

// Fuente de verdad de la app: retorna las filas ya limpias y ranqueadas.
// Ese DataRow[] es lo que se muestra en la tabla, se exporta y viaja a la BD.
export async function processFile(file: File): Promise<DataRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    header: COLUMN_NAMES,
    range: 1,
    defval: null,
  });

  const today = new Date();
  const clientMap = buildClientMap(data);
  const documentRows = data.filter(
    (row) => row.TIPO === "FACT" || row.TIPO === "N/CR"
  );

  const rows: DataRow[] = documentRows.map((row) => {
    const cleaned = cleanRow(row, today);
    return {
      ...cleaned,
      rank: 0,
      client: cleaned.rif ? clientMap.get(cleaned.rif.slice(1)) ?? null : null,
    };
  });

  return rankRows(rows);
}