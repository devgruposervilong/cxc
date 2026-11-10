import { createFileRoute, redirect } from "@tanstack/react-router";

// La seccion Clientes paso a llamarse Tablas. Se conserva esta ruta para que
// los enlaces guardados sigan funcionando.
export const Route = createFileRoute("/_app/clientes")({
  beforeLoad: () => {
    throw redirect({ to: "/tablas" });
  },
});
