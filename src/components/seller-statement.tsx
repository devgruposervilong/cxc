import { useMemo } from "react";
import type { DataRow } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { CxcTable } from "./cxc-table";
import { ClientCardsMobile, type ClientCardGroup } from "./client-cards-mobile";

export type SellerStatementProps = {
  fullName: string;
  zone: string | null;
  loadedAt: string;
  rows: DataRow[];
};

export function SellerStatement({
  fullName,
  zone,
  loadedAt,
  rows,
}: SellerStatementProps) {
  const totalInvoices = rows.filter((fila) => fila.type === "FACT").length;
  const totalCreditNotes = rows.filter((fila) => fila.type === "N/CR").length;
  const vencidas = rows.filter(
    (fila) => fila.overdueDays >= 15 && fila.type === "FACT"
  ).length;

  const groups = useMemo<ClientCardGroup[]>(() => {
    const map = new Map<string, DataRow[]>();
    for (const fila of rows) {
      const client = fila.client ?? "SIN CLIENTE";
      if (!map.has(client)) map.set(client, []);
      map.get(client)!.push(fila);
    }

    const result = Array.from(map.entries()).map(([client, docs]) => {
      const validRanks = docs
        .map((doc) => Number(doc.rank))
        .filter((rank) => Number.isFinite(rank));
      const rank = validRanks.length ? Math.min(...validRanks) : Infinity;
      const subtotal = docs.reduce((sum, doc) => sum + (doc.total ?? 0), 0);
      return { client, rank, docs, subtotal };
    });

    result.sort((a, b) => a.rank - b.rank);
    return result;
  }, [rows]);

  const grandTotal = groups.reduce((sum, group) => sum + group.subtotal, 0);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-zinc-900">{fullName}</h2>
          <p className="text-sm text-zinc-500">
            {zone ? `${zone} · ` : ""}
            {loadedAt ? `Actualizado: ${loadedAt}` : "Sin carga de datos activa"}
          </p>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm md:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Facturas
          </p>
          <p className="mt-1 text-lg font-semibold text-zinc-900 md:text-2xl">
            {totalInvoices}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm md:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Notas de Credito
          </p>
          <p className="mt-1 text-lg font-semibold text-zinc-900 md:text-2xl">
            {totalCreditNotes}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm md:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Facturas Vencidas (+15 dias)
          </p>
          <p
            className={`mt-1 text-lg font-semibold md:text-2xl ${
              vencidas > 0 ? "text-red-600" : "text-zinc-900"
            }`}
          >
            {vencidas}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm md:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Total Cuentas x Cobrar
          </p>
          <p className="mt-1 text-lg font-semibold text-emerald-600 md:text-2xl">
            {formatCurrency(grandTotal)}
          </p>
        </div>
      </div>

      <div className="md:hidden">
        <ClientCardsMobile groups={groups} showShare />
      </div>

      <div className="hidden min-h-0 flex-1 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-sm md:block">
        <CxcTable
          rows={rows}
          showSeller={false}
          showActions={false}
          showShare={false}
          emptyMessage="No hay cuentas por cobrar asignadas en este momento."
        />
      </div>
    </div>
  );
}
