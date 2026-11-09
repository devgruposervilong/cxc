import { Fragment, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getGroupedRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import type { DataRow, DocumentChanges, DocumentType } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { WhatsAppShareButton } from "./whatsapp-share-button";
import { cn } from "./ui";

type CxcTableProps = {
  rows: DataRow[];
  showSeller?: boolean;
  showActions?: boolean;
  showShare?: boolean;
  onDelete?: (type: DocumentType, number: string) => void;
  onUpdate?: (original: DataRow, changes: DocumentChanges) => Promise<void>;
  emptyMessage?: string;
};

type DocumentDraft = {
  client: string;
  type: DocumentType;
  number: string;
  emission: string;
  expiration: string;
  total: string;
  seller: string;
};

const headerClassById: Record<string, string> = {
  rank: "px-4 py-3 font-semibold",
  client: "px-4 py-3 font-semibold",
  type: "px-4 py-3 font-semibold",
  number: "px-4 py-3 font-semibold",
  emission: "px-4 py-3 font-semibold",
  expiration: "px-4 py-3 font-semibold",
  overdueDays: "px-4 py-3 text-center font-semibold",
  seller: "px-4 py-3 font-semibold",
  total: "px-4 py-3 text-right font-semibold",
  actions: "px-4 py-3 font-semibold",
};

const cellClassById: Record<string, string> = {
  rank: "px-4 py-2 text-zinc-700",
  client: "px-4 py-2 text-zinc-700",
  type: "px-4 py-2 text-zinc-700",
  number: "px-4 py-2 text-zinc-700",
  emission: "px-4 py-2 text-zinc-700",
  expiration: "px-4 py-2 text-zinc-700",
  overdueDays: "px-4 py-2 text-center",
  seller: "px-4 py-2 text-zinc-700",
  total: "px-4 py-2 text-right text-zinc-700",
  actions: "px-4 py-2",
};

const inputClass =
  "w-full min-w-[6rem] rounded border border-zinc-300 bg-white px-1.5 py-1 text-base text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 lg:text-xs";

function documentKey(type: DocumentType, number: string): string {
  return `${type}\u0000${number}`;
}

function rowKey(row: DataRow): string {
  return documentKey(row.type, row.number);
}

function toDraft(row: DataRow): DocumentDraft {
  return {
    client: row.client ?? "",
    type: row.type,
    number: row.number,
    emission: row.emission ?? "",
    expiration: row.expiration ?? "",
    total: row.total === null ? "" : String(row.total),
    seller: row.seller ?? "",
  };
}

function parseTotal(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toChanges(draft: DocumentDraft): DocumentChanges | null {
  const total = parseTotal(draft.total);
  if (total === undefined) return null;

  return {
    client: draft.client.trim() || "SIN CLIENTE",
    type: draft.type,
    number: draft.number.trim(),
    emission: draft.emission.trim() || null,
    expiration: draft.expiration.trim() || null,
    total,
    seller: draft.seller.trim() || null,
  };
}

export function CxcTable({
  rows,
  showSeller = true,
  showActions = true,
  showShare = true,
  onDelete,
  onUpdate,
  emptyMessage = "No hay cuentas por cobrar para mostrar.",
}: CxcTableProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<DocumentDraft | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<DataRow>[]>(() => {
    const isEditing = (row: DataRow) => editingKey === rowKey(row);

    const defs: ColumnDef<DataRow>[] = [
      { accessorKey: "rank", header: "RANGO" },
      {
        accessorKey: "client",
        header: "CLIENTE",
        cell: ({ row }) =>
          isEditing(row.original) ? (
            <input
              value={draft?.client ?? ""}
              onChange={(event) =>
                setDraft((current) =>
                  current ? { ...current, client: event.target.value } : current
                )
              }
              aria-label="Cliente"
              className={inputClass}
            />
          ) : (
            row.original.client
          ),
      },
      {
        accessorKey: "type",
        header: "TIPO",
        cell: ({ row }) =>
          isEditing(row.original) ? (
            <select
              value={draft?.type ?? "FACT"}
              onChange={(event) =>
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        type: event.target.value as DocumentType,
                      }
                    : current
                )
              }
              aria-label="Tipo de documento"
              className={inputClass}
            >
              <option value="FACT">FACT</option>
              <option value="N/CR">N/CR</option>
            </select>
          ) : (
            row.original.type
          ),
      },
      {
        accessorKey: "number",
        header: "NUMERO",
        cell: ({ row }) =>
          isEditing(row.original) ? (
            <input
              value={draft?.number ?? ""}
              onChange={(event) =>
                setDraft((current) =>
                  current ? { ...current, number: event.target.value } : current
                )
              }
              aria-label="Numero de documento"
              className={inputClass}
            />
          ) : (
            row.original.number
          ),
      },
      {
        accessorKey: "emission",
        header: "EMISION",
        cell: ({ row }) =>
          isEditing(row.original) ? (
            <input
              value={draft?.emission ?? ""}
              onChange={(event) =>
                setDraft((current) =>
                  current
                    ? { ...current, emission: event.target.value }
                    : current
                )
              }
              placeholder="DD/MM/AAAA"
              aria-label="Fecha de emision"
              className={inputClass}
            />
          ) : (
            row.original.emission
          ),
      },
      {
        accessorKey: "expiration",
        header: "VENCIMIENTO",
        cell: ({ row }) =>
          isEditing(row.original) ? (
            <input
              value={draft?.expiration ?? ""}
              onChange={(event) =>
                setDraft((current) =>
                  current
                    ? { ...current, expiration: event.target.value }
                    : current
                )
              }
              placeholder="DD/MM/AAAA"
              aria-label="Fecha de vencimiento"
              className={inputClass}
            />
          ) : (
            row.original.expiration
          ),
      },
      {
        accessorKey: "overdueDays",
        header: "MOROSIDAD (DIAS)",
        cell: ({ getValue }) => {
          const value = Number(getValue() ?? 0);
          return (
            <span className={value >= 15 ? "text-red-600" : "text-zinc-700"}>
              {value}
            </span>
          );
        },
      },
    ];

    if (showSeller) {
      defs.push({
        accessorKey: "seller",
        header: "VENDEDOR",
        cell: ({ row }) =>
          isEditing(row.original) ? (
            <input
              value={draft?.seller ?? ""}
              onChange={(event) =>
                setDraft((current) =>
                  current ? { ...current, seller: event.target.value } : current
                )
              }
              aria-label="Vendedor"
              className={inputClass}
            />
          ) : (
            row.original.seller
          ),
      });
    }

    defs.push({
      accessorKey: "total",
      header: "TOTAL",
      cell: ({ row }) =>
        isEditing(row.original) ? (
          <input
            type="number"
            step="0.01"
            value={draft?.total ?? ""}
            onChange={(event) =>
              setDraft((current) =>
                current ? { ...current, total: event.target.value } : current
              )
            }
            aria-label="Total"
            className={cn(inputClass, "min-w-[5rem] text-right")}
          />
        ) : (
          formatCurrency(Number(row.original.total ?? 0))
        ),
    });

    if (showActions) {
      defs.push({
        id: "actions",
        header: "ACCIONES",
        cell: ({ row }) => {
          if (isEditing(row.original)) {
            const saving = savingKey === rowKey(row.original);
            const canSave =
              Boolean(draft?.number.trim()) &&
              parseTotal(draft?.total ?? "") !== undefined;

            return (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={async () => {
                    if (!draft || !onUpdate) return;
                    const changes = toChanges(draft);
                    if (!changes) return;

                    const key = rowKey(row.original);
                    setSavingKey(key);
                    try {
                      await onUpdate(row.original, changes);
                      setEditingKey(null);
                      setDraft(null);
                    } finally {
                      setSavingKey(null);
                    }
                  }}
                  disabled={savingKey !== null || !canSave}
                  className="cursor-pointer rounded p-1 text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Guardar cambios"
                  title={
                    canSave
                      ? "Guardar cambios"
                      : "Completa el numero y usa un total valido"
                  }
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingKey(null);
                    setDraft(null);
                  }}
                  disabled={savingKey !== null}
                  className="cursor-pointer rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Cancelar edicion"
                  title="Cancelar edicion"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          }

          return (
            <div className="flex items-center gap-1">
              {onUpdate && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingKey(rowKey(row.original));
                    setDraft(toDraft(row.original));
                  }}
                  className="cursor-pointer rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                  aria-label="Editar documento"
                  title="Editar documento"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() =>
                    onDelete(row.original.type, row.original.number)
                  }
                  className="cursor-pointer rounded p-1 text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                  aria-label="Eliminar documento"
                  title="Eliminar documento"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        },
      });
    }

    return defs;
  }, [draft, editingKey, onDelete, onUpdate, savingKey, showActions, showSeller]);

  const tableState = useMemo(() => ({ grouping: ["client"] }), []);

  const table = useReactTable({
    data: rows,
    columns,
    state: tableState,
    groupedColumnMode: false,
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
  });

  const grandTotal = rows.reduce((sum, row) => sum + (row.total ?? 0), 0);
  const leadingCols = showSeller ? 8 : 7;
  const totalCols = leadingCols + 1 + (showActions ? 1 : 0);
  const groupedRows = table.getRowModel().rows;

  if (rows.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-zinc-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <table className="w-full text-left text-sm">
      <thead className="sticky top-0 z-10 bg-zinc-900 text-white">
        <tr className="border-b border-zinc-700">
          {table.getHeaderGroups()[0]?.headers.map((header) => (
            <th
              key={header.id}
              className={headerClassById[header.column.id] ?? "px-4 py-3"}
            >
              {flexRender(
                header.column.columnDef.header,
                header.getContext()
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {groupedRows.map((row) => {
          const docs = row.subRows ?? [];
          const subtotal = docs.reduce(
            (sum, subRow) => sum + (subRow.original.total ?? 0),
            0
          );

          return (
            <Fragment key={row.id}>
              {docs.map((subRow) => (
                <tr
                  key={subRow.id}
                  className="border-b border-zinc-100 hover:bg-zinc-50"
                >
                  {subRow.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cellClassById[cell.column.id] ?? "px-4 py-2"}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-b border-zinc-200 bg-zinc-100 font-bold">
                <td
                  colSpan={leadingCols}
                  className="px-4 py-2 text-right text-zinc-700"
                >
                  Subtotal {String(row.groupingValue ?? "SIN CLIENTE")}
                </td>
                <td className="px-4 py-2 text-right font-bold text-zinc-900">
                  {formatCurrency(subtotal)}
                </td>
                {showActions && (
                  <td className="px-4 py-2">
                    {showShare && (
                      <WhatsAppShareButton
                        client={String(row.groupingValue ?? "SIN CLIENTE")}
                        docs={docs.map((subRow) => subRow.original)}
                        subtotal={subtotal}
                      />
                    )}
                  </td>
                )}
              </tr>
            </Fragment>
          );
        })}
        <tr className="bg-zinc-900 font-semibold text-white">
          <td colSpan={totalCols - 1} className="px-4 py-3 text-right">
            TOTAL
          </td>
          <td className="px-4 py-3 text-right">{formatCurrency(grandTotal)}</td>
        </tr>
      </tbody>
    </table>
  );
}
