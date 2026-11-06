import { Link, useLocation } from "@tanstack/react-router";
import { LogOut, Users } from "lucide-react";
import type { Seller } from "@/lib/types";
import { useSignOut } from "@/src/hooks/use-auth";
import { useSellers } from "@/src/hooks/use-sellers";
import type { Me } from "@/src/lib/api";
import { ActiveSellersNav } from "./active-sellers-nav";
import { HeaderActionsProvider, HeaderActionsSlot } from "./header-actions";
import { Button, Tooltip, cn, iconButtonClass } from "./ui";

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

  return (
    <HeaderActionsProvider>
      <div className="flex min-h-screen justify-center bg-zinc-50 md:h-screen md:overflow-hidden">
        <div className="flex w-full flex-col md:w-[80%]">
          <header className="relative z-40 shrink-0 border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur md:px-6 md:py-4">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <Link
                to="/"
                aria-label="Ir al inicio"
                title="Ir al inicio"
                className="flex min-w-0 shrink-0 cursor-pointer items-center gap-3 rounded-xl transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
              >
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
              </Link>

              <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                <ActiveSellersNav
                  sellers={sellers}
                  pathname={pathname}
                  isSeller={isSeller}
                  sellerKeyUrl={me.seller?.keyUrl}
                />

                <HeaderActionsSlot />

                {me.user.role === "admin" && (
                  <Tooltip label="Usuarios">
                    <Link
                      to="/admin/usuarios"
                      aria-label="Usuarios"
                      className={cn(
                        iconButtonClass,
                        pathname === "/admin/usuarios"
                          ? "bg-zinc-900 text-white hover:bg-zinc-900 hover:text-white"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                      )}
                    >
                      <Users className="h-4 w-4" />
                    </Link>
                  </Tooltip>
                )}

                <Tooltip label={signOut.isPending ? "Saliendo..." : "Salir"}>
                  <Button
                    variant="ghost"
                    onClick={() => signOut.mutate()}
                    disabled={signOut.isPending}
                    aria-label="Cerrar sesion"
                    className="h-9 w-9 px-0 py-0"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </Tooltip>
              </div>
            </div>
          </header>

          <div className="flex flex-col p-2 md:min-h-0 md:flex-1 md:overflow-hidden md:p-6">
            {children}
          </div>
        </div>
      </div>
    </HeaderActionsProvider>
  );
}
