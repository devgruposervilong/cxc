//COMPONENTE EN LA RUTA /_COMPONENTS/DATA-VIEW
"use client";

import { Fragment, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePanel } from "../page";
import { rankRows } from "@/lib/ranking";
import { refreshMorosidad } from "@/lib/morosidad";
import { formatCurrency } from "@/lib/format";
import { saveUpload, deleteUpload, deleteDocumentFromUpload, getLatestUpload } from "@/lib/api/uploads";
import { UPLOAD_QUERY_KEY } from "@/lib/hooks/use-upload-data";
import type { DataRow, DocumentType } from "@/lib/types";
import * as XLSX from "xlsx";
import { Database, Download, Trash2 } from "lucide-react";
import ClientCardsMobile from "./client-cards-mobile";

type ClientGroup = {
  client: string;
  rank: number;
  docs: DataRow[];
  subtotal: number;
};

export default function DataView() {
  const { filas, nombreArchivo, cargadoEn, setFilas, setNombreArchivo, setCargadoEn, uploadId, setUploadId } =
    usePanel();
  const [selectedVendedor, setSelectedVendedor] = useState<string | null>(null);
  const [selectedUnidad, setSelectedUnidad] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ text: string; ok: boolean } | null>(null);
  const queryClient = useQueryClient();

  // Unidades de negocio disponibles según las filas cargadas (vienen del
  // maestro de clientes vía el join en lectura).
  const unidades = useMemo(() => {
    const set = new Set<string>();
    for (const f of filas) {
      if (f.businessUnit) set.add(f.businessUnit);
    }
    return Array.from(set).sort();
  }, [filas]);

  const filteredRows = useMemo(() => {
    let rows = filas;
    if (selectedUnidad) rows = rows.filter((f) => f.businessUnit === selectedUnidad);
    if (!selectedVendedor) return rows;
    return rows.filter((f) => f.seller === selectedVendedor);
  }, [filas, selectedVendedor, selectedUnidad]);

  const totalInvoices = filteredRows.filter((f) => f.type === "FACT").length;
  const totalCreditNotes = filteredRows.filter((f) => f.type === "N/CR").length;
  const globalTotal = filas.reduce((s, f) => s + (f.total ?? 0), 0);

  const sellers = useMemo(() => {
    const map = new Map<string, DataRow[]>();
    for (const f of filas) {
      const v = f.seller ?? "SIN VENDEDOR";
      if (!map.has(v)) map.set(v, []);
      map.get(v)!.push(f);
    }
    return Array.from(map.entries()).map(([name, docs]) => ({
      name,
      invoices: docs.filter((d) => d.type === "FACT").length,
      creditNotes: docs.filter((d) => d.type === "N/CR").length,
      receivables: docs.reduce((s, d) => s + (d.total ?? 0), 0),
      percentage: (docs.reduce((s, d) => s + (d.total ?? 0), 0) / (globalTotal || 1)) * 100,
    }));
  }, [filas, globalTotal]);

  // Agrupa por cliente, ordena los grupos por RANGO (menor a mayor)
  // y calcula el subtotal de cada cliente: TOTAL tal cual, sumando todos los documentos.
  // Las N/CR ya vienen con signo negativo en el archivo del ERP, así que sumarlas
  // directamente ya las neta correctamente contra las FACT (no hay que restarlas aparte).
  const groups = useMemo<ClientGroup[]>(() => {
    const map = new Map<string, DataRow[]>();
    for (const f of filteredRows) {
      const client = f.client ?? "SIN CLIENTE";
      if (!map.has(client)) map.set(client, []);
      map.get(client)!.push(f);
    }

    const result = Array.from(map.entries()).map(([client, docs]) => {
      const validRanks = docs
        .map((d) => Number(d.rank))
        .filter((n) => Number.isFinite(n));
      const rank = validRanks.length ? Math.min(...validRanks) : Infinity;

      const subtotal = docs.reduce((s, d) => s + (d.total ?? 0), 0);

      return { client, rank, docs, subtotal };
    });

    result.sort((a, b) => a.rank - b.rank);
    return result;
  }, [filteredRows]);

  const grandTotal = groups.reduce((s, g) => s + g.subtotal, 0);

  function clearData() {
    setFilas([]);
    setNombreArchivo("");
    setCargadoEn(null);
    setUploadId(null);
  }

  async function deleteDocument(type: DocumentType, numero: string) {
    const remaining = filas.filter(
      (f) => !(f.type === type && f.number === numero)
    );
    setFilas(rankRows(remaining));

    // Si la carga ya está persistida, se borra también de la BD para que la
    // descarga (y la recarga de la app) sigan excluyendo el documento.
    if (!uploadId) return;
    try {
      await deleteDocumentFromUpload(uploadId, type, numero);
      queryClient.invalidateQueries({ queryKey: UPLOAD_QUERY_KEY });
    } catch (error) {
      setSaveStatus({
        text: error instanceof Error ? error.message : "Error al eliminar el documento",
        ok: false,
      });
    }
  }

  function downloadData() {
    const exportRows = groups.flatMap((g) => g.docs);
    const rows = exportRows.map((f) => ({
      RANGO: f.rank,
      CLIENTE: f.client,
      TIPO: f.type,
      NUMERO: f.number,
      EMISION: f.emission,
      VENCIMIENTO: f.expiration,
      MOROSIDAD: f.overdueDays,
      TOTAL: f.total,
      VENDEDOR: f.seller,
      UNIDAD_NEGOCIO: f.businessUnit ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows, {
      header: ["RANGO", "CLIENTE", "TIPO", "NUMERO", "EMISION", "VENCIMIENTO", "MOROSIDAD", "TOTAL", "VENDEDOR", "UNIDAD_NEGOCIO"],
    });

    ws["!cols"] = [
      { wch: 6 }, { wch: 40 }, { wch: 6 }, { wch: 10 },
      { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 16 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CXC");
    const base = nombreArchivo?.replace(/\.[^.]+$/, "") ?? "CXC";
    XLSX.writeFile(wb, `${base}_limpio.xlsx`);
  }

  async function saveToDb() {
    if (!nombreArchivo || !cargadoEn) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const result = await saveUpload({
        fileName: nombreArchivo,
        loadedAt: cargadoEn,
        rows: filas,
      });
      setUploadId(result.uploadId);

      // Rehidrata la tabla desde la BD sin recargar la página: el GET devuelve
      // las filas ya unidas al maestro (vendedor y unidad de negocio), de modo
      // que lo que se muestra queda idéntico a lo que servirá la próxima carga.
      const fresh = await getLatestUpload();
      if (fresh && fresh.uploadId === result.uploadId) {
        setFilas(refreshMorosidad(fresh.rows));
        setNombreArchivo(fresh.fileName);
        setCargadoEn(fresh.loadedAt);
      }

      setSaveStatus({ text: `Guardado: ${result.savedRows} documentos`, ok: true });
      queryClient.invalidateQueries({ queryKey: UPLOAD_QUERY_KEY });
    } catch (error) {
      setSaveStatus({
        text: error instanceof Error ? error.message : "Error al guardar",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAll() {
    if (!uploadId) {
      clearData();
      return;
    }
    setDeleting(true);
    setSaveStatus(null);
    try {
      await deleteUpload(uploadId);
      clearData();
      setSaveStatus({ text: "Carga eliminada", ok: true });
      queryClient.invalidateQueries({ queryKey: UPLOAD_QUERY_KEY });
    } catch (error) {
      setSaveStatus({
        text: error instanceof Error ? error.message : "Error al eliminar",
        ok: false,
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Toolbar: información de carga y acciones en la parte superior derecha */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <span className="min-w-0 text-sm text-zinc-500">
          Actualizado: {cargadoEn}
          {saveStatus && (
            <span className={saveStatus.ok ? "text-emerald-600" : "text-red-600"}>
              {" "}· {saveStatus.text}
            </span>
          )}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={saveToDb}
            disabled={saving || uploadId !== null}
            title={
              uploadId
                ? "Esta carga ya está guardada en la base de datos"
                : undefined
            }
            className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Database className="h-4 w-4" />
            {saving ? "GUARDANDO..." : uploadId ? "YA GUARDADO" : "GUARDAR"}
          </button>
          <button
            onClick={handleDeleteAll}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "ELIMINANDO..." : "ELIMINAR"}
          </button>
          <button
            onClick={downloadData}
            disabled={uploadId === null}
            title={
              uploadId
                ? undefined
                : "La descarga se habilita al guardar la data en la base de datos"
            }
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            DESCARGAR DATA
          </button>
        </div>
      </div>

      {/* Dashboard cards */}
      <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-3 md:gap-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm md:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Total Facturas</p>
          <p className="mt-1 text-lg font-semibold text-zinc-900 md:text-2xl">{totalInvoices}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm md:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Total Notas de Crédito</p>
          <p className="mt-1 text-lg font-semibold text-zinc-900 md:text-2xl">{totalCreditNotes}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm md:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Total Cuentas x Cobrar</p>
          <p className="mt-1 text-lg font-semibold text-emerald-600 md:text-2xl">
            {formatCurrency(grandTotal)}
            {selectedVendedor && (
              <span className="ml-2 text-sm font-normal text-zinc-500">
                ({((grandTotal / (globalTotal || 1)) * 100).toFixed(1)}%)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filtros: vendedores a la izquierda, unidad de negocio a la derecha */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
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
          {sellers.map((s) => (
            <button
              key={s.name}
              onClick={() => setSelectedVendedor(s.name)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedVendedor === s.name
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
              title={`Facturas: ${s.invoices} | N/C: ${s.creditNotes} | CxC: ${formatCurrency(s.receivables)}`}
            >
              {s.name} · {s.percentage.toFixed(1)}%
            </button>
          ))}
        </div>
        <label className="flex shrink-0 items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Unidad de negocio
          </span>
          <select
            value={selectedUnidad ?? ""}
            onChange={(e) => setSelectedUnidad(e.target.value || null)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm transition-colors focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Todas</option>
            {unidades.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Vista mobile: cards expandibles por cliente (scroll global del documento) */}
      <div className="md:hidden">
        <ClientCardsMobile groups={groups} />
      </div>

      {/* Table: alto flexible con scroll vertical interno (solo desktop) */}
      <div className="hidden min-h-0 flex-1 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-zinc-900 text-white">
            <tr className="border-b border-zinc-700">
              <th className="px-4 py-3 font-semibold">RANGO</th>
              <th className="px-4 py-3 font-semibold">CLIENTE</th>
              <th className="px-4 py-3 font-semibold">TIPO</th>
              <th className="px-4 py-3 font-semibold">NUMERO</th>
              <th className="px-4 py-3 font-semibold">EMISION</th>
              <th className="px-4 py-3 font-semibold">VENCIMIENTO</th>
              <th className="px-4 py-3 text-center font-semibold">MOROSIDAD (DIAS)</th>
              <th className="px-4 py-3 font-semibold">VENDEDOR</th>
              <th className="px-4 py-3 text-right font-semibold">TOTAL</th>
              <th className="px-4 py-3 font-semibold">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <Fragment key={g.client}>
                {g.docs.map((f, i) => (
                  <tr key={`${g.client}-${i}`} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="px-4 py-2 text-zinc-700">{f.rank}</td>
                    <td className="px-4 py-2 text-zinc-700">{f.client}</td>
                    <td className="px-4 py-2 text-zinc-700">{f.type}</td>
                    <td className="px-4 py-2 text-zinc-700">{f.number}</td>
                    <td className="px-4 py-2 text-zinc-700">{f.emission}</td>
                    <td className="px-4 py-2 text-zinc-700">{f.expiration}</td>
                    <td className={`px-4 py-2 text-center ${f.overdueDays >= 15 ? "text-red-600" : "text-zinc-700"}`}>
                      {f.overdueDays}
                    </td>
                    <td className="px-4 py-2 text-zinc-700">{f.seller}</td>
                    <td className="px-4 py-2 text-right text-zinc-700">{formatCurrency(f.total ?? 0)}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => deleteDocument(f.type, f.number)}
                        className="rounded p-1 text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                        aria-label="Eliminar documento"
                        title="Eliminar documento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="border-b border-zinc-200 bg-zinc-100 font-bold">
                  <td colSpan={8} className="px-4 py-2 text-right text-zinc-700">
                    Subtotal {g.client}
                  </td>
                  <td className="px-4 py-2 text-right text-zinc-900 font-bold">{formatCurrency(g.subtotal)}</td>
                  <td />
                </tr>
              </Fragment>
            ))}
            <tr className="bg-zinc-900 font-semibold text-white">
              <td colSpan={8} className="px-4 py-3 text-right">
                TOTAL
              </td>
              <td className="px-4 py-3 text-right">{formatCurrency(grandTotal)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}