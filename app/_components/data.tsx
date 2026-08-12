//COMPONENTE EN LA RUTA /_COMPONENTS/DATA
"use client";

import { Fragment, useMemo, useState } from "react";
import { usePanel } from "../page";
import type { FilaData } from "@/lib/process-file";
import * as XLSX from "xlsx";
import { Download, Trash2 } from "lucide-react";

type GrupoCliente = {
  cliente: string;
  rango: number;
  docs: FilaData[];
  subtotal: number;
};

function formatoDosDecimales(valor: number) {
  return `$${valor.toFixed(2)}`;
}

function formatoSinRedondear(valor: number) {
  const limpio = Number(valor.toFixed(10));
  return `$${limpio.toLocaleString("en-US", {
    maximumFractionDigits: 20,
    useGrouping: false,
  })}`;
}

export default function Data() {
  const { filas, nombreArchivo, setFilas, setNombreArchivo } = usePanel();
  const [selectedVendedor, setSelectedVendedor] = useState<string | null>(null);

  const filasFiltradas = useMemo(() => {
    if (!selectedVendedor) return filas;
    return filas.filter((f) => f.VENDEDOR === selectedVendedor);
  }, [filas, selectedVendedor]);

  const totalFacturas = filasFiltradas.filter((f) => f.TIPO === "FACT").length;
  const totalNC = filasFiltradas.filter((f) => f.TIPO === "N/CR").length;
  const totalCxCGlobal = filas.reduce((s, f) => s + (f.TOTAL ?? 0), 0);

  const vendedores = useMemo(() => {
    const map = new Map<string, FilaData[]>();
    for (const f of filas) {
      const v = f.VENDEDOR ?? "SIN VENDEDOR";
      if (!map.has(v)) map.set(v, []);
      map.get(v)!.push(f);
    }
    return Array.from(map.entries()).map(([vendedor, docs]) => ({
      vendedor,
      facturas: docs.filter((d) => d.TIPO === "FACT").length,
      notasCredito: docs.filter((d) => d.TIPO === "N/CR").length,
      totalCxC: docs.reduce((s, d) => s + (d.TOTAL ?? 0), 0),
      porcentaje: (docs.reduce((s, d) => s + (d.TOTAL ?? 0), 0) / (totalCxCGlobal || 1)) * 100,
    }));
  }, [filas, totalCxCGlobal]);

  // Agrupa por CLIENTE, ordena los grupos por RANGO (menor a mayor)
  // y calcula el subtotal de cada cliente: TOTAL tal cual, sumando todos los documentos.
  // Las N/CR ya vienen con signo negativo en el archivo del ERP, así que sumarlas
  // directamente ya las neta correctamente contra las FACT (no hay que restarlas aparte).
  const grupos = useMemo<GrupoCliente[]>(() => {
    const map = new Map<string, FilaData[]>();
    for (const f of filasFiltradas) {
      const cliente = f.CLIENTE ?? "SIN CLIENTE";
      if (!map.has(cliente)) map.set(cliente, []);
      map.get(cliente)!.push(f);
    }

    const resultado = Array.from(map.entries()).map(([cliente, docs]) => {
      const rangosValidos = docs
        .map((d) => Number(d.RANGO))
        .filter((n) => Number.isFinite(n));
      const rango = rangosValidos.length ? Math.min(...rangosValidos) : Infinity;

      const subtotal = docs.reduce((s, d) => s + (d.TOTAL ?? 0), 0);

      return { cliente, rango, docs, subtotal };
    });

    resultado.sort((a, b) => a.rango - b.rango);
    return resultado;
  }, [filasFiltradas]);

  const totalGeneral = grupos.reduce((s, g) => s + g.subtotal, 0);

  function eliminarData() {
    setFilas([]);
    setNombreArchivo("");
  }

  function descargarData() {
    const rows = filas.map((f) => ({
      RANGO: f.RANGO,
      CLIENTE: f.CLIENTE,
      TIPO: f.TIPO,
      NUMERO: f.NUMERO,
      EMISION: f.EMISION,
      VENCIMIENTO: f.VENCIMIENTO,
      MOROSIDAD: f.MOROSIDAD,
      TOTAL: f.TOTAL,
      VENDEDOR: f.VENDEDOR,
    }));

    const ws = XLSX.utils.json_to_sheet(rows, {
      header: ["RANGO", "CLIENTE", "TIPO", "NUMERO", "EMISION", "VENCIMIENTO", "MOROSIDAD", "TOTAL", "VENDEDOR"],
    });

    ws["!cols"] = [
      { wch: 6 }, { wch: 40 }, { wch: 6 }, { wch: 10 },
      { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 14 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CXC");
    const base = nombreArchivo?.replace(/\.[^.]+$/, "") ?? "CXC";
    XLSX.writeFile(wb, `${base}_limpio.xlsx`);
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Toolbar: acciones en la parte superior derecha */}
      <div className="flex shrink-0 items-center justify-end gap-2">
        <button
          onClick={eliminarData}
          className="inline-flex items-center gap-2 rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
        >
          <Trash2 className="h-4 w-4" />
          ELIMINAR
        </button>
        <button
          onClick={descargarData}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          <Download className="h-4 w-4" />
          DESCARGAR DATA
        </button>
      </div>

      {/* Dashboard cards */}
      <div className="grid shrink-0 grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Total Facturas</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{totalFacturas}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Total Notas de Crédito</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{totalNC}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Total Cuentas x Cobrar</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">
            {formatoDosDecimales(totalGeneral)}
            {selectedVendedor && (
              <span className="ml-2 text-sm font-normal text-zinc-500">
                ({((totalGeneral / (totalCxCGlobal || 1)) * 100).toFixed(1)}%)
              </span>
            )}
          </p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
            Total sin redondear (validación ERP)
          </p>
          <p className="mt-1 text-2xl font-semibold text-amber-900">
            {formatoSinRedondear(totalGeneral)}
          </p>
        </div>
      </div>

      {/* Vendor filter chips */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedVendedor(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !selectedVendedor
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Todos
        </button>
        {vendedores.map((v) => (
          <button
            key={v.vendedor}
            onClick={() => setSelectedVendedor(v.vendedor)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedVendedor === v.vendedor
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
            title={`Facturas: ${v.facturas} | N/C: ${v.notasCredito} | CxC: ${formatoDosDecimales(v.totalCxC)} (${v.porcentaje.toFixed(1)}%)`}
          >
            {v.vendedor}
          </button>
        ))}
      </div>

      {/* Table: alto flexible con scroll vertical interno */}
      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-zinc-50">
            <tr className="border-b border-zinc-200">
              <th className="px-4 py-3 font-semibold text-zinc-700">RANGO</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">CLIENTE</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">TIPO</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">NUMERO</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">EMISION</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">VENCIMIENTO</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">MOROSIDAD</th>
              <th className="px-4 py-3 text-right font-semibold text-zinc-700">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {grupos.map((g) => (
              <Fragment key={g.cliente}>
                {g.docs.map((f, i) => (
                  <tr key={`${g.cliente}-${i}`} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="px-4 py-2 text-zinc-700">{f.RANGO}</td>
                    <td className="px-4 py-2 text-zinc-700">{f.CLIENTE}</td>
                    <td className="px-4 py-2 text-zinc-700">{f.TIPO}</td>
                    <td className="px-4 py-2 text-zinc-700">{String(f.NUMERO ?? "")}</td>
                    <td className="px-4 py-2 text-zinc-700">{f.EMISION}</td>
                    <td className="px-4 py-2 text-zinc-700">{f.VENCIMIENTO}</td>
                    <td className="px-4 py-2 text-zinc-700">{f.MOROSIDAD}</td>
                    <td className="px-4 py-2 text-right text-zinc-700">{formatoDosDecimales(f.TOTAL ?? 0)}</td>
                  </tr>
                ))}
                <tr className="border-b border-zinc-200 bg-zinc-50 font-medium">
                  <td colSpan={7} className="px-4 py-2 text-right text-zinc-700">
                    Subtotal {g.cliente}
                  </td>
                  <td className="px-4 py-2 text-right text-zinc-900">{formatoDosDecimales(g.subtotal)}</td>
                </tr>
              </Fragment>
            ))}
            <tr className="bg-zinc-900 font-semibold text-white">
              <td colSpan={7} className="px-4 py-3 text-right">
                TOTAL
              </td>
              <td className="px-4 py-3 text-right">{formatoDosDecimales(totalGeneral)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}