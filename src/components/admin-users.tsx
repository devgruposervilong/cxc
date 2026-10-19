import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Copy, Link2, Trash2, UserPlus } from "lucide-react";
import {
  adminCreateInvite,
  adminDeleteInvite,
  adminListInvites,
  adminListUsers,
  adminUpdateUser,
  type AdminInvite,
  type CreateInviteResult,
} from "@/src/lib/api";
import {
  Alert,
  Button,
  Card,
  SelectField,
  TextField,
  fieldErrors,
} from "./ui";

const inviteBaseSchema = z.object({
  email: z.string().trim().email("Correo invalido"),
  role: z.enum(["admin", "user", "seller"]),
  sellerId: z.string(),
});

const inviteSchema = inviteBaseSchema.refine(
  (value) => value.role !== "seller" || Boolean(value.sellerId),
  { message: "Selecciona un vendedor", path: ["sellerId"] }
);

type InviteFormValues = z.infer<typeof inviteBaseSchema>;

function roleLabel(role: string) {
  if (role === "admin") return "Administrador";
  if (role === "seller") return "Vendedor";
  return "Usuario";
}

export function AdminUsersPage({ currentUserId }: { currentUserId: string }) {
  const queryClient = useQueryClient();
  const [lastInvite, setLastInvite] = useState<CreateInviteResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["admin", "users"] as const,
    queryFn: adminListUsers,
  });

  const invitesQuery = useQuery({
    queryKey: ["admin", "invites"] as const,
    queryFn: adminListInvites,
  });

  const updateUser = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof adminUpdateUser>[1];
    }) => adminUpdateUser(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  const createInvite = useMutation({
    mutationFn: adminCreateInvite,
    onSuccess: (data) => {
      setLastInvite(data);
      void queryClient.invalidateQueries({ queryKey: ["admin", "invites"] });
    },
  });

  const deleteInvite = useMutation({
    mutationFn: adminDeleteInvite,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "invites"] });
    },
  });

  const form = useForm({
    defaultValues: {
      email: "",
      role: "user" as InviteFormValues["role"],
      sellerId: "",
    },
    validators: { onSubmit: inviteSchema },
    onSubmit: async ({ value }) => {
      const result = await createInvite.mutateAsync({
        email: value.email.trim().toLowerCase(),
        role: value.role,
        sellerId: value.role === "seller" ? value.sellerId || null : null,
      });
      setLastInvite(result);
      form.reset();
    },
  });

  const sellers = usersQuery.data?.sellers ?? [];
  const availableSellers = sellers.filter((seller) => !seller.userId);
  const users = usersQuery.data?.users ?? [];
  const invites = invitesQuery.data ?? [];

  async function copyValue(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">
            Usuarios y accesos
          </h2>
          <p className="text-sm text-zinc-500">
            Crea invitaciones, asigna roles y bloquea cuentas.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-900">
              Nueva invitacion
            </h3>
          </div>

          <form
            className="mt-4 flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <form.Field
              name="email"
              validators={{ onChange: inviteBaseSchema.shape.email }}
            >
              {(field) => (
                <TextField
                  label="Correo"
                  type="email"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  error={fieldErrors(field.state.meta.errors)[0]}
                />
              )}
            </form.Field>

            <form.Field name="role">
              {(field) => (
                <SelectField
                  label="Rol"
                  value={field.state.value}
                  onChange={(event) =>
                    field.handleChange(
                      event.target.value as InviteFormValues["role"]
                    )
                  }
                >
                  <option value="user">Usuario (solo lectura)</option>
                  <option value="admin">Administrador</option>
                  <option value="seller">Vendedor (su propio portal)</option>
                </SelectField>
              )}
            </form.Field>

            <form.Subscribe selector={(state) => state.values.role}>
              {(role) =>
                role === "seller" ? (
                  <form.Field name="sellerId">
                    {(field) => (
                      <SelectField
                        label="Vendedor"
                        value={field.state.value ?? ""}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        error={fieldErrors(field.state.meta.errors)[0]}
                      >
                        <option value="">Selecciona...</option>
                        {availableSellers.map((seller) => (
                          <option key={seller.id} value={seller.id}>
                            {seller.code} · {seller.name}
                            {seller.surname ? ` ${seller.surname}` : ""}
                          </option>
                        ))}
                      </SelectField>
                    )}
                  </form.Field>
                ) : null
              }
            </form.Subscribe>

            {createInvite.error && (
              <Alert tone="error">
                {createInvite.error instanceof Error
                  ? createInvite.error.message
                  : "No se pudo crear la invitacion"}
              </Alert>
            )}

            <form.Subscribe
              selector={(state) => [state.isSubmitting] as const}
            >
              {([isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={isSubmitting || createInvite.isPending}
                >
                  {isSubmitting || createInvite.isPending
                    ? "Generando..."
                    : "Generar enlace de invitacion"}
                </Button>
              )}
            </form.Subscribe>
          </form>

          {lastInvite && (
            <div className="mt-4 flex flex-col gap-2">
              <Alert tone="success">
                Enlace generado. Copialo y envialo: no se puede volver a
                mostrar.
                {!lastInvite.emailSent && (
                  <span className="mt-1 block text-xs">
                    No se envio correo automatico (Resend no configurado).
                  </span>
                )}
              </Alert>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={lastInvite.inviteUrl}
                  className="w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs text-zinc-600"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void copyValue(lastInvite.inviteUrl, "last")}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied === "last" ? "Copiado" : "Copiar"}
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-900">
              Invitaciones pendientes
            </h3>
          </div>

          <div className="mt-4">
            {invitesQuery.isLoading ? (
              <p className="text-sm text-zinc-500">Cargando...</p>
            ) : invites.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No hay invitaciones pendientes.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-zinc-100">
                {invites.map((invite) => (
                  <InviteRow
                    key={invite.id}
                    invite={invite}
                    copied={copied === invite.id}
                    onDelete={() => deleteInvite.mutate(invite.id)}
                  />
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-zinc-900">Usuarios</h3>

        {usersQuery.isLoading ? (
          <p className="mt-3 text-sm text-zinc-500">Cargando...</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-3 py-2 font-medium">Nombre</th>
                  <th className="px-3 py-2 font-medium">Correo</th>
                  <th className="px-3 py-2 font-medium">Rol</th>
                  <th className="px-3 py-2 font-medium">Vendedor</th>
                  <th className="px-3 py-2 font-medium">Estado</th>
                  <th className="px-3 py-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = user.id === currentUserId;
                  const sellerName = user.seller
                    ? [user.seller.name, user.seller.surname]
                        .filter(Boolean)
                        .join(" ")
                    : null;

                  return (
                    <tr
                      key={user.id}
                      className="border-b border-zinc-100 align-middle"
                    >
                      <td className="px-3 py-2 text-zinc-800">{user.name}</td>
                      <td className="px-3 py-2 text-zinc-600">{user.email}</td>
                      <td className="px-3 py-2">
                        {user.role === "seller" ? (
                          <span className="text-xs font-medium text-zinc-600">
                            Vendedor
                          </span>
                        ) : (
                          <select
                            value={user.role}
                            disabled={isSelf || updateUser.isPending}
                            onChange={(event) =>
                              updateUser.mutate({
                                id: user.id,
                                input: {
                                  role: event.target.value as
                                    | "admin"
                                    | "user",
                                },
                              })
                            }
                            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700"
                          >
                            <option value="user">Usuario</option>
                            <option value="admin">Administrador</option>
                          </select>
                        )}
                      </td>
                      <td className="px-3 py-2 text-zinc-600">
                        {sellerName ?? "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            user.banned
                              ? "bg-red-50 text-red-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {user.banned ? "Bloqueado" : "Activo"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          variant={user.banned ? "secondary" : "danger"}
                          size="sm"
                          disabled={isSelf || updateUser.isPending}
                          onClick={() =>
                            updateUser.mutate({
                              id: user.id,
                              input: { banned: !user.banned },
                            })
                          }
                        >
                          {user.banned ? "Desbloquear" : "Bloquear"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {updateUser.error && (
          <div className="mt-3">
            <Alert tone="error">
              {updateUser.error instanceof Error
                ? updateUser.error.message
                : "No se pudo actualizar el usuario"}
            </Alert>
          </div>
        )}
      </Card>
    </div>
  );
}

function InviteRow({
  invite,
  copied,
  onDelete,
}: {
  invite: AdminInvite;
  copied: boolean;
  onDelete: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-800">
          {invite.email}
        </p>
        <p className="text-xs text-zinc-500">
          {roleLabel(invite.role)}
          {invite.sellerName ? ` · ${invite.sellerName}` : ""} ·{" "}
          {invite.expired ? "Vencida" : "Vence"}{" "}
          {new Date(invite.expiresAt).toLocaleDateString("es-VE")}
          {copied ? " · Copiado" : ""}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
          Revocar
        </Button>
      </div>
    </li>
  );
}
