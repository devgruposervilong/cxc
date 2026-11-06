import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import {
  Copy,
  Link2,
  MessageCircle,
  RefreshCw,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  useAdminInvites,
  useAdminUsers,
  useCreateInvite,
  useDeleteInvite,
  useRegenerateInvite,
  useUpdateUser,
} from "@/src/hooks/use-admin";
import type { AdminInvite, CreateInviteResult } from "@/src/lib/api";
import {
  Alert,
  Button,
  Card,
  SelectField,
  TextField,
  cn,
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

function UserStatusBadge({ banned }: { banned: boolean }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
        banned
          ? "bg-red-50 text-red-700"
          : "bg-emerald-50 text-emerald-700"
      )}
    >
      {banned ? "Bloqueado" : "Activo"}
    </span>
  );
}

function UserRoleSelect({
  role,
  disabled,
  className,
  onChange,
}: {
  role: string;
  disabled: boolean;
  className?: string;
  onChange: (role: "admin" | "user") => void;
}) {
  return (
    <select
      value={role}
      disabled={disabled}
      onChange={(event) =>
        onChange(event.target.value as "admin" | "user")
      }
      aria-label="Rol del usuario"
      className={cn(
        "min-w-0 cursor-pointer rounded-md border border-zinc-300 bg-white px-2 py-1 text-zinc-700 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      <option value="user">Usuario</option>
      <option value="admin">Administrador</option>
    </select>
  );
}

function whatsappInviteUrl(invite: CreateInviteResult) {
  const text = `Hola, te comparto tu invitacion de CXC G&M (${invite.email}). Crea tu cuenta con este enlace: ${invite.inviteUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function AdminUsersPage({ currentUserId }: { currentUserId: string }) {
  const [lastInvite, setLastInvite] = useState<CreateInviteResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const usersQuery = useAdminUsers();
  const invitesQuery = useAdminInvites();
  const updateUser = useUpdateUser();
  const createInvite = useCreateInvite();
  const regenerateInvite = useRegenerateInvite();
  const deleteInvite = useDeleteInvite();

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
      setCopied(null);
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

  async function handleRegenerate(id: string) {
    try {
      const result = await regenerateInvite.mutateAsync(id);
      setLastInvite(result);
      setCopied(null);
    } catch {
      // El error se muestra con regenerateInvite.error.
    }
  }

  function shareOnWhatsApp(invite: CreateInviteResult) {
    window.open(
      whatsappInviteUrl(invite),
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <div className="flex h-full min-w-0 flex-col gap-4 overflow-y-auto">
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
                Enlace listo para {lastInvite.email}. Copialo o compartelo por
                WhatsApp; por seguridad no se guarda en texto plano (puedes
                regenerarlo desde la lista).
                {!lastInvite.emailSent && (
                  <span className="mt-1 block text-xs">
                    No se envio correo automatico (Resend no configurado).
                  </span>
                )}
              </Alert>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  readOnly
                  value={lastInvite.inviteUrl}
                  className="w-full min-w-0 rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-base text-zinc-600 sm:flex-1 lg:text-xs"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  onClick={() => void copyValue(lastInvite.inviteUrl, "last")}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied === "last" ? "Copiado" : "Copiar"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  onClick={() => shareOnWhatsApp(lastInvite)}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
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
                    regenerating={regenerateInvite.isPending}
                    onRegenerate={() => void handleRegenerate(invite.id)}
                    onDelete={() => deleteInvite.mutate(invite.id)}
                  />
                ))}
              </ul>
            )}
          </div>

          {(regenerateInvite.error || deleteInvite.error) && (
            <div className="mt-3">
              <Alert tone="error">
                {(regenerateInvite.error ?? deleteInvite.error) instanceof Error
                  ? (regenerateInvite.error ?? deleteInvite.error)!.message
                  : "No se pudo actualizar la invitacion"}
              </Alert>
            </div>
          )}
        </Card>
      </div>

      <Card className="min-w-0 p-4">
        <h3 className="text-sm font-semibold text-zinc-900">Usuarios</h3>

        {usersQuery.isLoading ? (
          <p className="mt-3 text-sm text-zinc-500">Cargando...</p>
        ) : users.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            No hay usuarios registrados.
          </p>
        ) : (
          <>
            <div className="mt-3 grid min-w-0 items-start gap-2 sm:grid-cols-2 lg:hidden">
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                const sellerName = user.seller
                  ? [user.seller.name, user.seller.surname]
                      .filter(Boolean)
                      .join(" ")
                  : null;

                return (
                  <div
                    key={user.id}
                    className="min-w-0 rounded-lg border border-zinc-200 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <p className="truncate text-sm font-medium text-zinc-900">
                          {user.name}
                        </p>
                        {isSelf && (
                          <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                            Tu cuenta
                          </span>
                        )}
                      </div>
                      <UserStatusBadge banned={user.banned} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {user.email}
                    </p>

                    <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2">
                      <span className="text-xs text-zinc-500">Rol</span>
                      {user.role === "seller" ? (
                        <span className="text-sm font-medium text-zinc-600">
                          Vendedor
                        </span>
                      ) : (
                        <UserRoleSelect
                          role={user.role}
                          disabled={isSelf || updateUser.isPending}
                          className="w-full text-base"
                          onChange={(role) =>
                            updateUser.mutate({
                              id: user.id,
                              input: { role },
                            })
                          }
                        />
                      )}
                      {sellerName && (
                        <>
                          <span className="text-xs text-zinc-500">
                            Asignado a
                          </span>
                          <span className="truncate text-sm text-zinc-600">
                            {sellerName}
                          </span>
                        </>
                      )}
                    </div>

                    {!isSelf && (
                      <Button
                        variant={user.banned ? "secondary" : "danger"}
                        disabled={updateUser.isPending}
                        onClick={() =>
                          updateUser.mutate({
                            id: user.id,
                            input: { banned: !user.banned },
                          })
                        }
                        className="mt-3 w-full"
                      >
                        {user.banned ? "Desbloquear" : "Bloquear"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 hidden overflow-x-auto lg:block">
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
                        <td className="px-3 py-2 text-zinc-800">
                          {user.name}
                        </td>
                        <td className="px-3 py-2 text-zinc-600">
                          {user.email}
                        </td>
                        <td className="px-3 py-2">
                          {user.role === "seller" ? (
                            <span className="text-xs font-medium text-zinc-600">
                              Vendedor
                            </span>
                          ) : (
                            <UserRoleSelect
                              role={user.role}
                              disabled={isSelf || updateUser.isPending}
                              className="text-base lg:text-xs"
                              onChange={(role) =>
                                updateUser.mutate({
                                  id: user.id,
                                  input: { role },
                                })
                              }
                            />
                          )}
                        </td>
                        <td className="px-3 py-2 text-zinc-600">
                          {sellerName ?? "—"}
                        </td>
                        <td className="px-3 py-2">
                          <UserStatusBadge banned={user.banned} />
                        </td>
                        <td className="px-3 py-2">
                          {isSelf ? (
                            <span className="text-xs text-zinc-400">—</span>
                          ) : (
                            <Button
                              variant={user.banned ? "secondary" : "danger"}
                              size="sm"
                              disabled={updateUser.isPending}
                              onClick={() =>
                                updateUser.mutate({
                                  id: user.id,
                                  input: { banned: !user.banned },
                                })
                              }
                            >
                              {user.banned ? "Desbloquear" : "Bloquear"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
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
  regenerating,
  onRegenerate,
  onDelete,
}: {
  invite: AdminInvite;
  regenerating: boolean;
  onRegenerate: () => void;
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
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onRegenerate}
          disabled={regenerating}
          title="Emite un enlace nuevo y anula el anterior"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Regenerar
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
          Revocar
        </Button>
      </div>
    </li>
  );
}
