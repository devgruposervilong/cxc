//COMPONENTE EN LA RUTA /_COMPONENTS/DASHBOARD-SHELL
import { BarChart3 } from "lucide-react";
import type { ReactNode } from "react";

export default function DashboardShell({ children }: { children: ReactNode }) {
  return (
    // Mobile: flujo normal con scroll global del documento y ancho completo.
    // Desktop (md+): alto fijo de viewport con scroll interno por panel.
    <div className="flex min-h-screen justify-center bg-zinc-50 md:h-screen md:overflow-hidden">
      <div className="flex w-full flex-col md:w-[80%]">
        <header className="shrink-0 border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur md:px-6 md:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-zinc-900">Cuentas x Cobrar</h1>
            </div>
          </div>
        </header>

        <div className="flex flex-col p-2 md:min-h-0 md:flex-1 md:overflow-hidden md:p-6">{children}</div>
      </div>
    </div>
  );
}