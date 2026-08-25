//COMPONENTE EN LA RUTA /_COMPONENTS/DASHBOARD-SHELL
import { BarChart3 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { PrismaSellerRepository } from "@/repositories/prisma-seller-repository";
import type { Seller } from "@/lib/types";

// Vendedores activos para el nav del header. Si la BD no está disponible el
// header sigue funcionando sin links.
async function getActiveSellers(): Promise<Seller[]> {
  try {
    const sellers = await new PrismaSellerRepository().getSellers();
    return sellers.filter((s) => s.status === "ACTIVO");
  } catch {
    return [];
  }
}

export default async function DashboardShell({ children }: { children: ReactNode }) {
  const activeSellers = await getActiveSellers();

  return (
    // Mobile: flujo normal con scroll global del documento y ancho completo.
    // Desktop (md+): alto fijo de viewport con scroll interno por panel.
    <div className="flex min-h-screen justify-center bg-zinc-50 md:h-screen md:overflow-hidden">
      <div className="flex w-full flex-col md:w-[80%]">
        <header className="shrink-0 border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur md:px-6 md:py-4">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-semibold text-zinc-900">Cuentas x Cobrar</h1>
            </div>

            {/* Desktop: accesos directos al portal de cada vendedor activo */}
            <nav className="hidden flex-wrap items-center justify-end gap-x-3 gap-y-1 md:flex">
              {activeSellers.map((s) => {
                const fullName = [s.name, s.surname].filter(Boolean).join(" ");
                return (
                  <Link
                    key={s.keyUrl}
                    href={`/vendedor/${s.keyUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 hover:underline"
                    title={`Ver CxC de ${fullName} (abre en otra pestaña)`}
                  >
                    {fullName}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>

        <div className="flex flex-col p-2 md:min-h-0 md:flex-1 md:overflow-hidden md:p-6">{children}</div>
      </div>
    </div>
  );
}
