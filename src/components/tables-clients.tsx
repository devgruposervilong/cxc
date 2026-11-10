import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "@tanstack/react-form";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import type { Client, SellerRecord } from "@/lib/types";
import {
  useCreateClient,
  useDeleteClient,
  useUpdateClient,
} from "@/src/hooks/use-clients";
import { MasterTable, SearchInput } from "./master-table";
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  Modal,
  SelectField,
  TextField,
  fieldErrors,
} from "./ui";

const NO_BUSINESS_UNIT = "__sin_unidad__";
const DEFAULT_BUSINESS_UNITS = ["BIMBO", "ECOMASTER"];

const clientFormSchema = z.object({
  code: z.string().trim().min(1, "El codigo es obligatorio").max(100),
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  rif: z.string().trim().max(50),
  seller: z.string().trim().max(200),
  businessUnit: z.string().trim().max(100),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function toClientInput(value: ClientFormValues): Client {
  return {
    code: value.code.trim(),
    name: value.name.trim(),
    rif: value.rif.trim(),
    seller: value.seller.trim(),
    businessUnit: value.businessUnit.trim(),
  };
}

function ClientFormModal({
  client,
  businessUnits,
  sellers,
  onClose,
}: {
  client: Client | null;
  businessUnits: string[];
  sellers: SellerRecord[];
  onClose: () => void;
}) {
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const [error, setError] = useState<string | null>(null);

  const unitOptions = useMemo(
    () =>
      Array.from(
        new Set([...DEFAULT_BUSINESS_UNITS, ...businessUnits])
      ).sort((a, b) => a.localeCompare(b, "es")),
    [businessUnits]
  );

  const sellerOptions = useMemo(() => {
    const names = new Set(
      sellers.map((seller) => seller.name.trim()).filter(Boolean)
    );
    const current = client?.seller.trim();
    if (current && current !== "SIN VENDEDOR") names.add(current);
    return Array.from(names).sort((a, b) => a.localeCompare(b, "es"));
  }, [client, sellers]);

  const form = useForm({
    defaultValues: {
      code: client?.code ?? "",
      name: client?.name ?? "",
      rif: client?.rif ?? "",
      seller: client?.seller.trim() || "SIN VENDEDOR",
      businessUnit: client?.businessUnit.trim() ?? "",
    } satisfies ClientFormValues,
    validators: { onSubmit: clientFormSchema },
    onSubmit: async ({ value }) => {
      setError(null);

      try {
        const input = toClientInput(value);
        if (client) {
          await updateClient.mutateAsync({ code: client.code, input });
        } else {
          await createClient.mutateAsync(input);
        }
        onClose();
      } catch (submitError) {
        setError(
          errorMessage(
            submitError,
            client
              ? "No se pudo actualizar el cliente"
              : "No se pudo crear el cliente"
          )
        );
      }
    },
  });

  const isSaving = createClient.isPending || updateClient.isPending;

  return (
    <Modal
      title={client ? "Editar cliente" : "Nuevo cliente"}
      description="El codigo y el nombre son unicos dentro del maestro."
      onClose={onClose}
    >
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <form.Field
            name="code"
            validators={{ onChange: clientFormSchema.shape.code }}
          >
            {(field) => (
              <TextField
                label="Codigo"
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                error={fieldErrors(field.state.meta.errors)[0]}
                className="font-mono"
              />
            )}
          </form.Field>

          <form.Field
            name="rif"
            validators={{ onChange: clientFormSchema.shape.rif }}
          >
            {(field) => (
              <TextField
                label="RIF"
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                error={fieldErrors(field.state.meta.errors)[0]}
              />
            )}
          </form.Field>
        </div>

        <form.Field
          name="name"
          validators={{ onChange: clientFormSchema.shape.name }}
        >
          {(field) => (
            <TextField
              label="Cliente"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              error={fieldErrors(field.state.meta.errors)[0]}
            />
          )}
        </form.Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <form.Field name="seller">
            {(field) => (
              <SelectField
                label="Vendedor"
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
              >
                <option value="SIN VENDEDOR">SIN VENDEDOR</option>
                {sellerOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </SelectField>
            )}
          </form.Field>

          <form.Field name="businessUnit">
            {(field) => (
              <SelectField
                label="Unidad de negocio"
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
              >
                <option value="">Sin unidad</option>
                {unitOptions.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </SelectField>
            )}
          </form.Field>
        </div>

        {error && <Alert tone="error">{error}</Alert>}

        <div className="mt-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving
              ? "Guardando..."
              : client
                ? "Guardar cambios"
                : "Crear cliente"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function ClientsTable({
  clients,
  businessUnits,
  sellers,
  canManage,
  isPending,
  isError,
  error,
  onRetry,
}: {
  clients: Client[];
  businessUnits: string[];
  sellers: SellerRecord[];
  canManage: boolean;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  const [search, setSearch] = useState("");
  const [businessUnit, setBusinessUnit] = useState("");
  const [formTarget, setFormTarget] = useState<{
    client: Client | null;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteClient = useDeleteClient();

  const hasClientsWithoutUnit = useMemo(
    () => clients.some((client) => !client.businessUnit.trim()),
    [clients]
  );

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();

    return clients.filter((client) => {
      if (businessUnit === NO_BUSINESS_UNIT) {
        if (client.businessUnit.trim()) return false;
      } else if (businessUnit) {
        if (client.businessUnit.trim() !== businessUnit) return false;
      }

      if (!term) return true;

      return [client.code, client.name, client.rif, client.seller].some(
        (value) => value.toLowerCase().includes(term)
      );
    });
  }, [businessUnit, clients, search]);

  const columns = useMemo<ColumnDef<Client>[]>(() => {
    const defs: ColumnDef<Client>[] = [
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
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFormTarget({ client: row.original })}
              className="cursor-pointer rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              aria-label="Editar cliente"
              title="Editar cliente"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteError(null);
                setDeleteTarget(row.original);
              }}
              className="cursor-pointer rounded p-1 text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
              aria-label="Eliminar cliente"
              title="Eliminar cliente"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      });
    }

    return defs;
  }, [canManage]);

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleteError(null);
    try {
      await deleteClient.mutateAsync(deleteTarget.code);
      setDeleteTarget(null);
    } catch (deleteFailure) {
      setDeleteError(
        errorMessage(deleteFailure, "No se pudo eliminar el cliente")
      );
    }
  }

  return (
    <>
      <Card className="flex min-h-0 min-w-0 flex-1 flex-col p-4">
        <div className="flex shrink-0 flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por codigo, nombre, RIF o vendedor"
              className="w-full sm:w-80"
            />
            <SelectField
              label="Unidad de negocio"
              value={businessUnit}
              onChange={(event) => setBusinessUnit(event.target.value)}
              className="w-full sm:w-56"
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
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:pb-1">
            <p className="text-xs text-zinc-500">
              Mostrando{" "}
              <span className="font-medium text-zinc-700">
                {filteredClients.length}
              </span>{" "}
              de {clients.length}
            </p>
            {canManage && (
              <Button
                size="sm"
                onClick={() => setFormTarget({ client: null })}
              >
                <Plus className="h-3.5 w-3.5" />
                Nuevo cliente
              </Button>
            )}
          </div>
        </div>

        {isError && (
          <div className="mt-4 flex flex-col items-start gap-2">
            <Alert tone="error">
              {errorMessage(error, "No se pudieron cargar los clientes")}
            </Alert>
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Reintentar
            </Button>
          </div>
        )}

        {isPending ? (
          <div className="flex flex-1 items-center justify-center p-8 text-sm text-zinc-500">
            Cargando clientes...
          </div>
        ) : isError && clients.length === 0 ? null : (
          <MasterTable
            data={filteredClients}
            columns={columns}
            emptyMessage={
              clients.length === 0
                ? "No hay clientes en la base de datos."
                : "No hay clientes que coincidan con el filtro."
            }
          />
        )}
      </Card>

      {formTarget && (
        <ClientFormModal
          client={formTarget.client}
          businessUnits={businessUnits}
          sellers={sellers}
          onClose={() => setFormTarget(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar cliente"
          description={
            <>
              Vas a eliminar a{" "}
              <strong className="text-zinc-900">{deleteTarget.name}</strong> del
              maestro de clientes. Los documentos ya cargados no se modifican.
            </>
          }
          isPending={deleteClient.isPending}
          error={deleteError}
          onClose={() => {
            setDeleteTarget(null);
            setDeleteError(null);
          }}
          onConfirm={() => void handleDelete()}
        />
      )}
    </>
  );
}
