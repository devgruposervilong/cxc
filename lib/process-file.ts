import * as XLSX from "xlsx";
import { rankClients } from "@/lib/clientes";
import type { DataRow, Document, DocumentType, RankedClient } from "@/lib/types";

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

const VENDEDORES: Record<string, string> = {
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

function cleanDocument(row: Record<string, unknown>, today: Date) {
  const {
    MONEDA, TASA_1, TASA_2, VACIO_1, VACIO_2, SALDO, OBSERVACION, COD_VENDEDOR, ...rest
  } = row;
  const sellerCode = String(COD_VENDEDOR ?? "").trim();
  const vendedor = VENDEDORES[sellerCode] ?? null;
  const tipo = String(rest.TIPO ?? "").trim();
  const isInvoice = tipo === "FACT" || tipo === "Factura";
  let morosidad = 0;
  if (isInvoice) {
    const vencimiento = serialToDate(rest.VENCIMIENTO);
    if (vencimiento) {
      morosidad = Math.floor((today.getTime() - vencimiento.getTime()) / (1000 * 60 * 60 * 24));
    }
    // Las facturas aún no vencidas tendrían morosidad negativa (-1, -2, ...).
    // Se lleva a cero para que en la tabla todas las facturas aparezcan antes
    // que las notas de crédito.
    morosidad = Math.max(0, morosidad);
  }
  return {
    ...rest,
    TIPO: tipo as DocumentType,
    NUMERO: String(rest.NUMERO ?? ""),
    EMISION: serialToDateString(rest.EMISION),
    VENCIMIENTO: serialToDateString(rest.VENCIMIENTO),
    VENDEDOR: vendedor,
    RIF_CLIENTE: extractRif(OBSERVACION),
    TOTAL: toNumber(rest.TOTAL),
    MOROSIDAD: morosidad,
    CLIENTE: null,
  };
}

// Aplana el ranking de clientes en las filas que muestra la tabla, asignando
// el RANGO (1..n) y un id único por documento.
export function rowsFromRanking(rankedClients: RankedClient[]): DataRow[] {
  const rows: DataRow[] = [];
  let seq = 0;
  for (let i = 0; i < rankedClients.length; i++) {
    const rankedClient = rankedClients[i];
    for (const doc of rankedClient.documents) {
      rows.push({
        id: `doc-${seq++}`,
        RANGO: i + 1,
        CLIENTE: rankedClient.name,
        TIPO: doc.TIPO,
        NUMERO: doc.NUMERO,
        EMISION: doc.EMISION,
        VENCIMIENTO: doc.VENCIMIENTO,
        MOROSIDAD: doc.MOROSIDAD,
        TOTAL: doc.TOTAL,
        VENDEDOR: doc.VENDEDOR,
      });
    }
  }
  return rows;
}

export async function processFile(file: File): Promise<DataRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    header: COLUMN_NAMES,
    range: 1,
    defval: null,
  });

  const invoices = data.filter((row) => row.TIPO === "FACT");
  const creditNotes = data.filter((row) => row.TIPO === "N/CR");
  const clients = data.filter((row) => !IGNORED_TIPOS.includes(row.TIPO as string));

  const today = new Date();
  const cleanedInvoices = invoices.map((row) => cleanDocument(row, today)) as Document[];
  const cleanedCreditNotes = creditNotes.map((row) => cleanDocument(row, today)) as Document[];

  const joinMap = new Map<string, string>();
  for (const row of clients) {
    const rif = String(row.TIPO ?? "").trim();
    const name = String(row.NUMERO ?? "").trim();
    if (rif && name) {
      joinMap.set(rif.slice(1), name);
    }
  }

  function assignClient(doc: Document): Document {
    const rif = doc.RIF_CLIENTE ?? "";
    return { ...doc, CLIENTE: joinMap.get(rif.slice(1)) ?? null };
  }

  const invoicesWithClient = cleanedInvoices.map(assignClient);
  const creditNotesWithClient = cleanedCreditNotes.map(assignClient);

  const allDocuments = [...invoicesWithClient, ...creditNotesWithClient];
  const rankedClients = rankClients(allDocuments);

  return rowsFromRanking(rankedClients);
}