import { Fragment, useMemo, useState, type FormEvent } from "react";
import {
  flexRender,
  getCoreRowModel,
  getGroupedRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import type { DataRow, DocumentChanges, DocumentType } from "@/lib/types";
import {
  formatAmountForInput,
  formatCurrency,
  parseAmountInput,
} from "@/lib/format";
import { Alert, Button, Modal, SelectField, TextField } from "./ui";
import { WhatsAppShareButton } from "./whatsapp-share-button";

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

function toDraft(row: DataRow): DocumentDraft {
  return {
    client: row.client ?? "",
    type: row.type,
    number: row.number,
    emission: row.emission ?? "",
    expiration: row.expiration ?? "",
    total: formatAmountForInput(row.total),
    seller: row.seller ?? "",
  };
}

function toChanges(draft: DocumentDraft): DocumentChanges | null {
  const total = parseAmountInput(draft.total);
  if (total.error) return null;

  return {
    client: draft.client.trim() || "SIN CLIENTE",
    type: draft.type,
    number: draft.number.trim(),
    emission: draft.emission.trim() || null,
    expiration: draft.expiration.trim() || null,
    total: total.value,
    seller: draft.seller.trim() || null,
  };
}

function DocumentEditModal({
  original,
  showSeller,
  onSave,
  onClose,
}: {
  original: DataRow;
  showSeller: boolean;
  onSave: (changes: DocumentChanges) => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<DocumentDraft>(() => toDraft(original));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const total = parseAmountInput(draft.total);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.number.trim()) {
      setError("El numero del documento es obligatorio");
      return;
    }
    if (total.error) {
      setError(total.error);
      return;
    }

    const changes = toChanges(draft);
    if (!changes) {
      setError("Revisa los datos del documento");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(changes);
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo actualizar el documento"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Editar documento"
      description={`${original.type} ${original.number} · ${original.client ?? "SIN CLIENTE"}`}
      onClose={onClose}
      className="max-w-2xl"
    >
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <TextField
          label="Cliente"
          value={draft.client}
          onChange={(event) =>
            setDraft((current) => ({ ...current, client: event.target.value }))
          }
          autoFocus
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="Tipo"
            value={draft.type}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                type: event.target.value as DocumentType,
              }))
            }
          >
            <option value="FACT">FACT</option>
            <option value="N/CR">N/CR</option>
          </SelectField>

          <TextField
            label="Numero"
            value={draft.number}
            onChange={(event) =>
              setDraft((current) => ({ ...current, number: event.target.value }))
            }
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Emision"
            value={draft.emission}
            placeholder="DD/MM/AAAA"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                emission: event.target.value,
              }))
            }
          />

          <TextField
            label="Vencimiento"
            value={draft.expiration}
            placeholder="DD/MM/AAAA"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                expiration: event.target.value,
              }))
            }
          />
        </div>

        <div
          className={
            showSeller ? "grid gap-3 sm:grid-cols-2" : "grid gap-3"
          }
        >
          <TextField
            label="Total"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={draft.total}
            placeholder="0,00"
            aria-invalid={total.error !== null}
            error={total.error ?? undefined}
            onChange={(event) =>
              setDraft((current) => ({ ...current, total: event.target.value }))
            }
          />

          {showSeller && (
            <TextField
              label="Vendedor"
              value={draft.seller}
              placeholder="SIN VENDEDOR"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  seller: event.target.value,
                }))
              }
            />
          )}
        </div>

        {error && <Alert tone="error">{error}</Alert>}

        <div className="mt-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Modal>
  );
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
  const [editingTarget, setEditingTarget] = useState<DataRow | null>(null);

  const columns = useMemo<ColumnDef<DataRow>[]>(() => {
    const defs: ColumnDef<DataRow>[] = [
      { accessorKey: "rank", header: "RANGO" },
      { accessorKey: "client", header: "CLIENTE" },
      { accessorKey: "type", header: "TIPO" },
      { accessorKey: "number", header: "NUMERO" },
      { accessorKey: "emission", header: "EMISION" },
      { accessorKey: "expiration", header: "VENCIMIENTO" },
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
      });
    }

    defs.push({
      accessorKey: "total",
      header: "TOTAL",
      cell: ({ row }) => formatCurrency(Number(row.original.total ?? 0)),
    });

    if (showActions) {
      defs.push({
        id: "actions",
        header: "ACCIONES",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {onUpdate && (
              <button
                type="button"
                onClick={() => setEditingTarget(row.original)}
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
        ),
      });
    }

    return defs;
  }, [onDelete, onUpdate, showActions, showSeller]);

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
    <>
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

      {editingTarget && onUpdate && (
        <DocumentEditModal
          original={editingTarget}
          showSeller={showSeller}
          onSave={(changes) => onUpdate(editingTarget, changes)}
          onClose={() => setEditingTarget(null)}
        />
      )}
    </>
  );
}
