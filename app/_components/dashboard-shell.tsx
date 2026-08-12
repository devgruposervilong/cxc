//COMPONENTE EN LA RUTA /_COMPONENTS/DASHBOARD-SHELL
import { BarChart3 } from "lucide-react";
import type { ReactNode } from "react";

export default function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen justify-center bg-zinc-50">
      <div className="flex w-[60%] flex-col">
        <header className="shrink-0 border-b border-zinc-200 bg-white/80 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-zinc-900">Cuentas x Cobrar</h1>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden p-6">{children}</div>
      </div>
    </div>
  );
}