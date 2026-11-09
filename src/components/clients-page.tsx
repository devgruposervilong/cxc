import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Building2 } from "lucide-react";
import type { Client } from "@/lib/types";
import { useClients } from "@/src/hooks/use-clients";
import { Alert, Button, Card, SelectField } from "./ui";

const NO_BUSINESS_UNIT = "__sin_unidad__";

const columns: ColumnDef<Client>[] = [
  {
    accessorKey: "code",
    header: "CODIGO",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-zinc-600">
        {row.original.code}
      </span>
    ),
  },
  {
    accessorKey: "name",
    header: "CLIENTE",
    cell: ({ row }) => (
      <span className="font-medium text-zinc-800">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "rif",
    header: "RIF",
    cell: ({ row }) => row.original.rif || "—",
  },
  {
    accessorKey: "seller",
    header: "VENDEDOR",
    cell: ({ row }) => row.original.seller || "—",
  },
  {
    accessorKey: "businessUnit",
    header: "UNIDAD DE NEGOCIO",
    cell: ({ row }) => {
      const businessUnit = row.original.businessUnit.trim();
      return businessUnit ? (
        <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
          {businessUnit}
        </span>
      ) : (
        <span className="text-zinc-400">—</span>
      );
    },
  },
];

export function ClientsPage() {
  const clientsQuery = useClients();
  const [businessUnit, setBusinessUnit] = useState("");

  const clients = useMemo(
    () => clientsQuery.data?.clients ?? [],
    [clientsQuery.data]
  );
  const businessUnits = clientsQuery.data?.businessUnits ?? [];
  const hasClientsWithoutUnit = useMemo(
    () => clients.some((client) => !client.businessUnit.trim()),
    [clients]
  );

  const filteredClients = useMemo(() => {
    if (!businessUnit) return clients;
    if (businessUnit === NO_BUSINESS_UNIT) {
      return clients.filter((client) => !client.businessUnit.trim());
    }
    return clients.filter(
      (client) => client.businessUnit.trim() === businessUnit
    );
  }, [businessUnit, clients]);

  const table = useReactTable({
    data: filteredClients,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (clientsQuery.isPending) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        Cargando clientes...
      </div>
    );
  }

  if (clientsQuery.isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <Alert tone="error">
          {clientsQuery.error instanceof Error
            ? clientsQuery.error.message
            : "No se pudieron cargar los clientes"}
        </Alert>
        <Button variant="secondary" onClick={() => void clientsQuery.refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-w-0 flex-col gap-4 overflow-y-auto">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Clientes</h2>
          <p className="text-sm text-zinc-500">
            Maestro de clientes registrados en la base de datos.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm ring-1 ring-zinc-200">
          <Building2 className="h-3.5 w-3.5 text-zinc-400" />
          {clients.length} {clients.length === 1 ? "cliente" : "clientes"}
        </span>
      </div>

      <Card className="flex min-h-0 min-w-0 flex-1 flex-col p-4">
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <SelectField
            label="Unidad de negocio"
            value={businessUnit}
            onChange={(event) => setBusinessUnit(event.target.value)}
            className="w-full sm:w-72"
          >
            <option value="">Todas las unidades</option>
            {businessUnits.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
            {hasClientsWithoutUnit && (
              <option value={NO_BUSINESS_UNIT}>Sin unidad de negocio</option>
            )}
          </SelectField>

          <p className="text-xs text-zinc-500 sm:pb-2">
            Mostrando{" "}
            <span className="font-medium text-zinc-700">
              {filteredClients.length}
            </span>{" "}
            de {clients.length}
          </p>
        </div>

        {clients.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-zinc-500">
            No hay clientes en la base de datos. Guarda una carga para
            poblarlos.
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-zinc-500">
            No hay clientes para la unidad de negocio seleccionada.
          </div>
        ) : (
          <div className="mt-4 min-h-0 flex-1 overflow-auto rounded-lg border border-zinc-200">
            <table className="w-full min-w-[760px] text-left text-sm">
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
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
