import { useState } from "react";
import { Building2, Table2, UserRound } from "lucide-react";
import { useClients } from "@/src/hooks/use-clients";
import { useSellersCatalog } from "@/src/hooks/use-sellers";
import { cn } from "./ui";
import { ClientsTable } from "./tables-clients";
import { SellersTable } from "./tables-sellers";

type TableTab = "clients" | "sellers";

function TabButton({
  selected,
  icon,
  label,
  count,
  onClick,
}: {
  selected: boolean;
  icon: React.ReactNode;
  label: string;
  count: number | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
        selected
          ? "bg-zinc-900 text-white shadow-sm"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      )}
    >
      {icon}
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
          selected ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-500"
        )}
      >
        {count ?? "—"}
      </span>
    </button>
  );
}

export function TablesPage({ canManage }: { canManage: boolean }) {
  const [tab, setTab] = useState<TableTab>("clients");
  const clientsQuery = useClients();
  const sellersQuery = useSellersCatalog();

  const clients = clientsQuery.data?.clients ?? [];
  const businessUnits = clientsQuery.data?.businessUnits ?? [];
  const sellers = sellersQuery.data ?? [];

  return (
    <div className="flex h-full min-w-0 flex-col gap-4 overflow-y-auto">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Tablas</h2>
          <p className="text-sm text-zinc-500">
            Maestros de clientes y vendedores registrados en la base de datos.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm ring-1 ring-zinc-200">
          <Table2 className="h-3.5 w-3.5 text-zinc-400" />2 tablas
        </span>
      </div>

      <div
        role="tablist"
        aria-label="Tablas del sistema"
        className="flex w-fit max-w-full flex-wrap items-center gap-1 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm"
      >
        <TabButton
          selected={tab === "clients"}
          icon={<Building2 className="h-4 w-4" />}
          label="Clientes"
          count={clientsQuery.data ? clients.length : null}
          onClick={() => setTab("clients")}
        />
        <TabButton
          selected={tab === "sellers"}
          icon={<UserRound className="h-4 w-4" />}
          label="Vendedores"
          count={sellersQuery.data ? sellers.length : null}
          onClick={() => setTab("sellers")}
        />
      </div>

      <div
        role="tabpanel"
        aria-label={tab === "clients" ? "Clientes" : "Vendedores"}
        className="flex min-h-0 min-w-0 flex-1 flex-col"
      >
        {tab === "clients" ? (
          <ClientsTable
            clients={clients}
            businessUnits={businessUnits}
            canManage={canManage}
            isPending={clientsQuery.isPending}
            isError={clientsQuery.isError}
            error={clientsQuery.error}
            onRetry={() => void clientsQuery.refetch()}
          />
        ) : (
          <SellersTable
            sellers={sellers}
            canManage={canManage}
            isPending={sellersQuery.isPending}
            isError={sellersQuery.isError}
            error={sellersQuery.error}
            onRetry={() => void sellersQuery.refetch()}
          />
        )}
      </div>
    </div>
  );
}
