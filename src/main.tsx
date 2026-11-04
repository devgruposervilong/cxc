import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { initInstallPrompt } from "./lib/install-prompt";
import { routeTree } from "./routeTree.gen";

initInstallPrompt();

// Tras un deploy los assets viejos dejan de existir y el servidor responde
// con el index.html (fallback SPA), por lo que una pestana abierta con la
// version anterior no puede cargar rutas nuevas y se queda pegada. Recargamos
// una sola vez para tomar la version nueva.
const CHUNK_RELOAD_KEY = "cxc:chunk-reload-at";

window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  try {
    const lastReload = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? 0);
    if (Date.now() - lastReload < 10_000) return;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
  } catch {
    // Sin sessionStorage disponible recargamos igual.
  }
  window.location.reload();
});

// Cuando el service worker nuevo toma el control, la pagina sigue ejecutando
// el bundle anterior: recargamos para que la actualizacion se aplique.
if ("serviceWorker" in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hadController) window.location.reload();
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("No se encontro el elemento #root");
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);
