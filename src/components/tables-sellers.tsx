import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "@tanstack/react-form";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import type { SellerInput, SellerRecord } from "@/lib/types";
import {
  useCreateSeller,
  useDeleteSeller,
  useUpdateSeller,
} from "@/src/hooks/use-sellers";
import { MasterTable, SearchInput } from "./master-table";
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  Modal,
  SelectField,
  TextField,
  cn,
  fieldErrors,
} from "./ui";

const sellerFormSchema = z.object({
  code: z.string().trim().min(1, "El codigo es obligatorio").max(100),
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  surname: z.string().trim().max(200),
  zone: z.string().trim().max(100),
  status: z.enum(["ACTIVO", "INACTIVO"]),
});

type SellerFormValues = z.infer<typeof sellerFormSchema>;

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function fullName(seller: Pick<SellerRecord, "name" | "surname">) {
  return [seller.name, seller.surname].filter(Boolean).join(" ");
}

function toSellerInput(value: SellerFormValues): SellerInput {
  return {
    code: value.code.trim(),
    name: value.name.trim(),
    surname: value.surname.trim() || null,
    zone: value.zone.trim() || null,
    status: value.status,
  };
}

function StatusBadge({ status }: { status: SellerRecord["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        status === "ACTIVO"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-zinc-100 text-zinc-600"
      )}
    >
      {status === "ACTIVO" ? "Activo" : "Inactivo"}
    </span>
  );
}

