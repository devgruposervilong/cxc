import {
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { Database, Download, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import { refreshMorosidad } from "@/lib/morosidad";
import { rankRows } from "@/lib/ranking";
import { formatCurrency } from "@/lib/format";
import type { DataRow, DocumentType } from "@/lib/types";
import type { Me } from "@/src/lib/api";
import {
  useDeleteDocument,
  useDeleteUpload,
  useSaveUpload,
} from "@/src/hooks/use-uploads";
import { usePanel } from "@/src/panel";
import { CxcTable } from "./cxc-table";
import { ClientCardsMobile } from "./client-cards-mobile";
import { HeaderActionsPortal } from "./header-actions";
import { Button, Tooltip, cn } from "./ui";

function IconActionButton({
  label,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
}) {
  return (
    <Tooltip label={label}>
      <Button
        {...props}
        variant="ghost"
        aria-label={label}
        className={cn("h-9 w-9 px-0 py-0", className)}
      >
        {children}
      </Button>
    </Tooltip>
  );
}

type ClientGroup = {
  client: string;
  rank: number;
  subtotal: number;
  docs: DataRow[];
};

export function DataView({
  canManage,
  user,
}: {
  canManage: boolean;
  user: Me["user"];
}) {
  const {
    filas,
    nombreArchivo,
    cargadoEn,
    setFilas,
    setNombreArchivo,
    setCargadoEn,
    uploadId,
    setUploadId,
  } = usePanel();

  const roleLabel =
    user.role === "admin"
      ? "Admin"
      : user.role === "seller"
        ? "Vendedor"
        : "Usuario";

  const [selectedVendedor, setSelectedVendedor] = useState<string | null>(null);
  const [selectedUnidad, setSelectedUnidad] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<{
    text: string;
    ok: boolean;
  } | null>(null);
  const saveUploadMutation = useSaveUpload();
  const deleteUploadMutation = useDeleteUpload();
  const deleteDocumentMutation = useDeleteDocument();

  const unidades = useMemo(() => {
    const set = new Set<string>();
    for (const fila of filas) {
      if (fila.businessUnit) set.add(fila.businessUnit);
    }
    return Array.from(set).sort();
  }, [filas]);

  const filteredRows = useMemo(() => {
    let rows = filas;
    if (selectedUnidad) {
      rows = rows.filter((fila) => fila.businessUnit === selectedUnidad);
    }
    if (!selectedVendedor) return rows;
    return rows.filter((fila) => fila.seller === selectedVendedor);
  }, [filas, selectedVendedor, selectedUnidad]);

  const totalInvoices = filteredRows.filter((fila) => fila.type === "FACT").length;
  const totalCreditNotes = filteredRows.filter(
    (fila) => fila.type === "N/CR"
  ).length;
  const globalTotal = filas.reduce((sum, fila) => sum + (fila.total ?? 0), 0);

  const sellers = useMemo(() => {
    const map = new Map<string, DataRow[]>();
    for (const fila of filas) {
      const key = fila.seller ?? "SIN VENDEDOR";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(fila);
    }
    return Array.from(map.entries()).map(([name, docs]) => ({
      name,
      invoices: docs.filter((doc) => doc.type === "FACT").length,
      creditNotes: docs.filter((doc) => doc.type === "N/CR").length,
      receivables: docs.reduce((sum, doc) => sum + (doc.total ?? 0), 0),
      percentage:
        (docs.reduce((sum, doc) => sum + (doc.total ?? 0), 0) /
          (globalTotal || 1)) *
        100,
    }));
  }, [filas, globalTotal]);

  const groups = useMemo<ClientGroup[]>(() => {
    const map = new Map<string, DataRow[]>();
    for (const fila of filteredRows) {
      const client = fila.client ?? "SIN CLIENTE";
      if (!map.has(client)) map.set(client, []);
      map.get(client)!.push(fila);
    }

    const result = Array.from(map.entries()).map(([client, docs]) => {
      const validRanks = docs
        .map((doc) => Number(doc.rank))
        .filter((rank) => Number.isFinite(rank));
      const rank = validRanks.length ? Math.min(...validRanks) : Infinity;
      const subtotal = docs.reduce((sum, doc) => sum + (doc.total ?? 0), 0);
      return { client, rank, docs, subtotal };
    });

    result.sort((a, b) => a.rank - b.rank);
    return result;
  }, [filteredRows]);

  const grandTotal = groups.reduce((sum, group) => sum + group.subtotal, 0);

  function clearData() {
    setFilas([]);
    setNombreArchivo("");
    setCargadoEn(null);
    setUploadId(null);
  }

  async function deleteDocument(type: DocumentType, numero: string) {
    const remaining = filas.filter(
      (fila) => !(fila.type === type && fila.number === numero)
    );
    setFilas(rankRows(remaining));

    if (!uploadId) return;
    try {
      await deleteDocumentMutation.mutateAsync({ uploadId, type, number: numero });
    } catch (error) {
      setSaveStatus({
        text:
          error instanceof Error
            ? error.message
            : "Error al eliminar el documento",
        ok: false,
      });
    }
  }

  function downloadData() {
    const exportRows = groups.flatMap((group) => group.docs);
    const rows = exportRows.map((fila) => ({
      RANGO: fila.rank,
      CLIENTE: fila.client,
      TIPO: fila.type,
      NUMERO: fila.number,
      EMISION: fila.emission,
      VENCIMIENTO: fila.expiration,
      MOROSIDAD: fila.overdueDays,
      TOTAL: fila.total,
      VENDEDOR: fila.seller,
      UNIDAD_NEGOCIO: fila.businessUnit ?? "",
    }));

    const sheet = XLSX.utils.json_to_sheet(rows, {
      header: [
        "RANGO",
        "CLIENTE",
        "TIPO",
        "NUMERO",
        "EMISION",
        "VENCIMIENTO",
        "MOROSIDAD",
        "TOTAL",
        "VENDEDOR",
        "UNIDAD_NEGOCIO",
      ],
    });

    sheet["!cols"] = [
      { wch: 6 },
      { wch: 40 },
      { wch: 6 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 12 },
      { wch: 14 },
      { wch: 16 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "CXC");
    const base = nombreArchivo?.replace(/\.[^.]+$/, "") ?? "CXC";
    XLSX.writeFile(workbook, `${base}_limpio.xlsx`);
  }

  async function saveToDb() {
    if (!nombreArchivo || !cargadoEn) return;
    setSaveStatus(null);
    try {
      const { result, latest } = await saveUploadMutation.mutateAsync({
        fileName: nombreArchivo,
        loadedAt: cargadoEn,
        rows: filas,
      });
      setUploadId(result.uploadId);

      if (latest && latest.uploadId === result.uploadId) {
        setFilas(refreshMorosidad(latest.rows));
        setNombreArchivo(latest.fileName);
        setCargadoEn(latest.loadedAt);
      }

      setSaveStatus({
        text: `Guardado: ${result.savedRows} documentos${
          result.createdClients > 0
            ? ` · ${result.createdClients} ${
                result.createdClients === 1
                  ? "cliente nuevo"
                  : "clientes nuevos"
              }`
            : ""
        }`,
        ok: true,
      });
    } catch (error) {
      setSaveStatus({
        text: error instanceof Error ? error.message : "Error al guardar",
        ok: false,
      });
    }
  }

  async function handleDeleteAll() {
    if (!uploadId) {
      clearData();
      return;
    }
    setSaveStatus(null);
    try {
      await deleteUploadMutation.mutateAsync(uploadId);
      clearData();
      setSaveStatus({ text: "Carga eliminada", ok: true });
    } catch (error) {
      setSaveStatus({
        text: error instanceof Error ? error.message : "Error al eliminar",
        ok: false,
      });
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <HeaderActionsPortal>
        {canManage && (
          <>
            <IconActionButton
              label={
                saveUploadMutation.isPending
                  ? "Guardando..."
                  : uploadId
                    ? "Ya guardado"
                    : "Guardar"
              }
              onClick={saveToDb}
              disabled={saveUploadMutation.isPending || uploadId !== null}
            >
              <Database className="h-4 w-4 text-zinc-600" />
            </IconActionButton>
            <IconActionButton
              label={
                deleteUploadMutation.isPending ? "Eliminando..." : "Eliminar"
              }
              onClick={handleDeleteAll}
              disabled={deleteUploadMutation.isPending}
              className="hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </IconActionButton>
          </>
        )}
        <IconActionButton
          label={uploadId ? "Descargar data" : "Guarda la data para descargar"}
          onClick={downloadData}
          disabled={uploadId === null}
          className="hover:bg-emerald-50"
        >
          <Download className="h-4 w-4 text-emerald-600" />
        </IconActionButton>
      </HeaderActionsPortal>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <span className="min-w-0 text-sm text-zinc-500">
          Actualizado: {cargadoEn}
          {saveStatus && (
            <span
              className={saveStatus.ok ? "text-emerald-600" : "text-red-600"}
            >
              {" "}
              · {saveStatus.text}
            </span>
          )}
        </span>
        <div className="text-right leading-tight">
          <p className="max-w-[160px] truncate text-xs font-medium text-zinc-800">
            {user.name}
          </p>
          <p className="text-[11px] text-zinc-500">{roleLabel}</p>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-2 md:gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm md:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Total Facturas
          </p>
          <p className="mt-1 text-lg font-semibold text-zinc-900 md:text-2xl">
            {totalInvoices}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm md:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Total Notas de Credito
          </p>
          <p className="mt-1 text-lg font-semibold text-zinc-900 md:text-2xl">
            {totalCreditNotes}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm md:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Total Cuentas x Cobrar
          </p>
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

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedVendedor(null)}
            className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !selectedVendedor
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Todos
          </button>
          {sellers.map((seller) => (
            <button
              key={seller.name}
              onClick={() => setSelectedVendedor(seller.name)}
              className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedVendedor === seller.name
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
              title={`Facturas: ${seller.invoices} | N/C: ${seller.creditNotes} | CxC: ${formatCurrency(seller.receivables)}`}
            >
              {seller.name} · {seller.percentage.toFixed(1)}%
            </button>
          ))}
        </div>
        <label className="flex shrink-0 items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Unidad de negocio
          </span>
          <select
            value={selectedUnidad ?? ""}
            onChange={(event) => setSelectedUnidad(event.target.value || null)}
            className="cursor-pointer rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm transition-colors focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Todas</option>
            {unidades.map((unidad) => (
              <option key={unidad} value={unidad}>
                {unidad}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="md:hidden">
        <ClientCardsMobile groups={groups} showShare />
      </div>

      <div className="hidden min-h-0 flex-1 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-sm md:block">
        <CxcTable
          rows={filteredRows}
          showSeller
          showActions={canManage}
          showShare={canManage}
          onDelete={canManage ? deleteDocument : undefined}
        />
      </div>
    </div>
  );
}
