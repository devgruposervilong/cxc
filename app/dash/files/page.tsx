"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

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
function excelSerialToDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;

  let date: Date | null = null;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "number") {
    const utcDays = Math.floor(value - 25569);
    const utcMs = utcDays * 86400 * 1000;
    date = new Date(utcMs);
  } else {
    const parsed = new Date(String(value));
    date = isNaN(parsed.getTime()) ? null : parsed;
  }

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
function limpiarDocumento(row: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { MONEDA, TASA_1, TASA_2, VACIO_1, VACIO_2, SALDO, OBSERVACION, ...rest } = row;

  const codVendedor = String(rest.COD_VENDEDOR ?? "").trim();
  const vendedor = VENDEDORES[codVendedor as keyof typeof VENDEDORES] ?? null;

  return {
    ...rest,
    EMISION: excelSerialToDate(rest.EMISION),
    VENCIMIENTO: excelSerialToDate(rest.VENCIMIENTO),
    VENDEDOR: vendedor,
    RIF_CLIENTE: extraerRif(OBSERVACION),
    TOTAL: truncar2(rest.TOTAL),
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

    const facturasLimpias = facturas.map(limpiarDocumento);
    const notasCreditoLimpias = notasCredito.map(limpiarDocumento);

    console.log("Facturas:", facturasLimpias);
    console.log("Notas de crédito:", notasCreditoLimpias);
    console.log("Clientes:", clientes);
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