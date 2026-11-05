import { Fragment, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  getGroupedRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import type { DataRow, DocumentType } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { WhatsAppShareButton } from "./whatsapp-share-button";

type CxcTableProps = {
  rows: DataRow[];
  showSeller?: boolean;
  showActions?: boolean;
  showShare?: boolean;
  onDelete?: (type: DocumentType, number: string) => void;
  emptyMessage?: string;
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

export function CxcTable({
  rows,
  showSeller = true,
  showActions = true,
  showShare = true,
  onDelete,
  emptyMessage = "No hay cuentas por cobrar para mostrar.",
}: CxcTableProps) {
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
      defs.push({ accessorKey: "seller", header: "VENDEDOR" });
    }

    defs.push({
      accessorKey: "total",
      header: "TOTAL",
      cell: ({ getValue }) => formatCurrency(Number(getValue() ?? 0)),
    });

    if (showActions) {
      defs.push({
        id: "actions",
        header: "ACCIONES",
        cell: ({ row }) =>
          onDelete ? (
            <button
              onClick={() =>
                onDelete(row.original.type, row.original.number)
              }
              className="cursor-pointer rounded p-1 text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
              aria-label="Eliminar documento"
              title="Eliminar documento"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null,
      });
    }

    return defs;
  }, [onDelete, showActions, showSeller]);

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
          const rank = docs[0]?.original.rank ?? row.original.rank;

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
                  <span className="mr-2 text-xs font-semibold text-zinc-400">
                    #{rank}
                  </span>
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
