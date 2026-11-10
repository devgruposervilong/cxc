import { Link, useLocation } from "@tanstack/react-router";
import { DatabaseSearch, LogOut, Users } from "lucide-react";
import type { Seller } from "@/lib/types";
import { useSignOut } from "@/src/hooks/use-auth";
import { useSellers } from "@/src/hooks/use-sellers";
import type { Me } from "@/src/lib/api";
import { ActiveSellersNav } from "./active-sellers-nav";
import {
  HeaderActionsMenu,
  HeaderActionsProvider,
  HeaderActionsSlot,
} from "./header-actions";
import {
  Button,
  Tooltip,
  cn,
  iconButtonClass,
  menuItemClass,
} from "./ui";

export function DashboardShell({
  me,
  children,
}: {
  me: Me;
  children: React.ReactNode;
}) {
  const { pathname } = useLocation();
  const isSeller = me.user.role === "seller";
  const canViewTables = !isSeller;

  const signOut = useSignOut();
  const sellersQuery = useSellers(!isSeller);
  const sellers: Seller[] = sellersQuery.data ?? [];

  return (
    <HeaderActionsProvider>
      <div className="flex min-h-screen justify-center bg-zinc-50 md:h-screen md:overflow-hidden">
        <div className="flex w-full flex-col md:w-[80%]">
          <header className="relative z-40 shrink-0 border-b border-zinc-200 bg-white/80 px-3 py-3 backdrop-blur sm:px-4 md:px-6 md:py-4">
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 md:justify-between lg:gap-x-4">
              <Link
                to="/"
                aria-label="Ir al inicio"
                title="Ir al inicio"
                className="relative flex w-full min-w-0 shrink-0 cursor-pointer items-center justify-center gap-3 rounded-xl px-12 transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 md:w-auto md:justify-start md:px-0"
              >
                <div className="absolute left-0 top-1/2 flex h-10 w-10 shrink-0 -translate-y-1/2 items-center justify-center rounded-xl bg-zinc-900 md:static md:translate-y-0">
                  <img
                    src="/logo-mark-white.png"
                    alt=""
                    className="h-6 w-6"
                    draggable={false}
                  />
                </div>
                <div className="min-w-0 text-center md:text-left">
                  <h1 className="truncate text-xl font-semibold text-zinc-900">
                    Cuentas x Cobrar
                  </h1>
                </div>
              </Link>

              <div className="relative flex w-full flex-wrap items-center justify-center gap-1.5 md:ml-auto md:w-auto md:justify-end lg:gap-2">
                <ActiveSellersNav
                  sellers={sellers}
                  pathname={pathname}
                  isSeller={isSeller}
                  sellerKeyUrl={me.seller?.keyUrl}
                />

                <div className="hidden items-center gap-1 md:flex lg:gap-1.5">
                  <HeaderActionsSlot target="desktop" />

                  {canViewTables && (
                    <Tooltip label="Tablas">
                      <Link
                        to="/tablas"
                        aria-label="Tablas"
                        className={cn(
                          iconButtonClass,
                          pathname === "/tablas"
                            ? "bg-zinc-900 text-white hover:bg-zinc-900 hover:text-white"
                            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                        )}
                      >
                        <DatabaseSearch className="h-4 w-4" />
                      </Link>
                    </Tooltip>
                  )}

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

                <HeaderActionsMenu>
                  {canViewTables && (
                    <Link
                      to="/tablas"
                      role="menuitem"
                      aria-current={pathname === "/tablas" ? "page" : undefined}
                      className={cn(
                        menuItemClass,
                        pathname === "/tablas" && "bg-zinc-100 text-zinc-900"
                      )}
                    >
                      <DatabaseSearch className="h-4 w-4 shrink-0" />
                      Tablas
                    </Link>
                  )}

                  {me.user.role === "admin" && (
                    <Link
                      to="/admin/usuarios"
                      role="menuitem"
                      aria-current={
                        pathname === "/admin/usuarios" ? "page" : undefined
                      }
                      className={cn(
                        menuItemClass,
                        pathname === "/admin/usuarios" &&
                          "bg-zinc-100 text-zinc-900"
                      )}
                    >
                      <Users className="h-4 w-4 shrink-0" />
                      Usuarios
                    </Link>
                  )}

                  <button
                    type="button"
                    role="menuitem"
                    disabled={signOut.isPending}
                    onClick={() => signOut.mutate()}
                    className={menuItemClass}
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {signOut.isPending ? "Saliendo..." : "Salir"}
                  </button>
                </HeaderActionsMenu>
              </div>
            </div>
          </header>

          <div className="flex flex-col p-3 sm:p-4 md:min-h-0 md:flex-1 md:overflow-hidden md:p-6">
            {children}
          </div>
        </div>
      </div>
    </HeaderActionsProvider>
  );
}
