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

function cleanRow(row: Record<string, unknown>) {
  const sellerCode = String(row.COD_VENDEDOR ?? "").trim();
  const seller = SELLERS[sellerCode] ?? null;
  const type = String(row.TIPO ?? "").trim() as DocumentType;

  return {
    type,
    number: String(row.NUMERO ?? ""),
    emission: serialToDateString(row.EMISION),
    expiration: serialToDateString(row.VENCIMIENTO),
    // Placeholder: la morosidad real se recalcula en el cliente
    // (refreshMorosidad) para que esté al día al renderizar.
    overdueDays: 0,
    total: toNumber(row.TOTAL),
    seller,
    rif: extractRif(row.OBSERVACION),
  };
}

// Las filas "cliente" del archivo traen el RIF en TIPO y el nombre en NUMERO.
// El reporte suele anteponer un caracter al RIF en esa cabecera (de ahi el
// slice(1) historico); se indexan ambas variantes para tolerar diferencias de
// formato entre la cabecera y la observacion del documento.
type ClientRef = {
  name: string;
  rif: string;
};

function clientKey(value: string): string {
  return value.trim().toUpperCase();
}

function buildClientMap(data: Record<string, unknown>[]): Map<string, ClientRef> {
  const map = new Map<string, ClientRef>();
  for (const row of data) {
    if (IGNORED_TIPOS.includes(String(row.TIPO ?? "").trim())) continue;
    const rif = String(row.TIPO ?? "").trim();
    const name = String(row.NUMERO ?? "").trim();
    if (!rif || !name) continue;

    const client = { name, rif };
    const key = clientKey(rif);
    map.set(key, client);
    if (key.length > 1) map.set(key.slice(1), client);
  }
  return map;
}

function findClientByRif(
  map: Map<string, ClientRef>,
  rif: string | null
): ClientRef | null {
  if (!rif) return null;
  const key = clientKey(rif);
  if (!key) return null;
  return (
    map.get(key) ??
    (key.length > 1 ? map.get(key.slice(1)) : undefined) ??
    null
  );
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

  const clientMap = buildClientMap(data);
  const rows: DataRow[] = [];
  let currentClient: ClientRef | null = null;

  for (const row of data) {
    const tipo = String(row.TIPO ?? "").trim();

    if (tipo === "FACT" || tipo === "N/CR") {
      const cleaned = cleanRow(row);
      // Si el RIF de la observacion no aparece en el mapa, se usa la ultima
      // cabecera de cliente del reporte. Asi el documento conserva nombre y
      // RIF, y el guardado puede crear el cliente si no existe en el maestro.
      const client = findClientByRif(clientMap, cleaned.rif) ?? currentClient;
      rows.push({
        ...cleaned,
        rank: 0,
        client: client?.name ?? null,
        rif: cleaned.rif ?? client?.rif ?? null,
      });
      continue;
    }

    if (IGNORED_TIPOS.includes(tipo)) continue;

    const name = String(row.NUMERO ?? "").trim();
    if (tipo && name) currentClient = { name, rif: tipo };
  }

  return rankRows(rows);
}