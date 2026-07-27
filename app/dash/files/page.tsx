"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { rankearClientes } from "@/lib/clientes";
import type { Documento } from "@/lib/clientes";

// Nombres fijos de columnas, en el orden exacto del archivo fuente
const COLUMN_NAMES = [
  "TIPO",
  "NUMERO",
  "EMISION",
  "VENCIMIENTO",
  "OBSERVACION",
  "VACIO_1",
  "COD_VENDEDOR",
  "TASA_1",
  "MONEDA",
  "VACIO_2",
  "TASA_2",
  "TOTAL",
  "SALDO",
];

// Valores que NO son documentos ni "basura" a exportar aparte
// (líneas de texto/formato del reporte que se descartan por completo)
const IGNORED_TIPOS = [
  "FACT",
  "N/CR",
  "* La moneda del documento mostrado guarda relación inversa.",
  "Totales del Cliente:",
];

const VENDEDORES = {
  "000046": "SUGEIDY",
  "000065": "SOL",
  "000077": "ADRIANA",
  "000075": "ANGEL",
  "000078": "MI VAQUITA",
  "000079": "MARIELISA",
};

// Excel guarda las fechas como número de días desde 1900-01-01 (con el bug
// del año bisiesto de 1900 incluido). 25569 = días entre esa fecha y el
// epoch de JS (1970-01-01). Se usa el instante UTC del serial y se lee
// con getUTC*, así el día no se corre por la zona horaria local.
function excelSerialADate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;

  if (value instanceof Date) return value;

  if (typeof value === "number") {
    const utcDays = Math.floor(value - 25569);
    const utcMs = utcDays * 86400 * 1000;
    return new Date(utcMs);
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

// Busca "Cliente " seguido de los 10 caracteres del RIF
function extraerRif(observacion: unknown): string | null {
  const texto = String(observacion ?? "");
  const match = texto.match(/Cliente (.{10})/);
  return match ? match[1].trim() : null;
}

// Deja solo 2 decimales SIN redondear (trunca lo que sobre)
function truncar2(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  if (isNaN(num)) return null;
  const factor = 100;
  return Math.trunc(num * factor) / factor;
}

// Transformación común para filas de documentos (FACT o N/CR):
// - quita MONEDA, TASA_1, TASA_2, VACIO_1, VACIO_2, SALDO, OBSERVACION
// - agrega VENDEDOR a partir de COD_VENDEDOR
// - formatea EMISION y VENCIMIENTO como string dd/mm/aaaa
// - extrae RIF_CLIENTE desde OBSERVACION (antes de descartarla)
// - deja TOTAL con solo 2 decimales (truncado, sin redondear)
// - calcula MOROSIDAD (días entre hoy y VENCIMIENTO); si no es FACT/Factura → 0
function limpiarDocumento(row: Record<string, unknown>, hoy: Date) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { MONEDA, TASA_1, TASA_2, VACIO_1, VACIO_2, SALDO, OBSERVACION, ...rest } = row;

  const codVendedor = String(rest.COD_VENDEDOR ?? "").trim();
  const vendedor = VENDEDORES[codVendedor as keyof typeof VENDEDORES] ?? null;

  const tipo = String(rest.TIPO ?? "").trim();
  const esDocumento = tipo === "FACT" || tipo === "Factura";

  let morosidad = 0;
  if (esDocumento) {
    const vencimiento = excelSerialADate(rest.VENCIMIENTO);
    if (vencimiento) {
      const diffMs = hoy.getTime() - vencimiento.getTime();
      morosidad = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }
  }

  return {
    ...rest,
    EMISION: excelSerialToDate(rest.EMISION),
    VENCIMIENTO: excelSerialToDate(rest.VENCIMIENTO),
    VENDEDOR: vendedor,
    RIF_CLIENTE: extraerRif(OBSERVACION),
    TOTAL: truncar2(rest.TOTAL),
    MOROSIDAD: morosidad,
    CLIENTE: null,
  };
}

export default function FilesPage() {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const buffer = await file.arrayBuffer();

    // xlsx soporta tanto .xls (BIFF8) como .xlsx sin configuración extra
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    // header: nuestro array de nombres -> se asignan como keys directamente
    // range: 1 -> saltamos la fila 0 (el header original del archivo)
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      header: COLUMN_NAMES,
      range: 1,
      defval: null,
    });

    // Set 1: solo facturas
    const facturas = data.filter((row) => row.TIPO === "FACT");

    // Set 2: solo notas de crédito
    const notasCredito = data.filter((row) => row.TIPO === "N/CR");

    // Set 3: todo lo que no sea documento válido ni texto de formato/relleno del reporte
    const clientes = data.filter(
      (row) => !IGNORED_TIPOS.includes(row.TIPO as string)
    );

    const hoy = new Date();
    const facturasLimpias = facturas.map((row) => limpiarDocumento(row, hoy)) as Documento[];
    const notasCreditoLimpias = notasCredito.map((row) => limpiarDocumento(row, hoy)) as Documento[];

    // Set 3: mapear TIPO → RIF y NUMERO → CLIENTE (nombre)
    const mapaJoin = new Map<string, string>(); // join key (RIF sin 1er char) → nombre cliente
    for (const row of clientes) {
      const rif = String(row.TIPO ?? "").trim();
      const nombre = String(row.NUMERO ?? "").trim();
      if (rif && nombre) {
        mapaJoin.set(rif.slice(1), nombre);
      }
    }

    // Asignar CLIENTE a cada documento mediante join
    function asignarCliente(doc: Documento): Documento {
      const rif = doc.RIF_CLIENTE ?? "";
      const joinKey = rif.slice(1);
      return { ...doc, CLIENTE: mapaJoin.get(joinKey) ?? null };
    }

    const facturasConCliente = facturasLimpias.map(asignarCliente);
    const notasCreditoConCliente = notasCreditoLimpias.map(asignarCliente);

    const todosDocumentos = [...facturasConCliente, ...notasCreditoConCliente];
    const clientesRankeados = rankearClientes(todosDocumentos);

    console.log("=== CLIENTES RANKEADOS ===");
    console.table(clientesRankeados.map((c) => ({
      CLIENTE: c.nombre,
      MOROSIDAD: c.morosidadMax,
      TOTAL: c.totalGeneral.toFixed(2),
      DOCS: c.documentos.length,
    })));
    console.log("Detalle por cliente:");
    for (const c of clientesRankeados) {
      console.group(c.nombre);
      console.table(c.documentos.map((d) => ({
        TIPO: d.TIPO,
        NUMERO: d.NUMERO,
        EMISION: d.EMISION,
        VENCIMIENTO: d.VENCIMIENTO,
        MOROSIDAD: d.MOROSIDAD,
        VENDEDOR: d.VENDEDOR,
        TOTAL: d.TOTAL?.toFixed(2),
      })));
      console.log(`Total ${c.nombre}: $${c.totalGeneral.toFixed(2)}`);
      console.groupEnd();
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <label
          htmlFor="excel-upload"
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 px-6 py-10 text-center transition hover:border-zinc-400"
        >
          <span className="mb-2 text-sm font-medium text-zinc-800">
            Sube tu archivo Excel
          </span>
          <span className="mb-4 text-sm text-zinc-500">
            {fileName ? `Archivo: ${fileName}` : "Acepta archivos .xls y .xlsx"}
          </span>
          <input
            id="excel-upload"
            type="file"
            accept=".xls,.xlsx"
            className="sr-only"
            onChange={handleFileChange}
          />
          <span className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
            Seleccionar archivo
          </span>
        </label>
      </div>
    </main>
  );
}