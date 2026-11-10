import { Search, X } from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { cn } from "./ui";

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-8 text-base text-zinc-900 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 lg:text-sm"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpiar busqueda"
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function MasterTable<T>({
  data,
  columns,
  emptyMessage,
  minWidthClass = "min-w-[860px]",
}: {
  data: T[];
  columns: ColumnDef<T>[];
  emptyMessage: string;
  minWidthClass?: string;
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (data.length === 0) {
    return (
      <div className="mt-4 flex flex-1 items-center justify-center rounded-lg border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="mt-4 min-h-0 flex-1 overflow-auto rounded-lg border border-zinc-200">
      <table className={cn("w-full text-left text-sm", minWidthClass)}>
        <thead className="sticky top-0 z-10 bg-zinc-900 text-white">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="whitespace-nowrap px-4 py-3 font-semibold"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-4 py-2.5 align-middle text-zinc-700"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
