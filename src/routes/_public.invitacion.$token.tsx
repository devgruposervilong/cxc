import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useAcceptInvite, useInvite } from "@/src/hooks/use-invites";
import { AuthLayout } from "@/src/components/auth-layout";
import { Alert, Button, TextField, fieldErrors } from "@/src/components/ui";

export const Route = createFileRoute("/_public/invitacion/$token")({
  component: InvitePage,
});

const inviteSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre"),
  password: z.string().min(8, "Minimo 8 caracteres"),
  confirm: z.string().min(8, "Confirma la contrasena"),
});

function InvitePage() {
  const { token } = Route.useParams();
  const [error, setError] = useState<string | null>(null);

  const inviteQuery = useInvite(token);
  const acceptInviteMutation = useAcceptInvite(token);

  const form = useForm({
    defaultValues: { name: "", password: "", confirm: "" },
    validators: {
      onSubmit: inviteSchema.refine(
        (value) => value.password === value.confirm,
        { message: "Las contrasenas no coinciden", path: ["confirm"] }
      ),
    },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        const me = await acceptInviteMutation.mutateAsync({
          name: value.name,
          password: value.password,
        });

        if (me?.user.role === "seller" && me.seller) {
          window.location.assign(`/vendedor/${me.seller.keyUrl}`);
          return;
        }

        window.location.assign("/");
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "No se pudo aceptar la invitacion"
        );
      }
    },
  });

  if (inviteQuery.isLoading) {
    return (
      <AuthLayout title="Validando invitacion...">
        <p className="text-sm text-zinc-500">Un momento por favor.</p>
      </AuthLayout>
    );
  }

  if (inviteQuery.isError || !inviteQuery.data) {
    return (
      <AuthLayout title="Invitacion no valida">
        <Alert tone="error">
          {inviteQuery.error instanceof Error
            ? inviteQuery.error.message
            : "La invitacion no existe, ya fue usada o vencio."}
        </Alert>
      </AuthLayout>
    );
  }

  const invite = inviteQuery.data;
  const roleLabel =
    invite.role === "admin" ? "Administrador" : invite.role === "seller" ? "Vendedor" : "Usuario";

  return (
    <AuthLayout
      title="Aceptar invitacion"
      subtitle={
        <>
          Invitacion para <strong>{invite.email}</strong> como{" "}
          <strong>{roleLabel}</strong>
          {invite.sellerName ? ` (${invite.sellerName})` : ""}.
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field name="name" validators={{ onChange: inviteSchema.shape.name }}>
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
          name="password"
          validators={{ onChange: inviteSchema.shape.password }}
        >
          {(field) => (
            <TextField
              label="Contrasena"
              type="password"
              autoComplete="new-password"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              error={fieldErrors(field.state.meta.errors)[0]}
            />
          )}
        </form.Field>

        <form.Field name="confirm">
          {(field) => (
            <TextField
              label="Confirmar contrasena"
              type="password"
              autoComplete="new-password"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              error={fieldErrors(field.state.meta.errors)[0]}
            />
          )}
        </form.Field>

        {error && <Alert tone="error">{error}</Alert>}

        <form.Subscribe selector={(state) => [state.isSubmitting] as const}>
          {([isSubmitting]) => (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando cuenta..." : "Crear cuenta y entrar"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </AuthLayout>
  );
}