function SellerFormModal({
  seller,
  onClose,
}: {
  seller: SellerRecord | null;
  onClose: () => void;
}) {
  const createSeller = useCreateSeller();
  const updateSeller = useUpdateSeller();
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      code: seller?.code ?? "",
      name: seller?.name ?? "",
      surname: seller?.surname ?? "",
      zone: seller?.zone ?? "",
      status: seller?.status ?? "ACTIVO",
    } satisfies SellerFormValues,
    validators: { onSubmit: sellerFormSchema },
    onSubmit: async ({ value }) => {
      setError(null);

      try {
        const input = toSellerInput(value);
        if (seller) {
          await updateSeller.mutateAsync({ id: seller.id, input });
        } else {
          await createSeller.mutateAsync(input);
        }
        onClose();
      } catch (submitError) {
        setError(
          errorMessage(
            submitError,
            seller
              ? "No se pudo actualizar el vendedor"
              : "No se pudo crear el vendedor"
          )
        );
      }
    },
  });

  const isSaving = createSeller.isPending || updateSeller.isPending;

  return (
    <Modal
      title={seller ? "Editar vendedor" : "Nuevo vendedor"}
      description="El codigo es unico. La URL del portal se genera automaticamente al crear el vendedor."
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
            validators={{ onChange: sellerFormSchema.shape.code }}
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
            name="zone"
            validators={{ onChange: sellerFormSchema.shape.zone }}
          >
            {(field) => (
              <TextField
                label="Zona"
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                error={fieldErrors(field.state.meta.errors)[0]}
              />
            )}
          </form.Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <form.Field
            name="name"
            validators={{ onChange: sellerFormSchema.shape.name }}
          >
            {(field) => (
              <TextField
                label="Nombre"
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                error={fieldErrors(field.state.meta.errors)[0]}
              />
            )}
          </form.Field>

          <form.Field
            name="surname"
            validators={{ onChange: sellerFormSchema.shape.surname }}
          >
            {(field) => (
              <TextField
                label="Apellido"
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                error={fieldErrors(field.state.meta.errors)[0]}
              />
            )}
          </form.Field>
        </div>

        <form.Field name="status">
          {(field) => (
            <SelectField
              label="Estado"
              value={field.state.value}
              onChange={(event) =>
                field.handleChange(
                  event.target.value as SellerFormValues["status"]
                )
              }
            >
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </SelectField>
          )}
        </form.Field>

        {seller && (
          <p className="text-xs text-zinc-500">
            Portal actual:{" "}
            <span className="font-mono text-zinc-700">
              /vendedor/{seller.keyUrl}
            </span>
          </p>
        )}

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
              : seller
                ? "Guardar cambios"
                : "Crear vendedor"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function SellersTable({
  sellers,
  canManage,
  isPending,
  isError,
  error,
  onRetry,
}: {
  sellers: SellerRecord[];
  canManage: boolean;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [formTarget, setFormTarget] = useState<{
    seller: SellerRecord | null;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SellerRecord | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteSeller = useDeleteSeller();

  const filteredSellers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return sellers.filter((seller) => {
      if (status && seller.status !== status) return false;
      if (!term) return true;

      return [seller.code, seller.name, seller.surname ?? "", seller.zone ?? ""]
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [search, sellers, status]);

  const columns = useMemo<ColumnDef<SellerRecord>[]>(() => {
    const defs: ColumnDef<SellerRecord>[] = [
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
        id: "name",
        header: "VENDEDOR",
        cell: ({ row }) => (
          <span className="font-medium text-zinc-800">
            {fullName(row.original)}
          </span>
        ),
      },
      {
        accessorKey: "zone",
        header: "ZONA",
        cell: ({ row }) => row.original.zone || "—",
      },
      {
        accessorKey: "status",
        header: "ESTADO",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "portal",
        header: "PORTAL",
        cell: ({ row }) => (
          <Link
            to="/vendedor/$keyUrl"
            params={{ keyUrl: row.original.keyUrl }}
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 transition hover:text-emerald-800 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Abrir
          </Link>
        ),
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
              onClick={() => setFormTarget({ seller: row.original })}
              className="cursor-pointer rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              aria-label="Editar vendedor"
              title="Editar vendedor"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteError(null);
                setDeleteTarget(row.original);
              }}
              disabled={row.original.hasUser}
              className="cursor-pointer rounded p-1 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
              aria-label="Eliminar vendedor"
              title={
                row.original.hasUser
                  ? "Tiene un usuario vinculado; quita el acceso desde Usuarios"
                  : "Eliminar vendedor"
              }
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
      await deleteSeller.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (deleteFailure) {
      setDeleteError(
        errorMessage(deleteFailure, "No se pudo eliminar el vendedor")
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
              placeholder="Buscar por codigo, nombre o zona"
              className="w-full sm:w-80"
            />
            <SelectField
              label="Estado"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full sm:w-48"
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVO">Activos</option>
              <option value="INACTIVO">Inactivos</option>
            </SelectField>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:pb-1">
            <p className="text-xs text-zinc-500">
              Mostrando{" "}
              <span className="font-medium text-zinc-700">
                {filteredSellers.length}
              </span>{" "}
              de {sellers.length}
            </p>
            {canManage && (
              <Button
                size="sm"
                onClick={() => setFormTarget({ seller: null })}
              >
                <Plus className="h-3.5 w-3.5" />
                Nuevo vendedor
              </Button>
            )}
          </div>
        </div>

        {isError && (
          <div className="mt-4 flex flex-col items-start gap-2">
            <Alert tone="error">
              {errorMessage(error, "No se pudieron cargar los vendedores")}
            </Alert>
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Reintentar
            </Button>
          </div>
        )}

        {isPending ? (
          <div className="flex flex-1 items-center justify-center p-8 text-sm text-zinc-500">
            Cargando vendedores...
          </div>
        ) : isError && sellers.length === 0 ? null : (
          <MasterTable
            data={filteredSellers}
            columns={columns}
            emptyMessage={
              sellers.length === 0
                ? "No hay vendedores en la base de datos."
                : "No hay vendedores que coincidan con el filtro."
            }
            minWidthClass="min-w-[760px]"
          />
        )}
      </Card>

      {formTarget && (
        <SellerFormModal
          seller={formTarget.seller}
          onClose={() => setFormTarget(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar vendedor"
          description={
            <>
              Vas a eliminar a{" "}
              <strong className="text-zinc-900">
                {fullName(deleteTarget)}
              </strong>{" "}
              del maestro de vendedores. Su portal dejara de estar disponible y
              los documentos ya cargados no se modifican.
            </>
          }
          isPending={deleteSeller.isPending}
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
