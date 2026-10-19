import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFound,
});

function RootComponent() {
  return <Outlet />;
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="text-center">
        <p className="text-sm font-medium text-zinc-500">404</p>
        <h1 className="mt-2 text-xl font-semibold text-zinc-900">
          Pagina no encontrada
        </h1>
        <a
          href="/"
          className="mt-4 inline-block text-sm text-emerald-600 hover:underline"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
}
