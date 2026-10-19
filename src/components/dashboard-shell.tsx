import { Link, useLocation } from "@tanstack/react-router";
import { LogOut, Shield } from "lucide-react";
import type { Seller } from "@/lib/types";
import { useSignOut } from "@/src/hooks/use-auth";
import { useSellers } from "@/src/hooks/use-sellers";
import type { Me } from "@/src/lib/api";
import { ActiveSellersNav } from "./active-sellers-nav";
import { InstallAppButton } from "./install-app-button";
import { Button, cn } from "./ui";

export function DashboardShell({
  me,
  children,
}: {
  me: Me;
  children: React.ReactNode;
}) {
  const { pathname } = useLocation();
  const isSeller = me.user.role === "seller";

  const signOut = useSignOut();
  const sellersQuery = useSellers(!isSeller);
  const sellers: Seller[] = sellersQuery.data ?? [];

  const roleLabel =
    me.user.role === "admin"
      ? "Admin"
      : me.user.role === "seller"
        ? "Vendedor"
        : "Usuario";

  return (
    <div className="flex min-h-screen justify-center bg-zinc-50 md:h-screen md:overflow-hidden">
      <div className="flex w-full flex-col md:w-[80%]">
        <header className="shrink-0 border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur md:px-6 md:py-4">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900">
                <img
                  src="/logo-mark-white.png"
                  alt=""
                  className="h-6 w-6"
                  draggable={false}
                />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold text-zinc-900">
                  Cuentas x Cobrar
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ActiveSellersNav
                sellers={sellers}
                pathname={pathname}
                isSeller={isSeller}
                sellerKeyUrl={me.seller?.keyUrl}
              />

              <InstallAppButton />

              <div className="flex items-center gap-2">
                {me.user.role === "admin" && (
                  <Link
                    to="/admin/usuarios"
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition",
                      pathname === "/admin/usuarios"
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    )}
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Usuarios
                  </Link>
                )}

                <div className="hidden items-center gap-2 sm:flex">
                  <div className="text-right leading-tight">
                    <p className="max-w-[160px] truncate text-xs font-medium text-zinc-800">
                      {me.user.name}
                    </p>
                    <p className="text-[11px] text-zinc-500">{roleLabel}</p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut.mutate()}
                  disabled={signOut.isPending}
                  title="Cerrar sesion"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {signOut.isPending ? "Saliendo..." : "Salir"}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-col p-2 md:min-h-0 md:flex-1 md:overflow-hidden md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
