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
import { SellerFilterDropdown } from "./seller-filter-dropdown";
import { Button, Tooltip, cn, menuItemClass } from "./ui";

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

function MenuActionButton({
  label,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      {...props}
      type="button"
      role="menuitem"
      className={cn(menuItemClass, className)}
    >
      {children}
      <span className="truncate">{label}</span>
    </button>
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
  const [saveStatus, setSaveStatus] = useState<{
    text: string;
    ok: boolean;
  } | null>(null);
  const saveUploadMutation = useSaveUpload();
  const deleteUploadMutation = useDeleteUpload();
  const deleteDocumentMutation = useDeleteDocument();

  const filteredRows = useMemo(() => {
    if (!selectedVendedor) return filas;
    return filas.filter(
      (fila) => (fila.seller ?? "SIN VENDEDOR") === selectedVendedor
    );
  }, [filas, selectedVendedor]);

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

  const saveLabel = saveUploadMutation.isPending
    ? "Guardando..."
    : uploadId
      ? "Ya guardado"
      : "Guardar";
  const deleteLabel = deleteUploadMutation.isPending
    ? "Eliminando..."
    : "Eliminar";
  const downloadLabel = uploadId
    ? "Descargar data"
    : "Guarda la data para descargar";
  const saveDisabled = saveUploadMutation.isPending || uploadId !== null;

  return (
    <div className="flex h-full flex-col gap-4">
      <HeaderActionsPortal target="desktop">
        {canManage && (
          <>
            <IconActionButton
              label={saveLabel}
              onClick={saveToDb}
              disabled={saveDisabled}
            >
              <Database className="h-4 w-4 text-zinc-600" />
            </IconActionButton>
            <IconActionButton
              label={deleteLabel}
              onClick={handleDeleteAll}
              disabled={deleteUploadMutation.isPending}
              className="hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </IconActionButton>
          </>
        )}
        <IconActionButton
          label={downloadLabel}
          onClick={downloadData}
          disabled={uploadId === null}
          className="hover:bg-emerald-50"
        >
          <Download className="h-4 w-4 text-emerald-600" />
        </IconActionButton>
      </HeaderActionsPortal>

      <HeaderActionsPortal target="menu">
        {canManage && (
          <>
            <MenuActionButton
              label={saveLabel}
              onClick={saveToDb}
              disabled={saveDisabled}
            >
              <Database className="h-4 w-4 shrink-0 text-zinc-600" />
            </MenuActionButton>
            <MenuActionButton
              label={deleteLabel}
              onClick={handleDeleteAll}
              disabled={deleteUploadMutation.isPending}
              className="hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 shrink-0 text-red-600" />
            </MenuActionButton>
          </>
        )}
        <MenuActionButton
          label={downloadLabel}
          onClick={downloadData}
          disabled={uploadId === null}
          className="hover:bg-emerald-50"
        >
          <Download className="h-4 w-4 shrink-0 text-emerald-600" />
        </MenuActionButton>
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
          <p className="text-[10px] font-medium uppercase leading-tight tracking-normal text-zinc-500 sm:text-xs sm:tracking-wide">
            Total Facturas
          </p>
          <p className="mt-1 text-lg font-semibold text-zinc-900 md:text-2xl">
            {totalInvoices}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm md:p-4">
          <p className="text-[10px] font-medium uppercase leading-tight tracking-normal text-zinc-500 sm:text-xs sm:tracking-wide">
            Total Notas de Credito
          </p>
          <p className="mt-1 text-lg font-semibold text-zinc-900 md:text-2xl">
            {totalCreditNotes}
          </p>
        </div>
        <div className="col-span-2 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm md:p-4 lg:col-span-1">
          <p className="text-[10px] font-medium uppercase leading-tight tracking-normal text-zinc-500 sm:text-xs sm:tracking-wide">
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

      <div className="flex shrink-0 items-center">
        <SellerFilterDropdown
          sellers={sellers}
          value={selectedVendedor}
          onChange={setSelectedVendedor}
        />
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
