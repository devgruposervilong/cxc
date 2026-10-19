import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useSetupAdmin } from "@/src/hooks/use-setup";
import { setupStatusQueryOptions } from "@/src/lib/queries";
import { AuthLayout } from "@/src/components/auth-layout";
import { Alert, Button, TextField, fieldErrors } from "@/src/components/ui";

export const Route = createFileRoute("/_public/setup")({
  beforeLoad: async ({ context }) => {
    const status = await context.queryClient.ensureQueryData(
      setupStatusQueryOptions()
    );
    if (!status.needsSetup) {
      throw redirect({ to: "/login" });
    }
  },
  component: SetupPage,
});

const setupSchema = z.object({
  token: z.string().min(1, "El token es obligatorio"),
  name: z.string().trim().min(2, "Escribe tu nombre"),
  email: z.string().trim().email("Correo invalido"),
  password: z.string().min(8, "Minimo 8 caracteres"),
});

function SetupPage() {
  const [error, setError] = useState<string | null>(null);
  const setup = useSetupAdmin();

  const form = useForm({
    defaultValues: { token: "", name: "", email: "", password: "" },
    validators: { onSubmit: setupSchema },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await setup.mutateAsync({
          token: value.token,
          name: value.name,
          email: value.email.trim().toLowerCase(),
          password: value.password,
        });

        window.location.assign("/");
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "No se pudo completar la configuracion"
        );
      }
    },
  });

  return (
    <AuthLayout
      title="Configuracion inicial"
      subtitle="Crea el primer administrador. Solo funciona una vez y requiere el token de instalacion."
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field name="token" validators={{ onChange: setupSchema.shape.token }}>
          {(field) => (
            <TextField
              label="Token de instalacion"
              type="password"
              autoComplete="off"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              error={fieldErrors(field.state.meta.errors)[0]}
            />
          )}
        </form.Field>

        <form.Field name="name" validators={{ onChange: setupSchema.shape.name }}>
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

        <form.Field name="email" validators={{ onChange: setupSchema.shape.email }}>
          {(field) => (
            <TextField
              label="Correo"
              type="email"
              autoComplete="email"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              error={fieldErrors(field.state.meta.errors)[0]}
            />
          )}
        </form.Field>

        <form.Field
          name="password"
          validators={{ onChange: setupSchema.shape.password }}
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

        {error && <Alert tone="error">{error}</Alert>}

        <form.Subscribe selector={(state) => [state.isSubmitting] as const}>
          {([isSubmitting]) => (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando..." : "Crear administrador"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </AuthLayout>
  );
}
