import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useSignIn } from "@/src/hooks/use-auth";
import { AuthLayout } from "@/src/components/auth-layout";
import { Alert, Button, TextField, fieldErrors } from "@/src/components/ui";

export const Route = createFileRoute("/_public/login")({
  validateSearch: (
    search: Record<string, unknown>
  ): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: LoginPage,
});

const loginSchema = z.object({
  email: z.string().trim().email("Correo invalido"),
  password: z.string().min(1, "La contrasena es obligatoria"),
});

function LoginPage() {
  const search = Route.useSearch();
  const [error, setError] = useState<string | null>(null);
  const signIn = useSignIn();

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onSubmit: loginSchema },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        const me = await signIn.mutateAsync({
          email: value.email.trim().toLowerCase(),
          password: value.password,
        });

        if (me?.user.role === "seller" && me.seller) {
          window.location.assign(search.redirect ?? `/vendedor/${me.seller.keyUrl}`);
          return;
        }

        window.location.assign(search.redirect ?? "/");
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "No se pudo iniciar sesion"
        );
      }
    },
  });

  return (
    <AuthLayout
      title="Iniciar sesion"
                subtitle="Acceso restringido. Las cuentas se crean por invitacion."
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field
          name="email"
          validators={{ onChange: loginSchema.shape.email }}
        >
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
          validators={{ onChange: loginSchema.shape.password }}
        >
          {(field) => (
            <TextField
              label="Contrasena"
              type="password"
              autoComplete="current-password"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              error={fieldErrors(field.state.meta.errors)[0]}
            />
          )}
        </form.Field>

        {error && <Alert tone="error">{error}</Alert>}

        <form.Subscribe
          selector={(state) => [state.isSubmitting] as const}
        >
          {([isSubmitting]) => (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          )}
        </form.Subscribe>

        <p className="text-center text-xs text-zinc-500">
          <Link to="/setup" className="text-emerald-600 hover:underline">
            Configuracion inicial
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
