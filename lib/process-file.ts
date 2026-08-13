import * as XLSX from "xlsx";
import { rankearClientes } from "@/lib/clientes";
import type { ClienteRankeado, Documento, FilaData, TipoDocumento } from "@/lib/types";

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

function excelSerialADate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    const utcDays = Math.floor(value - 25569);
    return new Date(utcDays * 86400 * 1000);
  }
  const parsed = new Date(String(value));
  return isNaN(parsed.getTime()) ? null : parsed;
}

function excelSerialToDate(value: unknown): string | null {
  const date = excelSerialADate(value);
  if (!date) return null;
  const dia = String(date.getUTCDate()).padStart(2, "0");
  const mes = String(date.getUTCMonth() + 1).padStart(2, "0");
  const anio = date.getUTCFullYear();
  return `${dia}/${mes}/${anio}`;
}

function extraerRif(observacion: unknown): string | null {
  const texto = String(observacion ?? "");
  const match = texto.match(/Cliente (.{10})/);
  return match ? match[1].trim() : null;
}

// Convierte a número sin redondear ni truncar decimales: el monto debe
// coincidir tal cual con el ERP. Solo se descarta si viene vacío o no numérico.
function aNumero(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  return isNaN(num) ? null : num;
}

function limpiarDocumento(row: Record<string, unknown>, hoy: Date) {
  const {
    MONEDA, TASA_1, TASA_2, VACIO_1, VACIO_2, SALDO, OBSERVACION, COD_VENDEDOR, ...rest
  } = row;
  const codVendedor = String(COD_VENDEDOR ?? "").trim();
  const vendedor = VENDEDORES[codVendedor] ?? null;
  const tipo = String(rest.TIPO ?? "").trim();
  const esDocumento = tipo === "FACT" || tipo === "Factura";
  let morosidad = 0;
  if (esDocumento) {
    const vencimiento = excelSerialADate(rest.VENCIMIENTO);
    if (vencimiento) {
      morosidad = Math.floor((hoy.getTime() - vencimiento.getTime()) / (1000 * 60 * 60 * 24));
    }
  }
  return {
    ...rest,
    TIPO: tipo as TipoDocumento,
    NUMERO: String(rest.NUMERO ?? ""),
    EMISION: excelSerialToDate(rest.EMISION),
    VENCIMIENTO: excelSerialToDate(rest.VENCIMIENTO),
    VENDEDOR: vendedor,
    RIF_CLIENTE: extraerRif(OBSERVACION),
    TOTAL: aNumero(rest.TOTAL),
    MOROSIDAD: morosidad,
    CLIENTE: null,
  };
}

// Aplana el ranking de clientes en las filas que muestra la tabla, asignando
// el RANGO (1..n) y un id único por documento.
export function filasDesdeRanking(clientesRankeados: ClienteRankeado[]): FilaData[] {
  const filas: FilaData[] = [];
  let seq = 0;
  for (let i = 0; i < clientesRankeados.length; i++) {
    const cliente = clientesRankeados[i];
    for (const doc of cliente.documentos) {
      filas.push({
        id: `doc-${seq++}`,
        RANGO: i + 1,
        CLIENTE: cliente.nombre,
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
  return filas;
}

export async function procesarArchivo(file: File): Promise<FilaData[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    header: COLUMN_NAMES,
    range: 1,
    defval: null,
  });

  const facturas = data.filter((row) => row.TIPO === "FACT");
  const notasCredito = data.filter((row) => row.TIPO === "N/CR");
  const clientes = data.filter((row) => !IGNORED_TIPOS.includes(row.TIPO as string));

  const hoy = new Date();
  const facturasLimpias = facturas.map((row) => limpiarDocumento(row, hoy)) as Documento[];
  const notasCreditoLimpias = notasCredito.map((row) => limpiarDocumento(row, hoy)) as Documento[];

  const mapaJoin = new Map<string, string>();
  for (const row of clientes) {
    const rif = String(row.TIPO ?? "").trim();
    const nombre = String(row.NUMERO ?? "").trim();
    if (rif && nombre) {
      mapaJoin.set(rif.slice(1), nombre);
    }
  }

  function asignarCliente(doc: Documento): Documento {
    const rif = doc.RIF_CLIENTE ?? "";
    return { ...doc, CLIENTE: mapaJoin.get(rif.slice(1)) ?? null };
  }

  const facturasConCliente = facturasLimpias.map(asignarCliente);
  const notasCreditoConCliente = notasCreditoLimpias.map(asignarCliente);

  const todosDocumentos = [...facturasConCliente, ...notasCreditoConCliente];
  const clientesRankeados = rankearClientes(todosDocumentos);

  return filasDesdeRanking(clientesRankeados);
}