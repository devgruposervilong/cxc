import { useCallback, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Building2, Check, Loader2, Pencil, X } from "lucide-react";
import type { Client } from "@/lib/types";
import { useClients, useUpdateClient } from "@/src/hooks/use-clients";
import { Alert, Button, Card, SelectField, cn } from "./ui";

const NO_BUSINESS_UNIT = "__sin_unidad__";
const BUSINESS_UNITS = ["BIMBO", "ECOMASTER"] as const;

function isBusinessUnit(value: string): value is (typeof BUSINESS_UNITS)[number] {
  return BUSINESS_UNITS.includes(value as (typeof BUSINESS_UNITS)[number]);
}

const inputClass =
  "w-full min-w-[6rem] rounded border border-zinc-300 bg-white px-1.5 py-1 text-base text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 lg:text-xs";

export function ClientsPage({ canManage }: { canManage: boolean }) {
  const clientsQuery = useClients();
  const updateClient = useUpdateClient();
  const [businessUnit, setBusinessUnit] = useState("");
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [draft, setDraft] = useState<Client | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

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

  const startEdit = useCallback((client: Client) => {
    const unit = client.businessUnit.trim();
    setEditingCode(client.code);
    setDraft({
      ...client,
      businessUnit: isBusinessUnit(unit) ? unit : "",
    });
    setEditError(null);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingCode(null);
    setDraft(null);
    setEditError(null);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingCode || !draft) return;

    const code = draft.code.trim();
    const name = draft.name.trim();
    if (!code || !name) {
      setEditError("El codigo y el nombre son obligatorios");
      return;
    }
    if (!isBusinessUnit(draft.businessUnit)) {
      setEditError("Selecciona BIMBO o ECOMASTER como unidad de negocio");
      return;
    }

    try {
      await updateClient.mutateAsync({
        code: editingCode,
        input: {
          code,
          name,
          rif: draft.rif.trim(),
          seller: draft.seller.trim(),
          businessUnit: draft.businessUnit,
        },
      });
      cancelEdit();
    } catch (error) {
      setEditError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el cliente"
      );
    }
  }, [cancelEdit, draft, editingCode, updateClient]);

  const columns = useMemo<ColumnDef<Client>[]>(() => {
    const isEditing = (client: Client) =>
      canManage && editingCode === client.code;

    const defs: ColumnDef<Client>[] = [
      {
        accessorKey: "code",
        header: "CODIGO",
        cell: ({ row }) =>
          isEditing(row.original) ? (
            <input
              value={draft?.code ?? ""}
              onChange={(event) =>
                setDraft((current) =>
                  current ? { ...current, code: event.target.value } : current
                )
              }
              aria-label="Codigo del cliente"
              className={cn(inputClass, "font-mono")}
            />
          ) : (
            <span className="font-mono text-xs text-zinc-600">
              {row.original.code}
            </span>
          ),
      },
      {
        accessorKey: "name",
        header: "CLIENTE",
        cell: ({ row }) =>
          isEditing(row.original) ? (
            <input
              value={draft?.name ?? ""}
              onChange={(event) =>
                setDraft((current) =>
                  current ? { ...current, name: event.target.value } : current
                )
              }
              aria-label="Nombre del cliente"
              className={inputClass}
            />
          ) : (
            <span className="font-medium text-zinc-800">
              {row.original.name}
            </span>
          ),
      },
      {
        accessorKey: "rif",
        header: "RIF",
        cell: ({ row }) =>
          isEditing(row.original) ? (
            <input
              value={draft?.rif ?? ""}
              onChange={(event) =>
                setDraft((current) =>
                  current ? { ...current, rif: event.target.value } : current
                )
              }
              aria-label="RIF del cliente"
              className={inputClass}
            />
          ) : (
            row.original.rif || "—"
          ),
      },
      {
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
              aria-label="Vendedor del cliente"
              className={inputClass}
            />
          ) : (
            row.original.seller || "—"
          ),
      },
      {
        accessorKey: "businessUnit",
        header: "UNIDAD DE NEGOCIO",
        cell: ({ row }) => {
          if (isEditing(row.original)) {
            return (
              <select
                value={draft?.businessUnit ?? ""}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? { ...current, businessUnit: event.target.value }
                      : current
                  )
                }
                aria-label="Unidad de negocio"
                className={inputClass}
              >
                <option value="" disabled>
                  Selecciona...
                </option>
                {BUSINESS_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            );
          }

          const unit = row.original.businessUnit.trim();
          return unit ? (
            <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
              {unit}
            </span>
          ) : (
            <span className="text-zinc-400">—</span>
          );
        },
      },
    ];

    if (canManage) {
      defs.push({
        id: "actions",
        header: "ACCIONES",
        cell: ({ row }) => {
          if (isEditing(row.original)) {
            const canSave = Boolean(
              draft?.code.trim() &&
                draft.name.trim() &&
                isBusinessUnit(draft.businessUnit)
            );

            return (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => void saveEdit()}
                  disabled={updateClient.isPending || !canSave}
                  className="cursor-pointer rounded p-1 text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Guardar cambios"
                  title={
                    canSave
                      ? "Guardar cambios"
                      : "Completa codigo, nombre y unidad de negocio"
                  }
                >
                  {updateClient.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={updateClient.isPending}
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
            <button
              type="button"
              onClick={() => startEdit(row.original)}
              className="cursor-pointer rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              aria-label="Editar cliente"
              title="Editar cliente"
            >
              <Pencil className="h-4 w-4" />
            </button>
          );
        },
      });
    }

    return defs;
  }, [
    canManage,
    cancelEdit,
    draft,
    editingCode,
    saveEdit,
    startEdit,
    updateClient.isPending,
  ]);

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

        {editError && (
          <div className="mt-3">
            <Alert tone="error">{editError}</Alert>
          </div>
        )}

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
            <table className="w-full min-w-[860px] text-left text-sm">
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
